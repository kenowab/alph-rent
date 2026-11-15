import nodemailer from 'nodemailer'

// Email mailer for Alpha Rental Platform.
// Preferred flow:
//   EMAIL_API_KEY / RESEND_API_KEY - API-key based provider (Resend-style)
//   SMTP_USER / SMTP_PASS          - Gmail / SMTP fallback
//
// If no email provider is configured, the mailer safely logs a notice and
// returns without throwing so account creation is never blocked.

let transporter = null

function getEmailApiKey() {
  return process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY || ''
}

async function sendWithApi({ to, subject, text, html }) {
  const apiKey = getEmailApiKey()
  if (!apiKey) {
    return { sent: false, skipped: true, reason: 'EMAIL_API_KEY missing' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: Array.isArray(to) ? to : [to],
        subject,
        text,
        html,
      }),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      return { sent: false, status: response.status }
    }

    return { sent: true, id: payload?.id || null }
  } catch (error) {
    return { sent: false, error }
  }
}

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_SERVICE } = process.env
  if (!SMTP_USER || !SMTP_PASS) return null

  if (!transporter) {
    const host = (SMTP_HOST && SMTP_HOST.trim()) || 'smtp.gmail.com'
    const isGmail = host === 'smtp.gmail.com' || (SMTP_SERVICE && SMTP_SERVICE.toLowerCase() === 'gmail')

    if (isGmail) {
      // Standard Gmail service in Nodemailer — works reliably with Gmail App Passwords.
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      })
    } else {
      const port = Number(SMTP_PORT) || 587
      const secure = String(SMTP_SECURE).toLowerCase() === 'true' || port === 465
      transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      })
    }
  }
  return transporter
}

/** Lightly masks an address for logs (never log credentials/tokens). */
function maskEmail(email) {
  if (!email || !email.includes('@')) return '***'
  const [name, domain] = email.split('@')
  const visible = name.slice(0, 1)
  return `${visible}${'*'.repeat(Math.max(name.length - 1, 1))}@${domain}`
}

function safeErrorDetails(error) {
  const code = typeof error?.code === 'string' && /^[A-Z0-9_]{1,40}$/.test(error.code)
    ? ` code=${error.code}`
    : ''
  const responseCode = Number.isInteger(error?.responseCode) ? error.responseCode : error?.statusCode
  const status = Number.isInteger(responseCode) ? ` status=${responseCode}` : ''
  return `${code}${status}` || ' details redacted'
}

function fromAddress() {
  const name = process.env.EMAIL_FROM_NAME || 'Alpha Rental Platform'
  // When using Gmail SMTP, Google requires the sender to match the authenticated account.
  // Prefer SMTP_USER unless a specific custom non-placeholder EMAIL_FROM_ADDRESS is provided.
  const custom = process.env.EMAIL_FROM_ADDRESS
  const address =
    custom && custom !== 'noreply@alpharent.et'
      ? custom
      : process.env.SMTP_USER || custom || 'noreply@alpharent.et'
  return `"${name}" <${address}>`
}

