import mongoose from 'mongoose'
import Property from '../models/Property.js'
import RentalAgreement from '../models/RentalAgreement.js'
import RentalRequest from '../models/RentalRequest.js'
import { AppError } from './AppError.js'

const RENTED_CODE = 'PROPERTY_ALREADY_RENTED'

function withSession(query, session) {
  return session ? query.session(session) : query
}

function rentedError() {
  return new AppError('Sorry, this property has already been rented.', 409, RENTED_CODE)
}

function duplicateAgreementError(error) {
  if (error.keyPattern?.application || error.keyValue?.application) {
    return new AppError(
      'A rental agreement already exists for this rental request.',
      409,
      'RENTAL_AGREEMENT_ALREADY_EXISTS',
    )
  }
  return rentedError()
}

async function assertApprovalCanProceed(requestId, session) {
  const request = await withSession(RentalRequest.findById(requestId), session)
  if (!request) {
    throw new AppError('Rental request not found', 404)
  }
  if (request.status !== 'pending') {
    throw new AppError(`This rental request has already been ${request.status}`, 409)
  }

  const property = await withSession(Property.findById(request.property), session)
  if (!property) {
    throw new AppError('The property for this request no longer exists', 404)
  }
  if (property.status === 'rented') {
    throw rentedError()
  }
  if (property.status !== 'available' || property.approvalStatus !== 'approved') {
    throw new AppError('This property is not available for rental approval.', 409, 'PROPERTY_NOT_AVAILABLE')
  }
  if (!property.owner) {
    throw new AppError('This property cannot be rented until an owner is assigned.', 409)
  }

  const existingRequestAgreement = await withSession(
    RentalAgreement.findOne({ application: request._id }),
    session,
  )
  if (existingRequestAgreement) {
    throw new AppError(
      'A rental agreement already exists for this rental request.',
      409,
      'RENTAL_AGREEMENT_ALREADY_EXISTS',
    )
  }

  const activeAgreement = await withSession(
    RentalAgreement.findOne({ property: property._id, status: 'active' }),
    session,
  )
  if (activeAgreement) {
    throw rentedError()
  }

  return { request, property }
}

function makeAgreement(request, property) {
  const today = new Date()
  const oneYearLater = new Date(today)
  oneYearLater.setFullYear(today.getFullYear() + 1)

  return {
    property: property._id,
    owner: property.owner,
    tenant: request.tenant,
    application: request._id,
    monthlyRent: property.price,
    startDate: request.startDate || request.moveInDate || today.toISOString().slice(0, 10),
    endDate: request.endDate || oneYearLater.toISOString().slice(0, 10),
    status: 'active',
  }
}

async function approveInTransaction(requestId, session) {
  const { request, property } = await assertApprovalCanProceed(requestId, session)
  const claimedProperty = await Property.findOneAndUpdate(
    {
      _id: property._id,
      status: 'available',
      approvalStatus: 'approved',
    },
    { $set: { status: 'rented' } },
    { new: true, session },
  )
  if (!claimedProperty) {
    const currentProperty = await withSession(Property.findById(property._id), session)
    if (currentProperty?.status === 'rented') throw rentedError()
    throw new AppError('This property is no longer available for rental approval.', 409, 'PROPERTY_NOT_AVAILABLE')
  }

  const updatedRequest = await RentalRequest.findOneAndUpdate(
    { _id: request._id, status: 'pending' },
    { $set: { status: 'approved', rejectionReason: '' } },
    { new: true, session },
  )
  if (!updatedRequest) {
    throw new AppError('This rental request has already been decided.', 409)
  }

  await RentalAgreement.create([makeAgreement(updatedRequest, claimedProperty)], { session })
  return updatedRequest
}

async function rollbackAtomicApproval(requestId, propertyId) {
  let rollbackFailure
  try {
    await RentalRequest.updateOne(
      { _id: requestId, status: 'approved' },
      { $set: { status: 'pending', rejectionReason: '' } },
    )
  } catch (error) {
    rollbackFailure = error
  }

  try {
    const activeAgreement = await RentalAgreement.exists({
      property: propertyId,
      status: 'active',
    })
    if (!activeAgreement) {
      await Property.updateOne(
        { _id: propertyId, status: 'rented' },
        { $set: { status: 'available' } },
      )
    }
  } catch (error) {
    rollbackFailure ||= error
  }

  if (rollbackFailure) {
    throw new AppError(
      'Rental approval failed and its rollback could not be completed. Please contact an administrator.',
      500,
    )
  }
}

async function approveWithoutTransaction(requestId) {
  const { request, property } = await assertApprovalCanProceed(requestId)
  const claimedProperty = await Property.findOneAndUpdate(
    {
      _id: property._id,
      status: 'available',
      approvalStatus: 'approved',
    },
    { $set: { status: 'rented' } },
    { new: true },
  )
  if (!claimedProperty) {
    const currentProperty = await Property.findById(property._id)
    if (currentProperty?.status === 'rented') throw rentedError()
    throw new AppError('This property is no longer available for rental approval.', 409, 'PROPERTY_NOT_AVAILABLE')
  }

  try {
    const updatedRequest = await RentalRequest.findOneAndUpdate(
      { _id: request._id, status: 'pending' },
      { $set: { status: 'approved', rejectionReason: '' } },
      { new: true },
    )
    if (!updatedRequest) {
      throw new AppError('This rental request has already been decided.', 409)
    }
    await RentalAgreement.create(makeAgreement(updatedRequest, claimedProperty))
    return updatedRequest
  } catch (error) {
    await rollbackAtomicApproval(request._id, property._id)
    if (error.code === 11000) throw duplicateAgreementError(error)
    throw error
  }
}

function isTransactionUnavailable(error) {
  return (
    error.code === 20 ||
    /Transaction numbers are only allowed on a replica set member or mongos|transactions are not supported/i.test(
      error.message || '',
    )
  )
}

export async function approveRentalRequestById(requestId) {
  const pendingRequest = await RentalRequest.findById(requestId)
  if (pendingRequest) {
    await synchronizeActiveRentalProperties(pendingRequest.property)
  }

  const session = await mongoose.startSession()
  try {
    let result
    try {
      await session.withTransaction(async () => {
        result = await approveInTransaction(requestId, session)
      })
      return result
    } catch (error) {
      if (!isTransactionUnavailable(error)) {
        if (error.code === 11000) throw duplicateAgreementError(error)
        throw error
      }
    }
  } finally {
    await session.endSession()
  }

  return approveWithoutTransaction(requestId)
}

export async function synchronizeActiveRentalProperties(propertyId) {
  const activeProperties = await RentalAgreement.distinct(
    'property',
    propertyId ? { property: propertyId, status: 'active' } : { status: 'active' },
  )
  if (activeProperties.length) {
    await Property.updateMany(
      { _id: { $in: activeProperties }, status: { $in: ['available', 'pending'] } },
      { $set: { status: 'rented' } },
    )
  }
}

export { rentedError }
