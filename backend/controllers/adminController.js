import User from '../models/User.js'
import Property from '../models/Property.js'
import RentalRequest from '../models/RentalRequest.js'
import ViewingRequest from '../models/ViewingRequest.js'
import RentalAgreement from '../models/RentalAgreement.js'
import Notification from '../models/Notification.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { isObjectId } from '../middleware/validate.js'

/**
 * GET /api/admin/dashboard
 * Full platform overview for the admin dashboard.
 */
export const getAdminDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalOwners,
    totalTenants,
    totalProperties,
    pendingProperties,
    approvedProperties,
    rejectedProperties,
    totalRentalRequests,
    pendingRentalRequests,
    approvedRentals,
    rejectedRentals,
    cancelledRentals,
    totalViewings,
    totalAgreements,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'owner' }),
    User.countDocuments({ role: 'tenant' }),
    Property.countDocuments(),
    Property.countDocuments({ approvalStatus: 'pending' }),
    Property.countDocuments({ approvalStatus: 'approved' }),
    Property.countDocuments({ approvalStatus: 'rejected' }),
    RentalRequest.countDocuments(),
    RentalRequest.countDocuments({ status: 'pending' }),
    RentalRequest.countDocuments({ status: 'approved' }),
    RentalRequest.countDocuments({ status: 'rejected' }),
    RentalRequest.countDocuments({ status: 'cancelled' }),
    ViewingRequest.countDocuments(),
    RentalAgreement.countDocuments(),
  ])

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalOwners,
      totalTenants,
      totalProperties,
      pendingProperties,
      approvedProperties,
      rejectedProperties,
      totalRentalRequests,
      pendingRentalRequests,
      approvedRentals,
      rejectedRentals,
      cancelledRentals,
      totalViewings,
      totalAgreements,
    },
  })
})

/**
 * GET /api/admin/stats
 * Overview numbers for marketplace dashboard
 */
export const getAdminStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalOwners,
    totalTenants,
    totalProperties,
    availableProperties,
    rentedProperties,
    pendingProperties,
    totalApplications,
    totalViewings,
    totalAgreements,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'owner' }),
    User.countDocuments({ role: 'tenant' }),
    Property.countDocuments(),
    Property.countDocuments({ status: 'available' }),
    Property.countDocuments({ status: 'rented' }),
    Property.countDocuments({ approvalStatus: 'pending' }),
    RentalRequest.countDocuments(),
    ViewingRequest.countDocuments(),
    RentalAgreement.countDocuments(),
  ])

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalOwners,
      totalTenants,
      totalProperties,
      availableProperties,
      rentedProperties,
      pendingProperties,
      totalApplications,
      totalViewings,
      totalAgreements,
    },
  })
})

/**
 * GET /api/admin/properties
 * List all properties. Filters: status (availability), approval (approval state).
 */
export const getAdminProperties = asyncHandler(async (req, res) => {
  const { status, approval } = req.query
  const filter = {}
  if (status && status !== 'all') filter.status = status
  if (approval && approval !== 'all') filter.approvalStatus = approval

  const data = await Property.find(filter)
    .populate('owner', 'name email phone verified')
    .sort({ createdAt: -1 })
  res.status(200).json({ success: true, data })
})

/**
 * GET /api/admin/properties/pending
 * Properties awaiting admin approval.
 */
export const getAdminPendingProperties = asyncHandler(async (req, res) => {
  const data = await Property.find({ approvalStatus: 'pending' })
    .populate('owner', 'name email phone verified')
    .sort({ createdAt: -1 })
  res.status(200).json({ success: true, data })
})

/**
 * PUT /api/admin/properties/:id/approve
 * Approves a property and notifies its owner.
 */
export const approveProperty = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!isObjectId(id)) {
    throw new AppError('Invalid property id', 400)
  }

  const property = await Property.findById(id)
  if (!property) {
    throw new AppError('Property not found', 404)
  }

  property.approvalStatus = 'approved'
  property.rejectionReason = ''
  await property.save()

  if (property.owner) {
    await Notification.create({
      user: property.owner,
      type: 'property',
      title: 'Property approved',
      body: `Your property "${property.title}" has been approved by the administrator.`,
      property: property._id,
      actor: req.user.id,
    })
  }

  res.status(200).json({ success: true, data: property })
})

/**
 * PUT /api/admin/properties/:id/reject
 * Rejects a property (with an optional reason) and notifies its owner.
 */
