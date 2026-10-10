import RentalRequest from '../models/RentalRequest.js'
import Property from '../models/Property.js'
import RentalAgreement from '../models/RentalAgreement.js'
import Notification from '../models/Notification.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { isObjectId } from '../middleware/validate.js'

const STATUS_ENUM = ['pending', 'approved', 'rejected', 'contacted', 'cancelled']

function populateProps(query) {
  return query
    .populate('property', 'title subArea city price status category images')
    .populate('tenant', 'name email phone')
    .populate('owner', 'name email phone')
}

/**
 * POST /api/properties/:propertyId/requests
 * Requires: Bearer token
 * Body: { name, phone, email?, startDate?, endDate?, occupation?, monthlyIncome?, employmentStatus?, message? }
 * Returns: { data: request }
 */
export const createRequest = asyncHandler(async (req, res) => {
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
      'This property is not available for new rental applications right now',
      400,
    )
  }

  const {
    phone,
    startDate = '',
    endDate = '',
    occupation = '',
    monthlyIncome = '',
    employmentStatus = '',
    message = '',
  } = req.body

  if (startDate && endDate && endDate < startDate) {
    throw new AppError('The rent end date cannot be before the start date', 400)
  }

  const request = await RentalRequest.create({
    property: property._id,
    tenant: req.user.id,
    owner: property.owner || null,
    // Identity is taken from the authenticated user loaded by the token —
    // never trust name/email sent from the frontend.
    name: req.user.name,
    email: req.user.email || '',
    phone: req.user.phone || phone || 'Not provided',
    startDate,
    endDate,
    occupation,
    monthlyIncome,
    employmentStatus,
    message,
    status: 'pending',
  })

  if (property.owner) {
    await Notification.create({
      user: property.owner,
      type: 'request',
      title: 'New rental application',
      body: `${req.user.name} applied to rent "${property.title}".`,
      property: property._id,
      actor: req.user.id,
    })
  }

  const populated = await populateProps(
    RentalRequest.findById(request.id),
  )
  res.status(201).json({ success: true, data: populated })
})

/**
 * GET /api/requests/mine
 * Requires: Bearer token
 * Returns: { data: [request...] } submitted by the current user
 */
export const getMyRequests = asyncHandler(async (req, res) => {
  const data = await populateProps(
    RentalRequest.find({ tenant: req.user.id }).sort({ createdAt: -1 }),
  )
  res.status(200).json({ success: true, data })
})

/**
 * GET /api/requests/owner
 * Requires: Bearer token (owner or admin)
 * Returns: { data: [request...] } for properties owned by the current user
 */
export const getOwnerRequests = asyncHandler(async (req, res) => {
  const myProperties = await Property.find({ owner: req.user.id }).select('_id')
  const propertyIds = myProperties.map((p) => p._id)

  const data = await populateProps(
    RentalRequest.find({ property: { $in: propertyIds } }).sort({ createdAt: -1 }),
  )
  res.status(200).json({ success: true, data })
})

/**
 * GET /api/users/:userId/requests
 * Requires: Bearer token — the same user or an admin
 * Returns: { data: [request...] } submitted by the target user
 */
export const getUserRequests = asyncHandler(async (req, res) => {
  const { userId } = req.params
  if (!isObjectId(userId)) {
    throw new AppError('Invalid user id', 400)
  }
  if (req.user.id !== userId && req.user.role !== 'admin') {
    throw new AppError('You can only view your own rental requests', 403)
  }

  const data = await populateProps(
    RentalRequest.find({ tenant: userId }).sort({ createdAt: -1 }),
  )
  res.status(200).json({ success: true, data })
})

/**
 * PUT /api/requests/:id/status
 * Requires: Bearer token — admin only. Owners and tenants can never approve
 * or decline a rental request.
 * Body: { status: pending|approved|rejected|contacted, reason? }
 * Returns: { data: request }
 */
export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (!isObjectId(id)) {
    throw new AppError('Invalid request id', 400)
  }
  if (!STATUS_ENUM.includes(status)) {
    throw new AppError(`Status must be one of: ${STATUS_ENUM.join(', ')}`, 400)
  }

  if (req.user.role !== 'admin') {
    throw new AppError('Only an administrator can approve or decline rental requests', 403)
  }

  const request = await RentalRequest.findById(id).populate('property', 'title owner price status')
  if (!request) {
    throw new AppError('Request not found', 404)
  }

  request.status = status
  if (status === 'rejected') {
    request.rejectionReason = String(req.body.reason || '').trim().slice(0, 1000)
  } else if (status === 'approved') {
    request.rejectionReason = ''
  }
  await request.save()

  const decisionBody =
    status === 'approved'
      ? 'Your rental request has been approved by Admin.'
      : status === 'rejected'
        ? request.rejectionReason
          ? `Your rental request has been declined by Admin. Reason: ${request.rejectionReason}`
          : 'Your rental request has been declined by Admin.'
        : `Your application for "${request.property?.title || 'a property'}" was ${status}.`
  await Notification.create({
    user: request.tenant,
    type: 'request',
    title: 'Application status updated',
    body: decisionBody,
    property: request.property?._id || null,
    actor: req.user.id,
  })

  if (status === 'approved' && request.property) {
    // 1. Move the property into PENDING — a rental process is now active.
    await Property.findByIdAndUpdate(request.property._id, { status: 'pending' })

    // 2. Create a draft agreement if it does not already exist.
    //    The property is marked RENTED once the owner activates the agreement.
    const existingAgreement = await RentalAgreement.findOne({ application: request._id })
    if (!existingAgreement) {
      const today = new Date()
      const oneYearLater = new Date(today)
      oneYearLater.setFullYear(today.getFullYear() + 1)

      await RentalAgreement.create({
        property: request.property._id,
        owner: request.property.owner,
        tenant: request.tenant,
        application: request._id,
        monthlyRent: request.property.price,
        startDate: request.startDate || request.moveInDate || today.toISOString().split('T')[0],
        endDate: request.endDate || oneYearLater.toISOString().split('T')[0],
        status: 'draft',
      })
    }
  }

  const data = await populateProps(RentalRequest.findById(request.id))
  res.status(200).json({ success: true, data })
})
