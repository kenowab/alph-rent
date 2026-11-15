import RentalRequest from '../models/RentalRequest.js'
import Property from '../models/Property.js'
import RentalAgreement from '../models/RentalAgreement.js'
import Notification from '../models/Notification.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { isObjectId } from '../middleware/validate.js'
import {
  approveRentalRequestById,
  rentedError,
  synchronizeActiveRentalProperties,
} from '../utils/rentalWorkflow.js'

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

  await synchronizeActiveRentalProperties(propertyId)

  const property = await Property.findById(propertyId)
  if (!property) {
    throw new AppError('Property not found', 404)
  }

  if (property.approvalStatus !== 'approved' || property.status !== 'available') {
    if (property.status === 'rented') throw rentedError()
    throw new AppError(
      'This property is not available for new rental applications right now',
      409,
      'PROPERTY_NOT_AVAILABLE',
    )
  }
  if (await RentalAgreement.exists({ property: property._id, status: 'active' })) {
    throw rentedError()
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

  const currentProperty = await Property.findById(property._id).select('status approvalStatus')
  if (!currentProperty || currentProperty.approvalStatus !== 'approved' || currentProperty.status !== 'available') {
    const { deletedCount } = await RentalRequest.deleteOne({
      _id: request._id,
      status: 'pending',
    })
    if (!deletedCount) {
      const latestRequest = await RentalRequest.findById(request._id).select('status')
      if (latestRequest?.status !== 'approved') {
        if (currentProperty?.status === 'rented') throw rentedError()
        throw new AppError(
          'This property is no longer available for new rental applications.',
          409,
          'PROPERTY_NOT_AVAILABLE',
        )
      }
    } else {
      if (currentProperty?.status === 'rented') throw rentedError()
      throw new AppError(
        'This property is no longer available for new rental applications.',
        409,
        'PROPERTY_NOT_AVAILABLE',
      )
    }
  }

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

  if (status === 'approved') {
    const approved = await approveRentalRequestById(id)
    await Notification.create({
      user: approved.tenant,
      type: 'request',
      title: 'Application status updated',
      body: 'Your rental request has been approved by Admin.',
      property: approved.property,
      actor: req.user.id,
    })
    const data = await populateProps(RentalRequest.findById(approved._id))
    return res.status(200).json({ success: true, data })
  }

  const request = await RentalRequest.findById(id).populate('property', 'title owner price status')
  if (!request) {
    throw new AppError('Request not found', 404)
  }
  if (request.status !== 'pending') {
    throw new AppError(`This rental request has already been ${request.status}`, 409)
  }

  const rejectionReason =
    status === 'rejected' ? String(req.body.reason || '').trim().slice(0, 1000) : ''
  const updatedRequest = await RentalRequest.findOneAndUpdate(
    { _id: id, status: 'pending' },
    { $set: { status, rejectionReason } },
    { new: true },
  ).populate('property', 'title owner price status')
  if (!updatedRequest) {
    throw new AppError('This rental request has already been decided.', 409)
  }

  const decisionBody =
    status === 'rejected'
      ? updatedRequest.rejectionReason
        ? `Your rental request has been declined by Admin. Reason: ${updatedRequest.rejectionReason}`
        : 'Your rental request has been declined by Admin.'
      : `Your application for "${updatedRequest.property?.title || 'a property'}" was ${status}.`
  await Notification.create({
    user: updatedRequest.tenant,
    type: 'request',
    title: 'Application status updated',
    body: decisionBody,
    property: updatedRequest.property?._id || null,
    actor: req.user.id,
  })

  const data = await populateProps(RentalRequest.findById(updatedRequest.id))
  res.status(200).json({ success: true, data })
})
