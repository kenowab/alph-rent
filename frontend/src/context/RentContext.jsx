import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const RentContext = createContext(null)

const STORAGE_KEY = 'alpha_rent_period'

export function RentProvider({ children }) {
  const [period, setPeriod] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved === 'yearly' ? 'yearly' : 'monthly'
    } catch {
      return 'monthly'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, period)
    } catch {
      // ignore storage errors
    }
  }, [period])

  const toggle = useCallback(() => {
    setPeriod((current) => (current === 'monthly' ? 'yearly' : 'monthly'))
  }, [])

  const value = useMemo(() => ({ period, setPeriod, toggle }), [period, toggle])

  return <RentContext.Provider value={value}>{children}</RentContext.Provider>
}

export function useRent() {
  const context = useContext(RentContext)
  if (!context) throw new Error('useRent must be used within RentProvider')
  return context
}
