// Admin API service.
// All endpoints are protected on the backend with protect + authorize('admin').
// Tenants and owners receive HTTP 403 for every call in this module.

import { apiClient } from './apiClient'

export async function fetchAdminDashboard() {
  const body = await apiClient('/admin/dashboard')
  return { data: body.data }
}

export async function fetchAdminUsers({ role = 'all', search = '' } = {}) {
  const body = await apiClient('/admin/users', { params: { role, search } })
  return { data: body.data || [] }
}

export async function fetchAdminOwners() {
  const body = await apiClient('/admin/owners')
  return { data: body.data || [] }
}

export async function fetchAdminTenants() {
  const body = await apiClient('/admin/tenants')
  return { data: body.data || [] }
}

export async function fetchAdminProperties({ status = 'all', approval = 'all' } = {}) {
  const body = await apiClient('/admin/properties', { params: { status, approval } })
  return { data: body.data || [] }
}

export async function fetchAdminPendingProperties() {
  const body = await apiClient('/admin/properties/pending')
  return { data: body.data || [] }
}

export async function approveProperty(id) {
  const body = await apiClient(`/admin/properties/${id}/approve`, { method: 'PUT' })
  return { data: body.data }
}

export async function rejectProperty(id, reason) {
  const body = await apiClient(`/admin/properties/${id}/reject`, {
    method: 'PUT',
    body: { reason },
  })
  return { data: body.data }
}

export async function fetchAdminRentalRequests() {
  const body = await apiClient('/admin/rental-requests')
  return { data: body.data || [] }
}

export async function approveRentalRequest(id) {
  const body = await apiClient(`/admin/rental-requests/${id}/approve`, { method: 'PUT' })
  return { data: body.data }
}

export async function rejectRentalRequest(id, reason) {
  const body = await apiClient(`/admin/rental-requests/${id}/reject`, {
    method: 'PUT',
    body: { reason },
  })
  return { data: body.data }
}

export async function updateAdminUser(id, { active, role } = {}) {
  const body = await apiClient(`/admin/users/${id}`, {
    method: 'PUT',
    body: { ...(active !== undefined ? { active } : {}), ...(role ? { role } : {}) },
  })
  return { data: body.data }
}
