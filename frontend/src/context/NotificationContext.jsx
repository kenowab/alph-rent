import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationsRead,
  deleteNotification as apiDeleteNotification,
} from '../api/interactions'

const NotificationContext = createContext(null)

const POLL_INTERVAL = 30000

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    try {
      const [{ data }, { data: unread }] = await Promise.all([
        fetchNotifications(),
        fetchUnreadNotificationCount(),
      ])
      setNotifications(data)
      setUnreadCount(unread)
    } catch {
      // backend may be offline; keep last known state
    }
  }, [isAuthenticated])

  const markAllRead = useCallback(async () => {
    try {
      await markNotificationsRead()
      setNotifications((current) => current.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // ignore
    }
  }, [])

  const removeNotification = useCallback(async (id) => {
    try {
      await apiDeleteNotification(id)
      setNotifications((current) => current.filter((n) => n.id !== id))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!isAuthenticated) return undefined
    timerRef.current = setInterval(refresh, POLL_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [isAuthenticated, refresh])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      refresh,
      markAllRead,
      removeNotification,
    }),
    [notifications, unreadCount, loading, refresh, markAllRead, removeNotification],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}
