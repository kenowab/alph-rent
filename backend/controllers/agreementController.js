import RentalAgreement from '../models/RentalAgreement.js'
import Property from '../models/Property.js'
import Notification from '../models/Notification.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { isObjectId } from '../middleware/validate.js'

function populateAgreement(query) {
  return query
    .populate('property', 'title subArea city price images status')
    .populate('owner', 'name email phone')
    .populate('tenant', 'name email phone')
    .populate('application')
}

/**
 * GET /api/agreements/mine
 * Requires Bearer token (tenant/owner/admin)
 */
export const getMyAgreements = asyncHandler(async (req, res) => {
  const isOwnerRole = req.user.role === 'owner'
  const filter = isOwnerRole ? { owner: req.user.id } : { tenant: req.user.id }

  const data = await populateAgreement(
    RentalAgreement.find(filter).sort({ createdAt: -1 }),
  )
  res.status(200).json({ success: true, data })
})

/**
 * GET /api/agreements/:id
 * Requires Bearer token
 */
export const getAgreementById = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!isObjectId(id)) {
    throw new AppError('Invalid agreement id', 400)
  }

  const agreement = await populateAgreement(RentalAgreement.findById(id))
  if (!agreement) {
    throw new AppError('Agreement not found', 404)
  }

  const isOwner = String(agreement.owner?._id || agreement.owner) === req.user.id
  const isTenant = String(agreement.tenant?._id || agreement.tenant) === req.user.id
  const isAdmin = req.user.role === 'admin'

  if (!isOwner && !isTenant && !isAdmin) {
    throw new AppError('Not authorized to view this agreement', 403)
  }

  res.status(200).json({ success: true, data: agreement })
})

/**
 * PUT /api/agreements/:id/status
 * Requires Bearer token (owner/admin)
 */
export const updateAgreementStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (!isObjectId(id)) {
    throw new AppError('Invalid agreement id', 400)
  }

  const agreement = await RentalAgreement.findById(id)
  if (!agreement) {
    throw new AppError('Agreement not found', 404)
  }

  const isOwner = String(agreement.owner) === req.user.id
  const isAdmin = req.user.role === 'admin'
  if (!isOwner && !isAdmin) {
    throw new AppError('Only the owner or admin can update agreement status', 403)
  }

  if (!['draft', 'active', 'completed', 'cancelled'].includes(status)) {
    throw new AppError('Invalid status', 400)
  }

  agreement.status = status
  await agreement.save()

  const propertyId = agreement.property?._id || agreement.property
  if (propertyId) {
    if (status === 'active') {
      await Property.findByIdAndUpdate(propertyId, { status: 'rented' })
      const prop = await Property.findById(propertyId).select('title')
      await Notification.create({
        user: agreement.tenant,
        type: 'agreement',
        title: 'Rental agreement activated',
        body: `Your rental agreement for "${prop?.title || 'a property'}" is now active. Welcome!`,
        property: propertyId,
        actor: req.user.id,
      })
    } else if (status === 'cancelled' || status === 'completed') {
      await Property.findByIdAndUpdate(propertyId, { status: 'available' })
    }
  }

  const data = await populateAgreement(RentalAgreement.findById(agreement._id))
  res.status(200).json({ success: true, data })
})
