import test from 'node:test'
import assert from 'node:assert/strict'
import Property from '../models/Property.js'
import RentalAgreement from '../models/RentalAgreement.js'
import Notification from '../models/Notification.js'
import { createProperty, getProperties } from '../controllers/propertyController.js'
import { approveProperty } from '../controllers/adminController.js'

test('owner photo uploads survive admin approval and are returned in public search', async (t) => {
  const originalMethods = {
    propertyCreate: Property.create,
    propertyFindById: Property.findById,
    propertyFindOneAndUpdate: Property.findOneAndUpdate,
    propertyFind: Property.find,
    propertyCountDocuments: Property.countDocuments,
    propertyUpdateMany: Property.updateMany,
    agreementFind: RentalAgreement.find,
    agreementDistinct: RentalAgreement.distinct,
    notificationCreate: Notification.create,
  }

  const images = []
  const property = {
    id: '64b000000000000000000001',
    _id: '64b000000000000000000001',
    title: 'Sunny family rental house',
    description: 'A spacious rental property near local shops and transport.',
    category: 'house',
    city: 'Addis Ababa',
    subArea: 'Bole',
    address: 'Bole, Addis Ababa',
    price: 18000,
    status: 'pending',
    approvalStatus: 'pending',
    rejectionReason: '',
    images,
    owner: '64b000000000000000000002',
    toJSON() {
      return { ...this, images: [...this.images] }
    },
  }
  let publicFilter

  Property.create = async (document) => {
    Object.assign(property, document)
    return property
  }
  Property.findById = () => ({
    select: async () => ({ status: property.status }),
  })
  Property.findOneAndUpdate = async (filter, update) => {
    if (filter.approvalStatus !== property.approvalStatus) return null
    Object.assign(property, update.$set)
    return property
  }
  Property.find = (filter) => {
    publicFilter = filter
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
  Property.updateMany = async () => ({ modifiedCount: 0 })
  RentalAgreement.find = () => ({ select: async () => [] })
  RentalAgreement.distinct = async () => []
  Notification.create = async () => ({})

  t.after(() => {
    Property.create = originalMethods.propertyCreate
    Property.findById = originalMethods.propertyFindById
    Property.findOneAndUpdate = originalMethods.propertyFindOneAndUpdate
    Property.find = originalMethods.propertyFind
    Property.countDocuments = originalMethods.propertyCountDocuments
    Property.updateMany = originalMethods.propertyUpdateMany
    RentalAgreement.find = originalMethods.agreementFind
    RentalAgreement.distinct = originalMethods.agreementDistinct
    Notification.create = originalMethods.notificationCreate
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
  const request = {
    body: {
      title: property.title,
      description: property.description,
      category: 'house',
      city: property.city,
      subArea: property.subArea,
      address: property.address,
      price: '18000',
    },
    files: [
      { filename: 'front-view.jpg' },
      { filename: 'living-room.webp' },
    ],
    protocol: 'http',
    get: () => 'localhost:5000',
    user: { id: property.owner, name: 'Property Owner' },
  }

  await createProperty(request, response, assert.fail)
  assert.equal(response.statusCode, 201)
  assert.equal(property.status, 'pending')
  assert.equal(property.approvalStatus, 'pending')
  assert.deepEqual(property.images, [
    'http://localhost:5000/uploads/front-view.jpg',
    'http://localhost:5000/uploads/living-room.webp',
  ])

  response.statusCode = 200
  await approveProperty(
    { params: { id: property.id }, user: { id: 'admin-id' } },
    response,
    assert.fail,
  )

  assert.equal(response.statusCode, 200)
  assert.equal(property.approvalStatus, 'approved')
  assert.equal(property.status, 'available')
  assert.deepEqual(property.images, [
    'http://localhost:5000/uploads/front-view.jpg',
    'http://localhost:5000/uploads/living-room.webp',
  ])

  response.statusCode = 200
  await getProperties({ query: {} }, response, assert.fail)

  assert.equal(response.statusCode, 200)
  assert.equal(publicFilter.approvalStatus, 'approved')
  assert.deepEqual(publicFilter.status, { $in: ['available', 'rented'] })
  assert.equal(response.body.data[0].status, 'available')
  assert.deepEqual(response.body.data[0].images, property.images)
})
