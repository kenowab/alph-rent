import test from 'node:test'
import assert from 'node:assert/strict'
import RentalAgreement from '../models/RentalAgreement.js'
import Property from '../models/Property.js'
import { getAgreementById, getMyAgreements } from '../controllers/agreementController.js'
import { getAdminAgreements } from '../controllers/adminController.js'

const AGREEMENT_ID = '64b000000000000000000001'
const TENANT_ID = '64b000000000000000000002'
const OTHER_TENANT_ID = '64b000000000000000000003'
const OWNER_ID = '64b000000000000000000004'

function mockResponse() {
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

function makeAgreementQuery(value, populateCalls = []) {
  return {
    populate(...args) {
      populateCalls.push(args)
      return this
    },
    sort() {
      return this
    },
    select() {
      return Promise.resolve([])
    },
    then(resolve, reject) {
      return Promise.resolve(value).then(resolve, reject)
    },
  }
}

test('tenant and owner agreement lists are scoped to their own IDs', async (t) => {
  const original = {
    find: RentalAgreement.find,
    distinct: RentalAgreement.distinct,
    updateMany: Property.updateMany,
  }
  const filters = []
  const agreement = { id: AGREEMENT_ID }

  RentalAgreement.find = (filter) => {
    filters.push(filter)
    return makeAgreementQuery(filter.status === 'active' ? [] : [agreement])
  }
  RentalAgreement.distinct = async () => []
  Property.updateMany = async () => ({ modifiedCount: 0 })
  t.after(() => {
    RentalAgreement.find = original.find
    RentalAgreement.distinct = original.distinct
    Property.updateMany = original.updateMany
  })

  const tenantResponse = mockResponse()
  await getMyAgreements(
    { user: { id: TENANT_ID, role: 'tenant' } },
    tenantResponse,
    assert.fail,
  )
  const ownerResponse = mockResponse()
  await getMyAgreements(
    { user: { id: OWNER_ID, role: 'owner' } },
    ownerResponse,
    assert.fail,
  )

  assert.deepEqual(filters.find((filter) => filter.tenant), { tenant: TENANT_ID })
  assert.deepEqual(filters.find((filter) => filter.owner), { owner: OWNER_ID })
  assert.equal(tenantResponse.body.data[0], agreement)
  assert.equal(ownerResponse.body.data[0], agreement)
})

test('agreement detail is denied to another tenant and allowed to its owner', async (t) => {
  const original = {
    find: RentalAgreement.find,
    findById: RentalAgreement.findById,
    distinct: RentalAgreement.distinct,
    updateMany: Property.updateMany,
  }
  const agreement = {
    _id: AGREEMENT_ID,
    owner: { _id: OWNER_ID },
    tenant: { _id: TENANT_ID },
  }
  RentalAgreement.find = () => makeAgreementQuery([])
  RentalAgreement.findById = () => makeAgreementQuery(agreement)
  RentalAgreement.distinct = async () => []
  Property.updateMany = async () => ({ modifiedCount: 0 })
  t.after(() => {
    RentalAgreement.find = original.find
    RentalAgreement.findById = original.findById
    RentalAgreement.distinct = original.distinct
    Property.updateMany = original.updateMany
  })

  let denied
  await getAgreementById(
    { params: { id: AGREEMENT_ID }, user: { id: OTHER_TENANT_ID, role: 'tenant' } },
    mockResponse(),
    (error) => {
      denied = error
    },
  )
  assert.equal(denied.statusCode, 403)

  let ownerDenied
  await getAgreementById(
    { params: { id: AGREEMENT_ID }, user: { id: 'other-owner-id', role: 'owner' } },
    mockResponse(),
    (error) => {
      ownerDenied = error
    },
  )
  assert.equal(ownerDenied.statusCode, 403)

  const ownerResponse = mockResponse()
  await getAgreementById(
    { params: { id: AGREEMENT_ID }, user: { id: OWNER_ID, role: 'owner' } },
    ownerResponse,
    assert.fail,
  )
  assert.equal(ownerResponse.statusCode, 200)
  assert.equal(ownerResponse.body.data, agreement)
})

test('admin agreements endpoint populates linked people, property, photos, and rental request', async (t) => {
  const original = {
    find: RentalAgreement.find,
    distinct: RentalAgreement.distinct,
    updateMany: Property.updateMany,
  }
  const populateCalls = []
  const agreement = { id: AGREEMENT_ID, createdAt: new Date() }
  RentalAgreement.find = (filter) => {
    if (filter?.status === 'active') return makeAgreementQuery([])
    return makeAgreementQuery([agreement], populateCalls)
  }
  RentalAgreement.distinct = async () => []
  Property.updateMany = async () => ({ modifiedCount: 0 })
  t.after(() => {
    RentalAgreement.find = original.find
    RentalAgreement.distinct = original.distinct
    Property.updateMany = original.updateMany
  })

  const response = mockResponse()
  await getAdminAgreements({ user: { id: 'admin-id', role: 'admin' } }, response, assert.fail)

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.data[0], agreement)
  assert.ok(populateCalls.some(([path]) => path === 'tenant'))
  assert.ok(populateCalls.some(([path]) => path === 'owner'))
  assert.ok(populateCalls.some(([path]) => path === 'application'))
  assert.ok(
    populateCalls.some(
      ([path, fields]) => path === 'property' && fields.includes('images') && fields.includes('address'),
    ),
  )
})
