import test from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'

import { requireDatabase } from '../middleware/requireDatabase.js'

test('rejects API requests when MongoDB is disconnected', () => {
  const originalReadyState = mongoose.connection.readyState
  mongoose.connection.readyState = 0

  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    set(name, value) {
      this.headers[name] = value
      return this
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }

  let nextCalled = false
  try {
    requireDatabase({}, res, () => {
      nextCalled = true
    })
  } finally {
    mongoose.connection.readyState = originalReadyState
  }

  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 503)
  assert.equal(res.headers['Retry-After'], '5')
  assert.match(res.body.message, /Database temporarily unavailable/)
})