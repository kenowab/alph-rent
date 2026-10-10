// API integration layer.
// All service functions talk to the Node.js + MongoDB backend through apiClient.
// Set VITE_API_BASE_URL in .env to point at your API (defaults to http://localhost:5000/api).

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const TOKEN_KEY = 'alpha_rent_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function apiClient(endpoint, { method = 'GET', body, params } = {}) {
  const url = new URL(`${API_BASE_URL}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        url.searchParams.append(key, value)
      }
    })
  }

  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  if (!isFormData) headers['Content-Type'] = 'application/json'

  const response = await fetch(url.toString(), {
    method,
    headers,
    cache: 'no-store',
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    const err = new Error(payload.message || `Request failed with status ${response.status}`)
    err.status = response.status
    err.payload = payload
    throw err
  }

  return response.json()
}
