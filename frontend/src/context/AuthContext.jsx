import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  completeGoogleLogin as apiGoogleLogin,
  getSession,
  getMe,
  updateSessionUser,
  updateStoredUser,
} from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession())
  const [sessionReady, setSessionReady] = useState(false)

  // On mount, re-validate the stored token against the database and replace the
  // cached user with the fresh profile fetched from the DB. If the token is
  // stale/expired, clear the whole session so no other user's name is shown.
  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      const initial = getSession()
      if (!initial) {
        setSessionReady(true)
        return
      }
      const tokenAtBoot = initial.token
      try {
        const { data } = await getMe()
        if (cancelled) return
        // Ignore the result if the session changed while this request was in
        // flight (e.g. the user just registered/logged in as someone else),
        // otherwise a stale profile would overwrite the fresh one.
        setSession((current) => {
          if (!current) return current
          if (current.user?.id !== data?.id) return current
          return { ...current, user: data }
        })
        updateStoredUser(data)
      } catch {
        if (!cancelled) {
          const stillCurrent = getSession()?.token === tokenAtBoot
          if (stillCurrent) {
            apiLogout()
            setSession(null)
          }
        }
      } finally {
        if (!cancelled) setSessionReady(true)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  const user = session?.user || null

  // Store the token + user, then fetch the authoritative profile from the DB
  // so the displayed name always matches the authenticated user's ID/token.
  const applySession = useCallback(async (incoming) => {
    setSession(incoming)
    try {
      const { data } = await getMe()
      const fresh = Boolean(data && data.id && data.id === incoming.user?.id)
      const next = fresh ? { ...incoming, user: data } : incoming
      if (fresh) {
        updateStoredUser(data)
        setSession(next)
      }
      return next
    } catch {
      return incoming
    }
  }, [])

  const login = useCallback(
    async (credentials) => {
      const { data } = await apiLogin(credentials)
      return applySession(data)
    },
    [applySession],
  )

  const register = useCallback(
    async (userData) => {
      const { data } = await apiRegister(userData)
      return applySession(data)
    },
    [applySession],
  )

  const loginWithGoogle = useCallback(
    async (token) => {
      const { data } = await apiGoogleLogin(token)
      return applySession(data)
    },
    [applySession],
  )

  const logout = useCallback(() => {
    apiLogout()
    setSession(null)
  }, [])

  const updateUser = useCallback((next) => {
    setSession((current) => (current ? { ...current, user: next } : current))
    updateSessionUser(next)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      sessionReady,
      login,
      register,
      loginWithGoogle,
      logout,
      updateUser,
    }),
    [user, sessionReady, login, register, loginWithGoogle, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
