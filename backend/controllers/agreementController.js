import RentalAgreement from '../models/RentalAgreement.js'
import Property from '../models/Property.js'
import RentalRequest from '../models/RentalRequest.js'
import Notification from '../models/Notification.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { isObjectId } from '../middleware/validate.js'
import { synchronizeActiveRentalProperties } from '../utils/rentalWorkflow.js'

function populateAgreement(query) {
  return query
    .populate('property', 'title description category address subArea city price images status')
    .populate('owner', 'name email phone')
    .populate('tenant', 'name email phone')
    .populate('application')
}

/**
 * GET /api/agreements/mine
 * Requires Bearer token (tenant/owner/admin)
 */
export const getMyAgreements = asyncHandler(async (req, res) => {
  if (!['owner', 'tenant'].includes(req.user.role)) {
    throw new AppError('Only owners and tenants can view their own agreements.', 403)
  }

  await synchronizeActiveRentalProperties()

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

  await synchronizeActiveRentalProperties()

  const agreement = await populateAgreement(RentalAgreement.findById(id))
  if (!agreement) {
    throw new AppError('Agreement not found', 404)
  }

  const isOwner = String(agreement.owner?._id || agreement.owner) === req.user.id
  const isTenant = String(agreement.tenant?._id || agreement.tenant) === req.user.id
  const isAdmin = req.user.role === 'admin'

  if (
    !(isAdmin || (req.user.role === 'owner' && isOwner) || (req.user.role === 'tenant' && isTenant))
  ) {
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
  if (!(isAdmin || (req.user.role === 'owner' && isOwner))) {
    throw new AppError('Only the owner or admin can update agreement status', 403)
  }

  if (!['draft', 'active', 'completed', 'cancelled', 'expired'].includes(status)) {
    throw new AppError('Invalid status', 400)
  }
  if (status === 'expired') {
    throw new AppError('Rental agreements can only be expired through Admin Rental Expiration Management.', 403)
  }
  const allowedTransitions = {
    draft: ['active', 'cancelled'],
    active: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  }
  if (!allowedTransitions[agreement.status].includes(status)) {
    throw new AppError('This rental agreement can no longer transition to that status.', 409)
  }

  const propertyId = agreement.property?._id || agreement.property
  if (agreement.status === 'active' && status === 'draft') {
    throw new AppError('An active agreement must be cancelled or completed before it can be closed.', 409)
  }

  let previousPropertyStatus
  if (status === 'active' && agreement.status !== 'active') {
    const application = agreement.application
      ? await RentalRequest.findById(agreement.application)
      : null
    if (!application || application.status !== 'approved') {
      throw new AppError('Only an administrator-approved rental request can activate an agreement.', 409)
    }

    const property = await Property.findById(propertyId)
    if (!property) {
      throw new AppError('Property not found', 404)
    }
    if (property.status === 'rented') {
      throw new AppError('This house has already been rented.', 409, 'PROPERTY_ALREADY_RENTED')
    }
    if (!['available', 'pending'].includes(property.status) || property.approvalStatus !== 'approved') {
      throw new AppError('This property is not available for agreement activation.', 409, 'PROPERTY_NOT_AVAILABLE')
    }

    const existingAgreement = await RentalAgreement.findOne({
      property: propertyId,
      status: 'active',
      _id: { $ne: agreement._id },
    })
    if (existingAgreement) {
      throw new AppError('This house has already been rented.', 409, 'PROPERTY_ALREADY_RENTED')
    }

    previousPropertyStatus = property.status
    const claimedProperty = await Property.findOneAndUpdate(
      { _id: propertyId, status: property.status, approvalStatus: 'approved' },
      { $set: { status: 'rented' } },
      { new: true },
    )
    if (!claimedProperty) {
      throw new AppError('This property is no longer available for agreement activation.', 409, 'PROPERTY_NOT_AVAILABLE')
    }
  }

  let updatedAgreement
  try {
    updatedAgreement = await RentalAgreement.findOneAndUpdate(
      { _id: agreement._id, status: agreement.status },
      { $set: { status } },
      { new: true, runValidators: true },
    )
  } catch (error) {
    if (previousPropertyStatus) {
      const [activeAgreement, otherApprovedRequest] = await Promise.all([
        RentalAgreement.exists({ property: propertyId, status: 'active' }),
        RentalRequest.exists({
          property: propertyId,
          status: 'approved',
          ...(agreement.application ? { _id: { $ne: agreement.application } } : {}),
        }),
      ])
      if (!activeAgreement && !otherApprovedRequest) {
        await Property.updateOne(
          { _id: propertyId, status: 'rented' },
          { $set: { status: previousPropertyStatus } },
        )
      }
    }
    if (error.code === 11000) {
      throw new AppError('This house has already been rented.', 409, 'PROPERTY_ALREADY_RENTED')
    }
    throw error
  }
  if (!updatedAgreement) {
    if (previousPropertyStatus) {
      const [activeAgreement, otherApprovedRequest] = await Promise.all([
        RentalAgreement.exists({ property: propertyId, status: 'active' }),
        RentalRequest.exists({
          property: propertyId,
          status: 'approved',
          ...(agreement.application ? { _id: { $ne: agreement.application } } : {}),
        }),
      ])
      if (!activeAgreement && !otherApprovedRequest) {
        await Property.updateOne(
          { _id: propertyId, status: 'rented' },
          { $set: { status: previousPropertyStatus } },
        )
      }
    }
    throw new AppError('The rental agreement status changed before this update could be completed.', 409)
  }

  if (status === 'cancelled' || status === 'completed') {
    const [activeAgreement, otherApprovedRequest] = await Promise.all([
      RentalAgreement.exists({ property: propertyId, status: 'active' }),
      RentalRequest.exists({
        property: propertyId,
        status: 'approved',
        ...(agreement.application ? { _id: { $ne: agreement.application } } : {}),
      }),
    ])
    if (!activeAgreement && !otherApprovedRequest) {
      await Property.findOneAndUpdate(
        { _id: propertyId, status: { $in: ['rented', 'pending'] } },
        { $set: { status: 'available' } },
      )
    }
  }

  if (status === 'active' && agreement.status !== 'active') {
    const prop = await Property.findById(propertyId).select('title')
    await Notification.create({
      user: agreement.tenant,
      type: 'agreement',
      title: 'Rental agreement activated',
      body: `Your rental agreement for "${prop?.title || 'a property'}" is now active. Welcome!`,
      property: propertyId,
      actor: req.user.id,
    })
  }

  const data = await populateAgreement(RentalAgreement.findById(agreement._id))
  res.status(200).json({ success: true, data })
})
