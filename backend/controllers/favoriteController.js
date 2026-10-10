import Favorite from '../models/Favorite.js'
import Property from '../models/Property.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { isObjectId } from '../middleware/validate.js'

/**
 * GET /api/favorites
 * Requires: Bearer token
 * Returns: { data: [favorite...] } where each favorite exposes propertyId.
 */
export const getFavorites = asyncHandler(async (req, res) => {
  const data = await Favorite.find({ user: req.user.id })
    .populate('property', 'title')
    .sort({ createdAt: -1 })
  res.status(200).json({ success: true, data })
})

/**
 * POST /api/favorites/:propertyId
 * Requires: Bearer token
 * Returns: { data: favorite }
 */
export const addFavorite = asyncHandler(async (req, res) => {
  const { propertyId } = req.params
  if (!isObjectId(propertyId)) {
    throw new AppError('Invalid property id', 400)
  }

  const property = await Property.findById(propertyId)
  if (!property) {
    throw new AppError('Property not found', 404)
  }

  const existing = await Favorite.findOne({ user: req.user.id, property: propertyId })
  if (existing) {
    return res.status(200).json({ success: true, data: existing })
  }

  const favorite = await Favorite.create({ user: req.user.id, property: propertyId })
  res.status(201).json({ success: true, data: favorite })
})

/**
 * DELETE /api/favorites/:propertyId
 * Requires: Bearer token
 * Returns: { success: true }
 */
export const removeFavorite = asyncHandler(async (req, res) => {
  const { propertyId } = req.params
  if (!isObjectId(propertyId)) {
    throw new AppError('Invalid property id', 400)
  }

  const favorite = await Favorite.findOneAndDelete({ user: req.user.id, property: propertyId })
  if (!favorite) {
    throw new AppError('Favorite not found', 404)
  }

  res.status(200).json({ success: true })
})
