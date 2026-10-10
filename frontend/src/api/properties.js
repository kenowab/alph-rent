// Property service.
// REST endpoints:
//   GET    /properties            list (query: category, city, q, minPrice, maxPrice, sort, minBedrooms, amenities, limit)
//   GET    /properties/mine       current owner's listings
//   GET    /properties/:id        single
//   POST   /properties            create (owner/admin, supports image upload)
//   PUT    /properties/:id        update (owner/admin)
//   DELETE /properties/:id        remove (owner/admin)

import { apiClient } from './apiClient'

export async function fetchProperties(params) {
  const body = await apiClient('/properties', { params })
  return { data: body.data || [], total: body.total ?? (body.data || []).length }
}

export async function fetchPropertySuggestions(q, limit = 8) {
  const body = await apiClient('/properties/suggestions', { params: { q, limit } })
  return { data: body.data || [] }
}

export async function fetchPropertyById(id) {
  const body = await apiClient(`/properties/${id}`)
  return { data: body.data || null }
}

export async function fetchMyProperties() {
  const body = await apiClient('/properties/mine')
  return { data: body.data || [] }
}

export async function createProperty(payload) {
  const body = await apiClient('/properties', { method: 'POST', body: payload })
  return { data: body.data }
}

export async function updateProperty(id, payload) {
  const body = await apiClient(`/properties/${id}`, { method: 'PUT', body: payload })
  return { data: body.data }
}

export async function deleteProperty(id) {
  await apiClient(`/properties/${id}`, { method: 'DELETE' })
  return { success: true }
}
