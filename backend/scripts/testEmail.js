import path from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'
import { sendWelcomeEmail } from '../utils/mailer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(__dirname, '..', '.env') })

async function run() {
  const targetEmail = process.argv[2] || process.env.SMTP_USER || 'test@example.com'
  console.log(`\n========================================`)
  console.log(`Alpha Rent Ethiopia — Email Mailer Test`)
  console.log(`========================================`)
  console.log(`Target recipient: ${targetEmail}`)
  console.log(`SMTP configured:  ${Boolean(process.env.SMTP_USER && process.env.SMTP_PASS)}`)
  console.log(`SMTP User:        ${process.env.SMTP_USER ? process.env.SMTP_USER.slice(0, 3) + '***' : '(not set)'}`)
  console.log(`SMTP Host:        ${process.env.SMTP_HOST || 'smtp.gmail.com (default)'}`)
  console.log(`----------------------------------------`)

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`Notice: SMTP_USER or SMTP_PASS is empty in backend/.env.`)
    console.log(`To send real emails, set:`)
    console.log(`  SMTP_USER=your_email@gmail.com`)
    console.log(`  SMTP_PASS=your_16_char_app_password`)
    console.log(`(Generate App Password at: https://myaccount.google.com/apppasswords)\n`)
  }

  console.log(`Sending welcome confirmation email...`)
  const result = await sendWelcomeEmail({
    to: targetEmail,
    name: 'Abebe Bikila',
    role: 'tenant',
  })

  console.log(`Result:`, result)
  if (result.sent) {
    console.log(`SUCCESS! Email dispatched to ${targetEmail}. Please check your inbox / spam folder.`)
  } else if (result.skipped) {
    console.log(`SKIPPED: SMTP is not configured in backend/.env. Account creation will still work normally.`)
  } else {
    console.log(`FAILED: ${result.error}`)
    console.log(`Troubleshooting tips for Gmail:`)
    console.log(`1. Ensure 2-Step Verification is ON in your Google Account.`)
    console.log(`2. Generate a 16-character App Password at https://myaccount.google.com/apppasswords.`)
    console.log(`3. Paste the 16 characters into SMTP_PASS without spaces.`)
  }
  console.log(`========================================\n`)
}

run()
