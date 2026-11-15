// Auth service.
// REST endpoints:
//   POST /auth/register
//   POST /auth/login
//   GET  /auth/me
//   PUT  /users/:id

import { apiClient, setToken, clearToken, API_BASE_URL } from './apiClient'

const SESSION_KEY = 'alpha_rent_session'
const TOKEN_KEY = 'alpha_rent_token'

/** Normalizes a user object so `id` is always present and secrets are stripped. */
const normalizeUser = (user) => {
  if (!user) return user
  const next = user.id ? user : { ...user, id: String(user._id) }
  delete next._id
  delete next.password
  return next
}

const readSession = () => {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    if (!session || !session.token || !session.user || !session.user.id) return null
    return { ...session, user: normalizeUser(session.user) }
  } catch {
    return null
  }
}

const writeSession = (session) => {
  if (!session || !session.token || !session.user) return
  const next = { ...session, user: normalizeUser(session.user) }
  localStorage.setItem(SESSION_KEY, JSON.stringify(next))
  setToken(session.token)
}

/** Persists a freshly fetched user profile into the stored session (if any). */
export function updateStoredUser(user) {
  const session = readSession()
  if (session && user && session.user?.id === user.id) {
    const next = { ...session, user: normalizeUser(user) }
    localStorage.setItem(SESSION_KEY, JSON.stringify(next))
  }
}

/**
 * Clears every piece of auth data (token + session) from localStorage and
 * sessionStorage, so a stale session can never leak into the next user.
 */
const clearSession = () => {
  clearToken()
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(TOKEN_KEY)
  try {
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable — nothing else to clear */
  }
}

export async function login({ email, password, role }) {
  const { data } = await apiClient('/auth/login', {
    method: 'POST',
    body: { email, password, role },
  })
  writeSession(data)
  return { data }
}

export async function register({ name, email, password, phone, role }) {
  const { data } = await apiClient('/auth/register', {
    method: 'POST',
    body: { name, email, password, phone, role },
  })
  writeSession(data)
  return { data }
}

/** Full URL that starts the Google OAuth consent flow on the backend. */
export function getGoogleAuthUrl(role = 'tenant') {
  const params = new URLSearchParams({ role })
  return `${API_BASE_URL}/auth/google?${params.toString()}`
}

/**
 * Completes a Google sign-in after the backend redirected back to the app.
 * Stores the JWT, fetches the fresh profile and persists the session.
 */
export async function completeGoogleLogin(token) {
  setToken(token)
  const { data: user } = await apiClient('/auth/me')
  const session = { token, user }
  writeSession(session)
  return { data: session }
}

/** Fetches the authenticated user's profile from the database by token. */
export async function resendEmail({ email, name, role }) {
  const { data, message } = await apiClient('/auth/resend-email', {
    method: 'POST',
    body: { email, name, role },
  })
  return { data, message }
}

export async function requestPasswordReset(email) {
  return apiClient('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  })
}

export async function resetPassword({ token, password }) {
  return apiClient('/auth/reset-password', {
    method: 'POST',
    body: { token, password },
  })
}

export async function getMe() {
  const { data } = await apiClient('/auth/me')
  return { data }
}

export function getSession() {
  return readSession()
}

export async function updateSessionUser(user) {
  const { data } = await apiClient(`/users/${user.id}`, { method: 'PUT', body: user })
  const session = readSession()
  if (session) {
    const next = { ...session, user: normalizeUser(data.user || data) }
    localStorage.setItem(SESSION_KEY, JSON.stringify(next))
  }
  return data
}

export function logout() {
  clearSession()
}
