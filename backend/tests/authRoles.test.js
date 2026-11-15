import test from 'node:test'
import assert from 'node:assert/strict'

import { validateRequestedRole } from '../utils/authRoles.js'

test('allows matching tenant login', () => {
  assert.doesNotThrow(() => validateRequestedRole('tenant', 'tenant'))
})

test('blocks tenant login when user is owner', () => {
  assert.throws(() => validateRequestedRole('tenant', 'owner'), /tenant/i)
})

test('allows matching owner login', () => {
  assert.doesNotThrow(() => validateRequestedRole('owner', 'owner'))
})

test('allows matching admin login', () => {
  assert.doesNotThrow(() => validateRequestedRole('admin', 'admin'))
})

test('allows login when no role is explicitly requested', () => {
  assert.doesNotThrow(() => validateRequestedRole(undefined, 'tenant'))
})