function welcomeContent({ name, role }) {
  const first = (name || 'there').split(' ')[0]
  const roleLabel = role === 'owner' ? 'Property Owner' : 'Tenant'
  const clientUrl = process.env.CLIENT_BASE_URL || 'http://localhost:3000'
  const loginUrl = `${clientUrl.replace(/\/+$/, '')}/login`

  const subject = 'Welcome to Alpha Rental Platform 🎉'

  const roleBenefits =
    role === 'owner'
      ? 'You can now publish property listings, manage tenant inquiries, and receive viewing requests directly through your dashboard.'
      : 'You can now browse verified rental properties across Addis Ababa and Ethiopia, save your favorites, and submit rental requests directly.'

  const text = [
    `Hi ${first},`,
    '',
    `Welcome to Alpha Rental Platform! Your account has been created successfully as a ${roleLabel}.`,
    '',
    'You can now sign in immediately using your email and password — no email verification is required.',
    '',
    roleBenefits,
    '',
    `Sign in here: ${loginUrl}`,
    '',
    'If you did not create this account, please ignore this email.',
    '',
    '— The Alpha Rental Platform Team',
  ].join('\n')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
    </head>
    <body style="margin:0;padding:24px 12px;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:580px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
        <tr>
          <td style="background:linear-gradient(135deg, #0b6e4f 0%, #15803d 100%);padding:28px 32px;text-align:left;">
            <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
              Alpha Rental Platform
            </div>
            <div style="font-size:13px;color:#dcfce7;margin-top:4px;">
              Your trusted rental marketplace in Ethiopia
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a;">
              Welcome, ${first}! 🎉
            </h1>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
              Your Alpha Rental Platform account has been created successfully as a
              <strong style="color:#0b6e4f;">${roleLabel}</strong>.
            </p>
            <div style="margin:20px 0;padding:16px;background-color:#f0fdf4;border-left:4px solid #16a34a;border-radius:8px;">
              <p style="margin:0;font-size:14px;line-height:1.5;color:#166534;font-weight:600;">
                ✓ Immediate Access
              </p>
              <p style="margin:4px 0 0;font-size:13px;line-height:1.5;color:#15803d;">
                You can sign in right now with your email and password. No email verification link is required before signing in.
              </p>
            </div>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">
              ${roleBenefits}
            </p>
            <div style="margin:28px 0;text-align:center;">
              <a href="${loginUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg, #0b6e4f 0%, #15803d 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:10px;box-shadow:0 2px 6px rgba(11,110,79,0.3);">
                Sign In to Your Account
              </a>
            </div>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />
            <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">
              If you didn't create an account on Alpha Rental Platform, you can safely ignore this message.
            </p>
            <p style="margin:8px 0 0;font-size:12px;line-height:1.5;color:#64748b;">
              — The Alpha Rental Platform Team
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `.trim()

  return { subject, text, html }
}

/**
 * Sends the welcome/registration confirmation email.
 * Never throws: failures are logged safely and reported in the result.
 * Account registration is never blocked if email sending fails.
 *
 * @param {{ to: string, name: string, role?: string }} opts
 * @returns {Promise<{ sent: boolean, skipped?: boolean, error?: string }>}
 */
export async function resendWelcomeEmail({ to, name, role }) {
  return sendWelcomeEmail({ to, name, role })
}

export async function sendWelcomeEmail({ to, name, role }) {
  const { subject, text, html } = welcomeContent({ name, role })
  return deliverEmail({ to, subject, text, html, label: 'welcome email' })
}

export async function sendPasswordResetEmail({ to, name, token }) {
  const clientUrl = process.env.CLIENT_BASE_URL || 'http://localhost:3000'
  const resetUrl = `${clientUrl.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(token)}`
  const subject = 'Reset your Alpha Rental Platform password'
  const first = (name || 'there').split(' ')[0]
  const text = [
    `Hi ${first},`,
    '',
    'We received a request to reset your Alpha Rental Platform password.',
    `Use this link within 15 minutes: ${resetUrl}`,
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n')
  const html = `<p>Hi ${first},</p><p>We received a request to reset your Alpha Rental Platform password.</p><p><a href="${resetUrl}">Reset your password</a>. This link expires in 15 minutes.</p><p>If you did not request this, you can ignore this email.</p>`

  return deliverEmail({ to, subject, text, html, label: 'password reset email' })
}

async function deliverEmail({ to, subject, text, html, label }) {
  const emailApiKey = getEmailApiKey()
  const smtpConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS)
  const apiSelected = Boolean(emailApiKey) && process.env.EMAIL_PROVIDER?.toLowerCase() !== 'smtp'

  if (apiSelected) {
    console.info('[mailer] Provider selected: email API')
    const apiResult = await sendWithApi({ to, subject, text, html })
    if (apiResult.sent) {
      console.info(`[mailer] Email API accepted ${label} for ${maskEmail(to)}`)
      return { sent: true, via: 'api' }
    }

    const status = Number.isInteger(apiResult.status) ? ` status=${apiResult.status}` : ''
    const details = apiResult.error ? safeErrorDetails(apiResult.error) : status || ' details redacted'
    console.error(`[mailer] Email API ${label} delivery failed for ${maskEmail(to)}:${details}`)
    if (!smtpConfigured) {
      console.error('[mailer] SMTP fallback unavailable: SMTP_USER or SMTP_PASS is missing')
      return { sent: false, error: 'Email delivery failed' }
    }
    console.info('[mailer] Falling back to SMTP after email API failure')
  } else if (smtpConfigured) {
    console.info('[mailer] Provider selected: SMTP')
  } else {
    const missing = []
    if (!emailApiKey) missing.push('EMAIL_API_KEY/RESEND_API_KEY')
    if (!process.env.SMTP_USER) missing.push('SMTP_USER')
    if (!process.env.SMTP_PASS) missing.push('SMTP_PASS')
    console.warn(`[mailer] No email provider configured; missing ${missing.join(', ')}. ${label} not sent to ${maskEmail(to)}`)
    return { sent: false, skipped: true }
  }

  try {
    const tx = getTransporter()
    if (!tx) {
      console.error('[mailer] SMTP selected but unavailable: SMTP_USER or SMTP_PASS is missing')
      return { sent: false, error: 'Email delivery failed' }
    }

    const info = await tx.sendMail({
      from: fromAddress(),
      to,
      subject,
      text,
      html,
    })
    if (Array.isArray(info.accepted) && info.accepted.length === 0) {
      console.error(`[mailer] SMTP did not accept ${label} for ${maskEmail(to)}`)
      return { sent: false, error: 'Email delivery failed' }
    }
    console.info(`[mailer] SMTP accepted ${label} for ${maskEmail(to)}`)
    return { sent: true, via: 'smtp' }
  } catch (error) {
    console.error(`[mailer] SMTP ${label} delivery failed for ${maskEmail(to)}:${safeErrorDetails(error)}`)
    return { sent: false, error: 'Email delivery failed' }
  }
}
