import test from 'node:test'
import assert from 'node:assert/strict'
import RentalAgreement from '../models/RentalAgreement.js'
import RentalRequest from '../models/RentalRequest.js'
import Property from '../models/Property.js'
import Notification from '../models/Notification.js'
import { requireRole } from '../middleware/auth.js'
import {
  getAdminRentalExpirations,
  markRentalExpired,
  updateExpiredRentalPropertyAvailability,
} from '../controllers/adminController.js'
import { updateAgreementStatus } from '../controllers/agreementController.js'
import { updateProperty } from '../controllers/propertyController.js'

const AGREEMENT_ID = '64b000000000000000000001'
const PROPERTY_ID = '64b000000000000000000002'
const TENANT_ID = '64b000000000000000000003'
const OWNER_ID = '64b000000000000000000004'
const ADMIN_ID = '64b000000000000000000005'

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

function populatedQuery(value) {
  return {
    populate() {
      return this
    },
    then(resolve, reject) {
      return Promise.resolve(value).then(resolve, reject)
    },
  }
}

function dateBeforeToday() {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - 2)
  return date.toISOString().slice(0, 10)
}

test('only admins pass the role guard for expiration management', () => {
  for (const role of ['tenant', 'owner']) {
    let denied
    requireRole('admin')({ user: { role } }, {}, (error) => {
      denied = error
    })
    assert.equal(denied.statusCode, 403)
  }
})

test('admin expiration list includes both active and previously expired rentals', async (t) => {
  const original = {
    agreementFind: RentalAgreement.find,
    agreementDistinct: RentalAgreement.distinct,
    propertyUpdateMany: Property.updateMany,
  }
  const records = [{ id: 'active-rental' }, { id: 'expired-rental' }]
  let filter
  let populatePaths = []
  RentalAgreement.distinct = async () => []
  RentalAgreement.find = (query) => {
    filter = query
    return {
      populate(path) {
        populatePaths.push(path)
        return this
      },
      sort() {
        return this
      },
      then(resolve, reject) {
        return Promise.resolve(records).then(resolve, reject)
      },
    }
  }
  Property.updateMany = async () => ({ modifiedCount: 0 })
  t.after(() => {
    RentalAgreement.find = original.agreementFind
    RentalAgreement.distinct = original.agreementDistinct
    Property.updateMany = original.propertyUpdateMany
  })

  const response = responseMock()
  await getAdminRentalExpirations({}, response, assert.fail)

  assert.deepEqual(filter, {
    status: { $in: ['active', 'expired'] },
    endDate: { $gt: '' },
  })
  assert.deepEqual(populatePaths, ['property', 'owner', 'tenant'])
  assert.deepEqual(response.body.data, records)
})

test('admin can explicitly expire a past-due rental and notify tenant and owner', async (t) => {
  const original = {
    agreementFindById: RentalAgreement.findById,
    agreementFindOneAndUpdate: RentalAgreement.findOneAndUpdate,
    propertyFindById: Property.findById,
    propertyFindOneAndUpdate: Property.findOneAndUpdate,
    notificationCreate: Notification.create,
  }
  const agreement = {
    _id: AGREEMENT_ID,
    id: AGREEMENT_ID,
    property: PROPERTY_ID,
    tenant: TENANT_ID,
    owner: OWNER_ID,
    status: 'active',
    endDate: dateBeforeToday(),
  }
  const expiredAgreement = { ...agreement, status: 'expired' }
  let findByIdCalls = 0
  let updateFilter
  let notifications
  let propertyAvailabilityUpdated = false

  RentalAgreement.findById = () => {
    findByIdCalls += 1
    return findByIdCalls === 1 ? Promise.resolve(agreement) : populatedQuery(expiredAgreement)
  }
  RentalAgreement.findOneAndUpdate = async (filter, update) => {
    updateFilter = filter
    assert.deepEqual(update, { $set: { status: 'expired' } })
    return expiredAgreement
  }
  Property.findById = () => ({ select: async () => ({ title: 'Central Apartment' }) })
  Property.findOneAndUpdate = async () => {
    propertyAvailabilityUpdated = true
  }
  Notification.create = async (data) => {
    notifications = data
    return data
  }
  t.after(() => {
    RentalAgreement.findById = original.agreementFindById
    RentalAgreement.findOneAndUpdate = original.agreementFindOneAndUpdate
    Property.findById = original.propertyFindById
    Property.findOneAndUpdate = original.propertyFindOneAndUpdate
    Notification.create = original.notificationCreate
  })

  const response = responseMock()
  let error
  await markRentalExpired(
    { params: { id: AGREEMENT_ID }, user: { id: ADMIN_ID, role: 'admin' } },
    response,
    (nextError) => {
      error = nextError
    },
  )

  assert.equal(error, undefined)
  assert.equal(response.statusCode, 200)
  assert.equal(response.body.data.status, 'expired')
  assert.equal(updateFilter.status, 'active')
  assert.equal(updateFilter.endDate.$lt, new Date().toISOString().slice(0, 10))
  assert.deepEqual(
    notifications.map(({ user, type, title }) => ({ user, type, title })),
    [
      { user: TENANT_ID, type: 'agreement', title: 'Rental agreement expired' },
      { user: OWNER_ID, type: 'agreement', title: 'Rental agreement expired' },
    ],
  )
  assert.equal(propertyAvailabilityUpdated, false)
})

