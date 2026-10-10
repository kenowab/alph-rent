import ViewingRequest from '../models/ViewingRequest.js'
import Property from '../models/Property.js'
import Notification from '../models/Notification.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { isObjectId } from '../middleware/validate.js'

const VIEWING_STATUS_ENUM = ['pending', 'accepted', 'rejected', 'completed', 'cancelled']

function populateViewing(query) {
  return query
    .populate('property', 'title subArea city price images status')
    .populate('tenant', 'name email phone')
    .populate('owner', 'name email phone')
}

/**
 * POST /api/properties/:propertyId/viewings
 * Requires Bearer token (tenant)
 */
export const createViewingRequest = asyncHandler(async (req, res) => {
  const { propertyId } = req.params
  if (!isObjectId(propertyId)) {
    throw new AppError('Invalid property id', 400)
  }

  const property = await Property.findById(propertyId)
  if (!property) {
    throw new AppError('Property not found', 404)
  }

  if (property.approvalStatus !== 'approved' || property.status !== 'available') {
    throw new AppError(
      'This property is not available for viewing requests right now',
      400,
    )
  }

  const { name, phone, email = '', requestedDate, requestedTime, message = '' } = req.body

  if (!requestedDate || !requestedTime) {
    throw new AppError('Requested date and time are required', 400)
  }

  const viewing = await ViewingRequest.create({
    property: property._id,
    tenant: req.user.id,
    owner: property.owner,
    name: name || req.user.name,
    phone: phone || req.user.phone,
    email: email || req.user.email,
    requestedDate,
    requestedTime,
    message,
    status: 'pending',
  })

  if (property.owner) {
    await Notification.create({
      user: property.owner,
      type: 'viewing',
      title: 'New viewing request',
      body: `${req.user.name} requested to view "${property.title}" on ${requestedDate} at ${requestedTime}.`,
      property: property._id,
      actor: req.user.id,
    })
  }

  const data = await populateViewing(ViewingRequest.findById(viewing._id))
  res.status(201).json({ success: true, data })
})

/**
 * GET /api/viewings/mine
 * Requires Bearer token
 */
export const getMyViewings = asyncHandler(async (req, res) => {
  const data = await populateViewing(
    ViewingRequest.find({ tenant: req.user.id }).sort({ createdAt: -1 }),
  )
  res.status(200).json({ success: true, data })
})

/**
 * GET /api/viewings/owner
 * Requires Bearer token (owner/admin)
 */
export const getOwnerViewings = asyncHandler(async (req, res) => {
  const data = await populateViewing(
    ViewingRequest.find({ owner: req.user.id }).sort({ createdAt: -1 }),
  )
  res.status(200).json({ success: true, data })
})

/**
 * PUT /api/viewings/:id/status
 * Requires Bearer token (owner, tenant or admin)
 */
export const updateViewingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (!isObjectId(id)) {
    throw new AppError('Invalid viewing request id', 400)
  }
  if (!VIEWING_STATUS_ENUM.includes(status)) {
    throw new AppError(`Status must be one of: ${VIEWING_STATUS_ENUM.join(', ')}`, 400)
  }

  const viewing = await ViewingRequest.findById(id).populate('property', 'title')
  if (!viewing) {
    throw new AppError('Viewing request not found', 404)
  }

  const isOwner = String(viewing.owner) === req.user.id
  const isTenant = String(viewing.tenant) === req.user.id
  const isAdmin = req.user.role === 'admin'

  if (!isOwner && !isTenant && !isAdmin) {
    throw new AppError('Not authorized to update this viewing request', 403)
  }

  // Tenant can only cancel
  if (isTenant && !isOwner && !isAdmin && status !== 'cancelled') {
    throw new AppError('Tenants can only cancel viewing requests', 403)
  }

  viewing.status = status
  await viewing.save()

  // Notify the other party about the status change
  const notifyUser = isOwner ? viewing.tenant : viewing.owner
  if (notifyUser && String(notifyUser) !== req.user.id) {
    const title = isOwner
      ? 'Viewing request updated'
      : 'You cancelled a viewing request'
    const body = isOwner
      ? `${req.user.name} ${status} your viewing request for "${viewing.property?.title || 'a property'}".`
      : `You cancelled your viewing request for "${viewing.property?.title || 'a property'}".`
    await Notification.create({
      user: notifyUser,
      type: 'viewing',
      title,
      body,
      property: viewing.property?._id || null,
      actor: req.user.id,
    })
  }

  const data = await populateViewing(ViewingRequest.findById(viewing._id))
  res.status(200).json({ success: true, data })
})
