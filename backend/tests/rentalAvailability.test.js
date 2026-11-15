import test from 'node:test'
import assert from 'node:assert/strict'
import Property from '../models/Property.js'
import RentalAgreement from '../models/RentalAgreement.js'
import RentalRequest from '../models/RentalRequest.js'
import { createRequest } from '../controllers/requestController.js'
import { getProperties } from '../controllers/propertyController.js'

function responseMock() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
}

test('public property search includes rented properties with their saved photos', async (t) => {
  const original = {
    agreementFind: RentalAgreement.find,
    agreementDistinct: RentalAgreement.distinct,
    propertyFind: Property.find,
    propertyCountDocuments: Property.countDocuments,
    propertyUpdateMany: Property.updateMany,
  }
  const property = {
    id: '64b000000000000000000001',
    status: 'rented',
    approvalStatus: 'approved',
    images: [
      'https://cdn.example.test/rental/front.jpg',
      'https://cdn.example.test/rental/inside.jpg',
    ],
  }
  let query

  RentalAgreement.find = () => ({ select: async () => [] })
  RentalAgreement.distinct = async () => []
  Property.updateMany = async () => ({ modifiedCount: 0 })
  Property.find = (filter) => {
    query = filter
    return {
      sort() {
        return this
      },
      skip() {
        return this
      },
      limit() {
        return Promise.resolve([property])
      },
    }
  }
  Property.countDocuments = async () => 1
  t.after(() => {
    RentalAgreement.find = original.agreementFind
    RentalAgreement.distinct = original.agreementDistinct
    Property.find = original.propertyFind
    Property.countDocuments = original.propertyCountDocuments
    Property.updateMany = original.propertyUpdateMany
  })

  const response = responseMock()
  await getProperties({ query: {} }, response, assert.fail)

  assert.deepEqual(query.status, { $in: ['available', 'rented'] })
  assert.equal(query.approvalStatus, 'approved')
  assert.equal(response.body.data[0].status, 'rented')
  assert.deepEqual(response.body.data[0].images, property.images)
})

test('direct rental request API rejects a rented property with the specified conflict', async (t) => {
  const original = {
    propertyFindById: Property.findById,
    agreementFind: RentalAgreement.find,
    agreementDistinct: RentalAgreement.distinct,
    agreementExists: RentalAgreement.exists,
    requestCreate: RentalRequest.create,
    propertyUpdateMany: Property.updateMany,
  }
  let requestCreated = false

  RentalAgreement.find = () => ({ select: async () => [] })
  RentalAgreement.distinct = async () => []
  Property.updateMany = async () => ({ modifiedCount: 0 })
  Property.findById = async () => ({
    _id: '64b000000000000000000001',
    status: 'rented',
    approvalStatus: 'approved',
  })
  RentalAgreement.exists = async () => true
  RentalRequest.create = async () => {
    requestCreated = true
    return {}
  }
  t.after(() => {
    Property.findById = original.propertyFindById
    RentalAgreement.find = original.agreementFind
    RentalAgreement.distinct = original.agreementDistinct
    RentalAgreement.exists = original.agreementExists
    RentalRequest.create = original.requestCreate
    Property.updateMany = original.propertyUpdateMany
  })

  let error
  await createRequest(
    {
      params: { propertyId: '64b000000000000000000001' },
      user: { id: 'tenant-id', role: 'tenant', name: 'Tenant' },
      body: {},
    },
    responseMock(),
    (nextError) => {
      error = nextError
    },
  )

  assert.equal(error.statusCode, 409)
  assert.equal(error.message, 'Sorry, this property has already been rented.')
  assert.equal(error.code, 'PROPERTY_ALREADY_RENTED')
  assert.equal(requestCreated, false)
})
