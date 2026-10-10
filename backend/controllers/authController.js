import User from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { signToken } from '../utils/token.js'

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

  const token = signToken(user.id)
  res.status(201).json({ success: true, data: { token, user } })
})

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { data: { token, user } }
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

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
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  if (!clientId || !redirectUri) {
    throw new AppError('Google sign-in is not configured on the server', 503)
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
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user })
})