export const rejectProperty = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!isObjectId(id)) {
    throw new AppError('Invalid property id', 400)
  }

  const reason = String(req.body.reason || '').trim().slice(0, 1000)

  const property = await Property.findById(id)
  if (!property) {
    throw new AppError('Property not found', 404)
  }

  property.approvalStatus = 'rejected'
  property.rejectionReason = reason
  await property.save()

  if (property.owner) {
    const body = reason
      ? `Your property "${property.title}" has been rejected. Reason: ${reason}`
      : `Your property "${property.title}" has been rejected.`
    await Notification.create({
      user: property.owner,
      type: 'property',
      title: 'Property rejected',
      body,
      property: property._id,
      actor: req.user.id,
    })
  }

  res.status(200).json({ success: true, data: property })
})

/**
 * GET /api/admin/users
 * List users with optional role filter and free-text search (name/email/phone).
 */
export const getAdminUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query
  const filter = {}
  if (role && role !== 'all') filter.role = role
  if (search) {
    const regex = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }]
  }

  const data = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
  res.status(200).json({ success: true, data })
})

/**
 * GET /api/admin/owners
 * All owners with their property and account summary.
 */
export const getAdminOwners = asyncHandler(async (req, res) => {
  const owners = await User.find({ role: 'owner' }).select('-password').sort({ createdAt: -1 })

  const data = await Promise.all(
    owners.map(async (owner) => {
      const [totalProperties, approvedProperties, pendingProperties, rejectedProperties] =
        await Promise.all([
          Property.countDocuments({ owner: owner._id }),
          Property.countDocuments({ owner: owner._id, approvalStatus: 'approved' }),
          Property.countDocuments({ owner: owner._id, approvalStatus: 'pending' }),
          Property.countDocuments({ owner: owner._id, approvalStatus: 'rejected' }),
        ])
      return {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        avatar: owner.avatar,
        avatarSeed: owner.avatarSeed,
        verified: owner.verified,
        active: owner.active,
        createdAt: owner.createdAt,
        totalProperties,
        approvedProperties,
        pendingProperties,
        rejectedProperties,
      }
    }),
  )

  res.status(200).json({ success: true, data })
})

/**
 * GET /api/admin/tenants
 * All tenants with their rental activity summary.
 */
export const getAdminTenants = asyncHandler(async (req, res) => {
  const tenants = await User.find({ role: 'tenant' }).select('-password').sort({ createdAt: -1 })

  const data = await Promise.all(
    tenants.map(async (tenant) => {
      const [totalRequests, approvedRentals, pendingRentals] = await Promise.all([
        RentalRequest.countDocuments({ tenant: tenant._id }),
        RentalRequest.countDocuments({ tenant: tenant._id, status: 'approved' }),
        RentalRequest.countDocuments({ tenant: tenant._id, status: 'pending' }),
      ])
      return {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        avatar: tenant.avatar,
        avatarSeed: tenant.avatarSeed,
        verified: tenant.verified,
        active: tenant.active,
        createdAt: tenant.createdAt,
        totalRequests,
        approvedRentals,
        pendingRentals,
      }
    }),
  )

  res.status(200).json({ success: true, data })
})

/**
 * GET /api/admin/rental-requests
 * All rental requests with tenant, property and owner populated.
 */
export const getAdminRentalRequests = asyncHandler(async (req, res) => {
  const data = await RentalRequest.find()
    .populate('property', 'title city subArea price status category images')
    .populate('tenant', 'name email phone')
    .populate('owner', 'name email phone')
    .sort({ createdAt: -1 })
  res.status(200).json({ success: true, data })
})

/**
 * PUT /api/admin/rental-requests/:id/approve
 * Requires: Bearer token + role === 'admin'
 * Approves a pending tenant rental request. Follows the existing rental
 * business logic: the property moves into PENDING (a rental process is now
 * active) and a draft agreement is created — the property becomes RENTED once
 * the owner activates that agreement.
 */
export const approveRentalRequest = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!isObjectId(id)) {
    throw new AppError('Invalid rental request id', 400)
  }

  const request = await RentalRequest.findById(id).populate(
    'property',
    'title owner price status approvalStatus',
  )
  if (!request) {
    throw new AppError('Rental request not found', 404)
  }
  if (request.status !== 'pending') {
    throw new AppError(`This rental request has already been ${request.status}`, 400)
  }

  const property = request.property
  if (!property) {
    throw new AppError('The property for this request no longer exists', 404)
  }
  if (property.status === 'rented') {
    throw new AppError('This property is already rented and cannot be approved again', 400)
  }

  request.status = 'approved'
  request.rejectionReason = ''
  await request.save()

  if (request.tenant) {
    await Notification.create({
      user: request.tenant,
      type: 'request',
      title: 'Application approved',
      body: 'Your rental request has been approved by Admin.',
      property: property._id || null,
      actor: req.user.id,
    })
  }

  // Existing business logic: mark the property PENDING and create a draft
  // agreement. The property is marked RENTED once the owner activates it.
  await Property.findByIdAndUpdate(property._id, { status: 'pending' })
  const existingAgreement = await RentalAgreement.findOne({ application: request._id })
  if (!existingAgreement) {
    const today = new Date()
    const oneYearLater = new Date(today)
    oneYearLater.setFullYear(today.getFullYear() + 1)
    await RentalAgreement.create({
      property: property._id,
      owner: property.owner || request.owner || null,
      tenant: request.tenant,
      application: request._id,
      monthlyRent: property.price,
      startDate: request.startDate || request.moveInDate || today.toISOString().split('T')[0],
      endDate: request.endDate || oneYearLater.toISOString().split('T')[0],
      status: 'draft',
    })
  }

  const data = await RentalRequest.findById(request.id)
    .populate('property', 'title subArea city price status category images')
    .populate('tenant', 'name email phone')
    .populate('owner', 'name email phone')
  res.status(200).json({ success: true, data })
})

