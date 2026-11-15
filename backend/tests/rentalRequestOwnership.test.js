import test from 'node:test'
import assert from 'node:assert/strict'
import RentalAgreement from '../models/RentalAgreement.js'
import RentalRequest from '../models/RentalRequest.js'
import Property from '../models/Property.js'
import Notification from '../models/Notification.js'
import { createRequest } from '../controllers/requestController.js'

test('rental request stores authenticated tenant, property, and actual property owner IDs', async (t) => {
  const original = {
    propertyFindById: Property.findById,
    agreementExists: RentalAgreement.exists,
    agreementFind: RentalAgreement.find,
    agreementDistinct: RentalAgreement.distinct,
    requestCreate: RentalRequest.create,
    requestFindById: RentalRequest.findById,
    notificationCreate: Notification.create,
  }
  const property = {
    _id: '64b000000000000000000001',
    title: 'Rental application test house',
    status: 'available',
    approvalStatus: 'approved',
    owner: '64b000000000000000000002',
  }
  let storedRequest
  let propertyReads = 0

  Property.findById = () => {
    propertyReads += 1
    if (propertyReads === 1) return Promise.resolve(property)
    return {
      select: async () => ({ status: 'available', approvalStatus: 'approved' }),
    }
  }
  RentalAgreement.exists = async () => false
  RentalAgreement.find = () => ({
    select: async () => [],
  })
  RentalAgreement.distinct = async () => []
  RentalRequest.create = async (request) => {
    storedRequest = { ...request, _id: '64b000000000000000000003', id: '64b000000000000000000003' }
    return storedRequest
  }
  RentalRequest.findById = () => {
    const result = {
      populate() {
        return this
      },
      then(resolve, reject) {
        return Promise.resolve(storedRequest).then(resolve, reject)
      },
    }
    return result
  }
  Notification.create = async () => ({})
  t.after(() => {
    Property.findById = original.propertyFindById
    RentalAgreement.exists = original.agreementExists
    RentalAgreement.find = original.agreementFind
    RentalAgreement.distinct = original.agreementDistinct
    RentalRequest.create = original.requestCreate
    RentalRequest.findById = original.requestFindById
    Notification.create = original.notificationCreate
  })

  const response = {
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

  await createRequest(
    {
      params: { propertyId: property._id },
      user: {
        id: '64b000000000000000000004',
        role: 'tenant',
        name: 'Tenant User',
        email: 'tenant@example.test',
        phone: '+251900000000',
      },
      body: {},
    },
    response,
    assert.fail,
  )

  assert.equal(response.statusCode, 201)
  assert.equal(String(storedRequest.property), property._id)
  assert.equal(String(storedRequest.owner), property.owner)
  assert.equal(String(storedRequest.tenant), '64b000000000000000000004')
  assert.equal(storedRequest.status, 'pending')
})
