import test from 'node:test'
import assert from 'node:assert/strict'

import { errorHandler } from '../middleware/error.js'

test('returns 503 for MongoDB selection errors', () => {
  const err = new Error('connect ETIMEDOUT 159.143.223.151:27017')
  err.name = 'MongoServerSelectionError'

  const res = {
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

  errorHandler(err, {}, res, () => {})

  assert.equal(res.statusCode, 503)
  assert.match(res.body.message, /Database temporarily unavailable|MongoDB/i)
})
