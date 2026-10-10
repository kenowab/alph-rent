import { apiClient } from './apiClient'

export async function sendChatMessage(message) {
  const body = await apiClient('/ai/chat', { method: 'POST', body: { message } })
  return { data: body.data }
}

export async function generateDescription(propertyData) {
  const body = await apiClient('/ai/generate-description', {
    method: 'POST',
    body: propertyData,
  })
  return { data: body.data }
}