/**
 * PUT /api/admin/rental-requests/:id/reject
 * Requires: Bearer token + role === 'admin'
 * Declines a pending tenant rental request with an optional reason.
 */
export const rejectRentalRequest = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!isObjectId(id)) {
    throw new AppError('Invalid rental request id', 400)
  }

  const reason = String(req.body.reason || '').trim().slice(0, 1000)

  const request = await RentalRequest.findById(id).populate('property', 'title owner')
  if (!request) {
    throw new AppError('Rental request not found', 404)
  }
  if (request.status !== 'pending') {
    throw new AppError(`This rental request has already been ${request.status}`, 400)
  }

  request.status = 'rejected'
  request.rejectionReason = reason
  await request.save()

  if (request.tenant) {
    const body = reason
      ? `Your rental request has been declined by Admin. Reason: ${reason}`
      : 'Your rental request has been declined by Admin.'
    await Notification.create({
      user: request.tenant,
      type: 'request',
      title: 'Application declined',
      body,
      property: request.property?._id || null,
      actor: req.user.id,
    })
  }

  const data = await RentalRequest.findById(request.id)
    .populate('property', 'title subArea city price status category images')
    .populate('tenant', 'name email phone')
    .populate('owner', 'name email phone')
  res.status(200).json({ success: true, data })
})

/**
 * PUT /api/admin/users/:id
 * Manage a user's account status (activate/deactivate) and role.
 * Guards against removing the last active admin account.
 * Body: { active?: boolean, role?: 'tenant' | 'owner' | 'admin' }
 */
export const updateAdminUser = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!isObjectId(id)) {
    throw new AppError('Invalid user id', 400)
  }

  const { active, role } = req.body
  const update = {}

  if (active !== undefined && typeof active !== 'boolean') {
    throw new AppError('active must be a boolean', 400)
  }
  if (role !== undefined && !['tenant', 'owner', 'admin'].includes(role)) {
    throw new AppError('role must be one of: tenant, owner, admin', 400)
  }

  const target = await User.findById(id)
  if (!target) {
    throw new AppError('User not found', 404)
  }

  const willDemote = role !== undefined && role !== 'admin'
  const willDeactivate = active === false
  const removesAdmin = target.role === 'admin' && (willDemote || willDeactivate)
  if (removesAdmin) {
    const adminCount = await User.countDocuments({ role: 'admin', active: true })
    if (adminCount <= 1) {
      throw new AppError('Cannot remove the last active admin account', 400)
    }
  }

  if (active !== undefined) update.active = active
  if (role !== undefined) update.role = role

  if (Object.keys(update).length === 0) {
    throw new AppError('Nothing to update', 400)
  }

  const updated = await User.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).select('-password')

  res.status(200).json({ success: true, data: updated })
})

/**
 * GET /api/admin/applications
 */
export const getAdminApplications = asyncHandler(async (req, res) => {
  const data = await RentalRequest.find()
    .populate('property', 'title city price status')
    .populate('tenant', 'name email phone')
    .sort({ createdAt: -1 })
  res.status(200).json({ success: true, data })
})

/**
 * GET /api/admin/viewings
 */
export const getAdminViewings = asyncHandler(async (req, res) => {
  const data = await ViewingRequest.find()
    .populate('property', 'title city price status')
    .populate('tenant', 'name email phone')
    .populate('owner', 'name email phone')
    .sort({ createdAt: -1 })
  res.status(200).json({ success: true, data })
})

/**
 * GET /api/admin/agreements
 */
export const getAdminAgreements = asyncHandler(async (req, res) => {
  const data = await RentalAgreement.find()
    .populate('property', 'title city price status')
    .populate('owner', 'name email phone')
    .populate('tenant', 'name email phone')
    .sort({ createdAt: -1 })
  res.status(200).json({ success: true, data })
})
