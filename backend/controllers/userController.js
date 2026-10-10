import User from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { isObjectId } from '../middleware/validate.js'

/**
 * GET /api/users
 * Requires: Bearer token (admin)
 */
export const getUsers = asyncHandler(async (req, res) => {
  const data = await User.find().sort({ createdAt: -1 })
  res.status(200).json({ success: true, data })
})

/**
 * GET /api/users/:id
 * Public profile (never exposes the password).
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!isObjectId(id)) {
    throw new AppError('Invalid user id', 400)
  }
  const user = await User.findById(id).select('-password')
  if (!user) {
    throw new AppError('User not found', 404)
  }
  res.status(200).json({ success: true, data: user })
})

/**
 * PUT /api/users/:id
 * Requires: Bearer token — the same user or an admin
 * Body: { name?, email?, phone?, city?, bio? }
 * Returns: { data: user }
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!isObjectId(id)) {
    throw new AppError('Invalid user id', 400)
  }
  if (req.user.id !== id && req.user.role !== 'admin') {
    throw new AppError('You can only update your own profile', 403)
  }

  const user = await User.findById(id)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  const { name, email, phone, city, bio } = req.body
  const update = {}

  if (name !== undefined) {
    if (!name.trim()) throw new AppError('Name cannot be empty', 400)
    update.name = name.trim()
  }
  if (email !== undefined) {
    const normalized = email.toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new AppError('Please provide a valid email address', 400)
    }
    const existing = await User.findOne({ email: normalized })
    if (existing && String(existing._id) !== id) {
      throw new AppError('An account with this email already exists', 409)
    }
    update.email = normalized
  }
  if (phone !== undefined) update.phone = phone
  if (city !== undefined) update.city = city
  if (bio !== undefined) update.bio = bio.slice(0, 500)

  if (req.user.role === 'admin' && req.body.role && ['tenant', 'owner', 'admin'].includes(req.body.role)) {
    update.role = req.body.role
  }

  const updated = await User.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).select('-password')

  res.status(200).json({ success: true, data: updated })
})
