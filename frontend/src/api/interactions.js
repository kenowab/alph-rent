// Message, rental request, viewing request, agreement, and admin services.
import { apiClient } from './apiClient'

export async function sendRentalRequest({
  propertyId,
  name,
  phone,
  email,
  startDate,
  endDate,
  occupation,
  monthlyIncome,
  employmentStatus,
  message,
}) {
  const body = await apiClient(`/properties/${propertyId}/requests`, {
    method: 'POST',
    body: {
      name,
      phone,
      email,
      startDate,
      endDate,
      occupation,
      monthlyIncome,
      employmentStatus,
      message,
    },
  })
  return { data: body.data }
}

export async function fetchRentalRequests({ userId, role } = {}) {
  let endpoint = '/requests/mine'
  if (role === 'owner') endpoint = '/requests/owner'
  else if (userId) endpoint = `/users/${userId}/requests`
  const body = await apiClient(endpoint)
  return { data: body.data || [] }
}

export async function updateRequestStatus(id, status) {
  const body = await apiClient(`/requests/${id}/status`, { method: 'PUT', body: { status } })
  return { data: body.data }
}

// Viewing Requests API
export async function sendViewingRequest({
  propertyId,
  name,
  phone,
  email,
  requestedDate,
  requestedTime,
  message,
}) {
  const body = await apiClient(`/properties/${propertyId}/viewings`, {
    method: 'POST',
    body: { name, phone, email, requestedDate, requestedTime, message },
  })
  return { data: body.data }
}

export async function fetchViewingRequests({ role } = {}) {
  const endpoint = role === 'owner' ? '/viewings/owner' : '/viewings/mine'
  const body = await apiClient(endpoint)
  return { data: body.data || [] }
}

export async function updateViewingStatus(id, status) {
  const body = await apiClient(`/viewings/${id}/status`, { method: 'PUT', body: { status } })
  return { data: body.data }
}

// Rental Agreements API
export async function fetchRentalAgreements() {
  const body = await apiClient('/agreements/mine')
  return { data: body.data || [] }
}

export async function updateAgreementStatus(id, status) {
  const body = await apiClient(`/agreements/${id}/status`, { method: 'PUT', body: { status } })
  return { data: body.data }
}

// Messaging API
export async function sendMessage({ senderId, recipientId, content, propertyId }) {
  const body = await apiClient('/messages', {
    method: 'POST',
    body: { senderId, recipientId, content, propertyId },
  })
  return { data: body.data }
}

export async function fetchMessages({ userId } = {}) {
  const body = await apiClient('/messages')
  return { data: body.data || [] }
}

export async function fetchConversations() {
  const body = await apiClient('/messages/conversations')
  return { data: body.data || [] }
}

export async function fetchConversationMessages({ propertyId, otherId }) {
  const body = await apiClient(`/messages/conversations/${propertyId || 'general'}/${otherId}`)
  return { data: body.data || [] }
}

export async function markConversationRead({ otherId, propertyId }) {
  const body = await apiClient('/messages/read', {
    method: 'PUT',
    body: { otherId, propertyId },
  })
  return { data: body.data }
}

// Notifications API
export async function fetchNotifications() {
  const body = await apiClient('/notifications')
  return { data: body.data || [], unread: body.unread || 0 }
}

export async function fetchUnreadNotificationCount() {
  const body = await apiClient('/notifications/unread-count')
  return { data: body.data || 0 }
}

export async function markNotificationsRead() {
  const body = await apiClient('/notifications/read', { method: 'PUT' })
  return { data: body.data }
}

export async function deleteNotification(id) {
  const body = await apiClient(`/notifications/${id}`, { method: 'DELETE' })
  return { data: body.data }
}

// Admin API
export async function fetchAdminStats() {
  const body = await apiClient('/admin/stats')
  return { data: body.data }
}

export async function fetchAdminProperties(status = 'all') {
  const body = await apiClient(`/admin/properties?status=${status}`)
  return { data: body.data || [] }
}

export async function fetchAdminUsers(role = 'all') {
  const body = await apiClient(`/admin/users?role=${role}`)
  return { data: body.data || [] }
}

export async function fetchAdminApplications() {
  const body = await apiClient('/admin/applications')
  return { data: body.data || [] }
}

export async function fetchAdminViewings() {
  const body = await apiClient('/admin/viewings')
  return { data: body.data || [] }
}

export async function fetchAdminAgreements() {
  const body = await apiClient('/admin/agreements')
  return { data: body.data || [] }
}
