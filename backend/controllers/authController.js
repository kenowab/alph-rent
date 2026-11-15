import { createHash, randomBytes } from 'node:crypto'
import User from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { normalizeRequestedRole, validateRequestedRole } from '../utils/authRoles.js'
import { signToken } from '../utils/token.js'
import { sendWelcomeEmail, resendWelcomeEmail, sendPasswordResetEmail } from '../utils/mailer.js'

/**
 * POST /api/auth/register
 * Body: { name, email, password, phone?, role? }
 * Returns: { data: { token, user } }
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone = '', role = 'tenant' } = req.body

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) {
    throw new AppError('An account with this email already exists', 409)
  }

  if (!['tenant', 'owner'].includes(role)) {
    throw new AppError('Role must be either tenant or owner', 400)
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone,
    role,
    avatarSeed: Math.floor(Math.random() * 1000),
  })

  // Send the welcome/confirmation email immediately upon registration.
  // The account is immediately usable without requiring email verification.
  // Email sending failure is logged safely and will never block registration.
  try {
    await sendWelcomeEmail({ to: user.email, name: user.name, role: user.role })
  } catch {
    console.error('[auth] Welcome email attempt failed; registration will continue')
  }

  const token = signToken(user.id)
  res.status(201).json({ success: true, data: { token, user } })
})

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { data: { token, user } }
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password, role: requestedRole } = req.body
  const normalizedRequestedRole = normalizeRequestedRole(requestedRole)

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
  if (!user) {
    throw new AppError('Invalid email or password', 401)
  }
  if (user.active === false) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403)
  }
  if (user.googleId && !user.password) {
    throw new AppError('This account uses Google sign-in — please continue with Google', 401)
  }
  if (!(await user.matchPassword(password))) {
    throw new AppError('Invalid email or password', 401)
  }

  if (normalizedRequestedRole && user.role !== normalizedRequestedRole) {
    throw new AppError(
      `This account is registered as a ${user.role}. Please sign in from the ${user.role} login screen.`,
      403,
    )
  }

  validateRequestedRole(normalizedRequestedRole, user.role)

  const token = signToken(user.id)
  res.status(200).json({ success: true, data: { token, user } })
})

/**
 * GET /api/auth/google
 * Query: { role?: 'tenant' | 'owner' }
 * Redirects the browser to Google's consent screen. The chosen role is
 * carried through the OAuth `state` parameter so a brand-new account can
 * be created with the correct role.
 */
export const googleAuth = asyncHandler(async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) {
    throw new AppError(
      'Google sign-in is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in backend/.env.',
      503,
    )
  }

  const role = req.query.role === 'owner' ? 'owner' : 'tenant'
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: role,
    access_type: 'online',
    prompt: 'select_account',
  })

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
})

/**
 * GET /api/auth/google/callback
 * Query: { code, state }
 * Exchanges the authorization code for tokens, verifies the Google profile,
 * finds or creates the user, then redirects the browser back to the SPA with
 * a signed JWT in the query string.
 */
export const googleCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    throw new AppError(
      'Google sign-in is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in backend/.env.',
      503,
    )
  }
  if (!code) {
    throw new AppError('Google sign-in was cancelled or failed', 400)
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })
  const tokens = await tokenResponse.json()
  if (!tokens.id_token) {
    throw new AppError('Google sign-in failed — could not exchange the code', 401)
  }

  // Let Google verify the ID token's signature/expiry and return the profile.
  const infoResponse = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`,
  )
  const profile = await infoResponse.json()
  if (!profile.sub || !profile.email) {
    throw new AppError('Could not verify your Google account', 401)
  }

  const email = profile.email.toLowerCase()
  const role = state === 'owner' ? 'owner' : 'tenant'

  let user = await User.findOne({ email })
  if (!user) {
    user = await User.create({
      name: profile.name || email.split('@')[0],
      email,
      googleId: profile.sub,
      role,
      avatar: profile.picture || '',
      avatarSeed: Math.floor(Math.random() * 1000),
      verified: Boolean(profile.email_verified),
    })
  } else {
    if (!user.googleId) {
      user.googleId = profile.sub
    }
    if (profile.picture) {
      user.avatar = profile.picture
    }
    await user.save()
  }

  const token = signToken(user.id)
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
  const redirect = new URL(callbackUrl)
  redirect.searchParams.set('token', token)
  res.redirect(redirect.toString())
})

/**
 * GET /api/auth/me
 * Requires: Bearer token
 * Returns: { data: user }
 */
export const resendEmail = asyncHandler(async (req, res) => {
  const { email, name, role } = req.body
  const normalizedEmail = String(email || '').trim().toLowerCase()

  if (!normalizedEmail) {
    throw new AppError('Please provide an email address', 400)
  }

  const user = await User.findOne({ email: normalizedEmail })
  if (!user) {
    throw new AppError('No account was found for that email address', 404)
  }

  const result = await resendWelcomeEmail({
    to: user.email,
    name: name || user.name,
    role: role || user.role,
  })

  if (!result.sent) {
    if (result.skipped) {
      throw new AppError('Email delivery is not configured right now. Please try again later.', 503)
    }
    throw new AppError(result.error || 'Could not resend the email right now.', 502)
  }

  res.status(200).json({
    success: true,
    message: 'A fresh email has been sent successfully.',
    data: {
      email: user.email,
      role: user.role,
    },
  })
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const user = await User.findOne({ email })

  if (user) {
    const resetToken = randomBytes(32).toString('hex')
    user.passwordResetToken = createHash('sha256').update(resetToken).digest('hex')
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000)
    await user.save()

    let emailAccepted = false
    try {
      const result = await sendPasswordResetEmail({ to: user.email, name: user.name, token: resetToken })
      emailAccepted = result.sent
    } catch {
      console.error('[auth] Password reset email attempt failed; reset token invalidated')
    }
    if (!emailAccepted) {
      user.passwordResetToken = undefined
      user.passwordResetExpires = undefined
      await user.save()
    }
  }

  res.status(200).json({
    success: true,
    message: 'If an account exists for that email and email delivery is available, password reset instructions will be sent.',
  })
})

export const resetPassword = asyncHandler(async (req, res) => {
  const tokenHash = createHash('sha256').update(req.body.token).digest('hex')
  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+password +passwordResetToken +passwordResetExpires')

  if (!user) {
    throw new AppError('This password reset link is invalid or has expired. Request a new one.', 400)
  }

  user.password = req.body.password
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()

  res.status(200).json({ success: true, message: 'Your password has been reset. You can now sign in.' })
})

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user })
})
