import test from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import Property from '../models/Property.js'
import RentalAgreement from '../models/RentalAgreement.js'
import RentalRequest from '../models/RentalRequest.js'
import { approveRentalRequestById, rentedError } from '../utils/rentalWorkflow.js'
import { errorHandler } from '../middleware/error.js'

test('already-rented conflicts retain the API error code', () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }

  errorHandler(rentedError(), {}, response, () => {})

  assert.equal(response.statusCode, 409)
  assert.deepEqual(response.body, {
    success: false,
    code: 'PROPERTY_ALREADY_RENTED',
    message: 'Sorry, this property has already been rented.',
  })
})

test('atomic fallback approves only one concurrent request and rolls back agreement failures', async (t) => {
  const originalMethods = {
    startSession: mongoose.startSession,
    propertyFindById: Property.findById,
    propertyFindOneAndUpdate: Property.findOneAndUpdate,
    propertyUpdateOne: Property.updateOne,
    requestFindById: RentalRequest.findById,
    requestFindOneAndUpdate: RentalRequest.findOneAndUpdate,
    requestUpdateOne: RentalRequest.updateOne,
    agreementFindOne: RentalAgreement.findOne,
    agreementExists: RentalAgreement.exists,
    agreementCreate: RentalAgreement.create,
    agreementFind: RentalAgreement.find,
    agreementDistinct: RentalAgreement.distinct,
  }

  const propertyId = '64b000000000000000000001'
  const requestAId = '64b000000000000000000002'
  const requestBId = '64b000000000000000000003'
  const property = {
    _id: propertyId,
    owner: '64b000000000000000000004',
    price: 12000,
    status: 'available',
    approvalStatus: 'approved',
  }
  const requests = new Map([
    [requestAId, { _id: requestAId, property: propertyId, tenant: 'tenant-a', status: 'pending' }],
    [requestBId, { _id: requestBId, property: propertyId, tenant: 'tenant-b', status: 'pending' }],
  ])
  const agreements = []
  let failAgreementCreate = false

  mongoose.startSession = async () => ({
    withTransaction: async () => {
      const error = new Error('Transaction numbers are only allowed on a replica set member or mongos')
      error.code = 20
      throw error
    },
    endSession: async () => {},
  })
  Property.findById = async () => property
  Property.findOneAndUpdate = async (filter, update) => {
    if (
      property._id !== String(filter._id) ||
      property.status !== filter.status ||
      property.approvalStatus !== filter.approvalStatus
    ) {
      return null
    }
    Object.assign(property, update.$set)
    return { ...property }
  }
  Property.updateOne = async (filter, update) => {
    if (property._id === String(filter._id) && property.status === filter.status) {
      Object.assign(property, update.$set)
      return { modifiedCount: 1 }
    }
    return { modifiedCount: 0 }
  }
  RentalRequest.findById = async (id) => requests.get(String(id)) || null
  RentalRequest.findOneAndUpdate = async (filter, update) => {
    const request = requests.get(String(filter._id))
    if (!request || request.status !== filter.status) return null
    Object.assign(request, update.$set)
    return request
  }
  RentalRequest.updateOne = async (filter, update) => {
    const request = requests.get(String(filter._id))
    if (request?.status === filter.status) Object.assign(request, update.$set)
    return { modifiedCount: request?.status === update.$set.status ? 1 : 0 }
  }
  RentalAgreement.findOne = async (filter) =>
    agreements.find(
      (agreement) =>
        String(agreement.property) === String(filter.property) &&
        agreement.status === filter.status,
    ) || null
  RentalAgreement.exists = async (filter) =>
    agreements.some(
      (agreement) =>
        String(agreement.property) === String(filter.property) &&
        agreement.status === filter.status,
    )
  RentalAgreement.find = () => ({ select: async () => [] })
  RentalAgreement.distinct = async () => []
  RentalAgreement.create = async (document) => {
    if (failAgreementCreate) throw new Error('simulated agreement write failure')
    const agreement = Array.isArray(document) ? document[0] : document
    if (agreements.some((item) => item.property === agreement.property && item.status === 'active')) {
      const error = new Error('duplicate active agreement')
      error.code = 11000
      throw error
    }
    agreements.push(agreement)
    return agreement
  }

  t.after(() => {
    mongoose.startSession = originalMethods.startSession
    Property.findById = originalMethods.propertyFindById
    Property.findOneAndUpdate = originalMethods.propertyFindOneAndUpdate
    Property.updateOne = originalMethods.propertyUpdateOne
    RentalRequest.findById = originalMethods.requestFindById
    RentalRequest.findOneAndUpdate = originalMethods.requestFindOneAndUpdate
    RentalRequest.updateOne = originalMethods.requestUpdateOne
    RentalAgreement.findOne = originalMethods.agreementFindOne
    RentalAgreement.exists = originalMethods.agreementExists
    RentalAgreement.create = originalMethods.agreementCreate
    RentalAgreement.find = originalMethods.agreementFind
    RentalAgreement.distinct = originalMethods.agreementDistinct
  })

  const outcomes = await Promise.allSettled([
    approveRentalRequestById(requestAId),
    approveRentalRequestById(requestBId),
  ])

  assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1)
  const rejection = outcomes.find((result) => result.status === 'rejected')
  assert.equal(rejection.reason.statusCode, 409)
  assert.equal(rejection.reason.code, 'PROPERTY_ALREADY_RENTED')
  assert.equal(property.status, 'rented')
  assert.equal(agreements.filter((agreement) => agreement.status === 'active').length, 1)
  assert.equal(String(agreements[0].application), [...requests.values()].find((request) => request.status === 'approved')._id)
  assert.equal(String(agreements[0].property), propertyId)
  assert.equal(String(agreements[0].tenant), [...requests.values()].find((request) => request.status === 'approved').tenant)
  assert.equal(String(agreements[0].owner), property.owner)
  assert.equal(
    [...requests.values()].filter((request) => request.status === 'approved').length,
    1,
  )

  agreements.length = 0
  property.status = 'available'
  requests.get(requestBId).status = 'pending'
  failAgreementCreate = true

  await assert.rejects(
    approveRentalRequestById(requestBId),
    /simulated agreement write failure/,
  )
  assert.equal(property.status, 'available')
  assert.equal(requests.get(requestBId).status, 'pending')
  assert.equal(agreements.length, 0)

  const activePropertyIndex = RentalAgreement.schema.indexes().find(
    ([, options]) => options.name === 'unique_active_rental_per_property',
  )
  assert.deepEqual(activePropertyIndex[0], { property: 1 })
  assert.equal(activePropertyIndex[1].unique, true)
  assert.deepEqual(activePropertyIndex[1].partialFilterExpression, { status: 'active' })
  const applicationIndex = RentalAgreement.schema.indexes().find(
    ([, options]) => options.name === 'unique_agreement_per_rental_request',
  )
  assert.deepEqual(applicationIndex[0], { application: 1 })
  assert.equal(applicationIndex[1].unique, true)
  assert.deepEqual(applicationIndex[1].partialFilterExpression, {
    application: { $type: 'objectId' },
  })
})
