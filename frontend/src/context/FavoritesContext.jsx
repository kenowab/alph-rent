import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { apiClient, getToken } from '../api/apiClient'

const FAVORITES_KEY = 'alpha_rent_favorites'

const readFavorites = () => {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
  } catch {
    return []
  }
}

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(readFavorites)
  const synced = useRef(false)

  // When a session exists, load the user's favorites from the backend.
  useEffect(() => {
    if (!getToken() || synced.current) return
    synced.current = true
    apiClient('/favorites')
      .then(({ data }) => {
        if (Array.isArray(data)) {
          const ids = data.map((f) => f.propertyId || f).filter(Boolean)
          setFavorites(ids)
          localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
        }
      })
      .catch(() => {
        // Backend not reachable — keep local favorites.
      })
  }, [])

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites])

  const toggleFavorite = useCallback(
    (id) => {
      const next = favorites.includes(id)
        ? favorites.filter((fid) => fid !== id)
        : [...favorites, id]
      setFavorites(next)
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))

      if (getToken()) {
        apiClient(`/favorites/${id}`, { method: favorites.includes(id) ? 'DELETE' : 'POST' }).catch(
          () => {},
        )
      }
    },
    [favorites],
  )

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite }),
    [favorites, isFavorite, toggleFavorite],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider')
  return context
}
