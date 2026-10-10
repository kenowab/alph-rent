/**
 * Creates (or promotes) a platform admin and backfills existing listings.
 *
 * Safe, idempotent command that never wipes or drops data:
 *   - If a user with ADMIN_EMAIL already exists and is an admin, nothing changes.
 *   - If the user exists with a different role, they are promoted to admin.
 *   - Otherwise a new admin account is created (password hashed by the User model).
 *   - Existing properties without an approvalStatus are marked approved so live
 *     listings keep appearing for tenants (data migration, no deletion).
 *
 * Usage (from server/):
 *   npm run create:admin
 *
 * Requires server/.env with MONGO_URI and JWT_SECRET.
 *   ADMIN_EMAIL     (default admin@alpharent.et)
 *   ADMIN_PASSWORD  (required in production)
 */
import path from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'
import { connectDB, disconnectDB } from '../config/database.js'
import User from '../models/User.js'
import Property from '../models/Property.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(__dirname, '../.env') })

const email = (process.env.ADMIN_EMAIL || 'admin@alpharent.et').toLowerCase()
const password = process.env.ADMIN_PASSWORD || 'admin1234'

async function main() {
  await connectDB()

  const existing = await User.findOne({ email })

  if (existing) {
    if (existing.role === 'admin') {
      console.log(`Admin already exists — nothing changed (${email})`)
    } else {
      existing.role = 'admin'
      await existing.save()
      console.log(`User ${email} promoted to admin`)
    }
  } else {
    if (!process.env.ADMIN_PASSWORD) {
      console.warn('WARNING: ADMIN_PASSWORD not set — using the development fallback password.')
    }
    await User.create({
      name: 'Alpha Admin',
      email,
      password,
      phone: '+251 900 000 000',
      role: 'admin',
      avatarSeed: 1,
      verified: true,
      responseRate: 100,
    })
    console.log(`Admin created: ${email}`)
  }

  // Data migration: keep existing live listings visible to tenants by treating
  // them as approved. New owner-created properties default to 'pending'.
  const backfill = await Property.updateMany(
    { approvalStatus: { $exists: false } },
    { $set: { approvalStatus: 'approved' } },
  )
  console.log(`Backfilled ${backfill.modifiedCount} existing property(ies) to approved`)

  await disconnectDB()
  console.log('\nDone. You can now log in with the admin credentials at /login.')
}

main().catch(async (err) => {
  console.error('createAdmin failed:', err.message)
  await disconnectDB().catch(() => {})
  process.exitCode = 1
})