test('rental cannot be expired before its end date', async (t) => {
  const original = {
    agreementFindById: RentalAgreement.findById,
    agreementFindOneAndUpdate: RentalAgreement.findOneAndUpdate,
  }
  RentalAgreement.findById = async () => ({
    _id: AGREEMENT_ID,
    status: 'active',
    endDate: new Date().toISOString().slice(0, 10),
    tenant: TENANT_ID,
    owner: OWNER_ID,
  })
  RentalAgreement.findOneAndUpdate = assert.fail
  t.after(() => {
    RentalAgreement.findById = original.agreementFindById
    RentalAgreement.findOneAndUpdate = original.agreementFindOneAndUpdate
  })

  let error
  await markRentalExpired(
    { params: { id: AGREEMENT_ID }, user: { id: ADMIN_ID, role: 'admin' } },
    responseMock(),
    (nextError) => {
      error = nextError
    },
  )

  assert.equal(error.statusCode, 400)
  assert.match(error.message, /end date must have passed/i)
})

test('already-expired rentals cannot be expired a second time', async (t) => {
  const original = {
    agreementFindById: RentalAgreement.findById,
    agreementFindOneAndUpdate: RentalAgreement.findOneAndUpdate,
  }
  RentalAgreement.findById = async () => ({
    _id: AGREEMENT_ID,
    status: 'expired',
  })
  RentalAgreement.findOneAndUpdate = assert.fail
  t.after(() => {
    RentalAgreement.findById = original.agreementFindById
    RentalAgreement.findOneAndUpdate = original.agreementFindOneAndUpdate
  })

  let error
  await markRentalExpired(
    { params: { id: AGREEMENT_ID }, user: { id: ADMIN_ID, role: 'admin' } },
    responseMock(),
    (nextError) => {
      error = nextError
    },
  )

  assert.equal(error.statusCode, 409)
})

test('owner cannot expire an agreement through the general status endpoint', async (t) => {
  const original = RentalAgreement.findById
  RentalAgreement.findById = async () => ({
    _id: AGREEMENT_ID,
    owner: OWNER_ID,
    status: 'active',
  })
  t.after(() => {
    RentalAgreement.findById = original
  })

  let error
  await updateAgreementStatus(
    {
      params: { id: AGREEMENT_ID },
      body: { status: 'expired' },
      user: { id: OWNER_ID, role: 'owner' },
    },
    responseMock(),
    (nextError) => {
      error = nextError
    },
  )

  assert.equal(error.statusCode, 403)
})

test('owner cannot bypass expiration review through property updates', async (t) => {
  const original = {
    propertyFindById: Property.findById,
    agreementExists: RentalAgreement.exists,
  }
  Property.findById = async () => ({
    _id: PROPERTY_ID,
    owner: OWNER_ID,
    status: 'unavailable',
  })
  RentalAgreement.exists = async () => true
  t.after(() => {
    Property.findById = original.propertyFindById
    RentalAgreement.exists = original.agreementExists
  })

  let error
  await updateProperty(
    {
      params: { id: PROPERTY_ID },
      body: { status: 'available' },
      user: { id: OWNER_ID, role: 'owner' },
    },
    responseMock(),
    (nextError) => {
      error = nextError
    },
  )

  assert.equal(error.statusCode, 403)
  assert.match(error.message, /only an administrator/i)
})

test('property availability changes only through an explicit admin review action', async (t) => {
  const original = {
    agreementFindById: RentalAgreement.findById,
    agreementExists: RentalAgreement.exists,
    requestExists: RentalRequest.exists,
    propertyFindById: Property.findById,
    propertyFindOneAndUpdate: Property.findOneAndUpdate,
  }
  const agreement = {
    _id: AGREEMENT_ID,
    id: AGREEMENT_ID,
    property: PROPERTY_ID,
    application: '64b000000000000000000006',
    status: 'expired',
  }
  let updateFilter
  RentalAgreement.findById = async () => agreement
  RentalAgreement.exists = async () => false
  RentalRequest.exists = async () => false
  Property.findById = async () => ({ approvalStatus: 'approved', status: 'rented' })
  Property.findOneAndUpdate = async (filter, update) => {
    updateFilter = filter
    return { id: PROPERTY_ID, ...update.$set }
  }
  t.after(() => {
    RentalAgreement.findById = original.agreementFindById
    RentalAgreement.exists = original.agreementExists
    RentalRequest.exists = original.requestExists
    Property.findById = original.propertyFindById
    Property.findOneAndUpdate = original.propertyFindOneAndUpdate
  })

  const response = responseMock()
  let error
  await updateExpiredRentalPropertyAvailability(
    { params: { id: AGREEMENT_ID }, body: { status: 'available' } },
    response,
    (nextError) => {
      error = nextError
    },
  )

  assert.equal(error, undefined)
  assert.equal(updateFilter.approvalStatus, 'approved')
  assert.equal(response.body.data.property.status, 'available')
})
