import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import { CITIES, CATEGORIES, PRICE_RANGES } from '../../data/meta'
import { fetchPropertySuggestions } from '../../api/properties'
import { useLanguage } from '../../context/LanguageContext'

const QUICK_SEARCHES = [
  { key: 'chipFurnished', values: { q: 'furnished', city: 'all', category: 'all', priceRange: '' } },
  { key: 'chipBole', values: { q: 'bole', city: 'all', category: 'all', priceRange: '' } },
  { key: 'chipUnder5000', values: { q: '', city: 'all', category: 'all', priceRange: 'under-5000' } },
  { key: 'chipStudio', values: { q: '', city: 'all', category: 'studio', priceRange: '' } },
]

const SUGGESTION_ICONS = { city: 'map-pin', area: 'compass', property: 'home' }

export default function SearchBar({ variant = 'hero', initialValues = {}, onSearch }) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [q, setQ] = useState(initialValues.q || '')
  const [city, setCity] = useState(initialValues.city || 'all')
  const [category, setCategory] = useState(initialValues.category || 'all')
  const [priceRange, setPriceRange] = useState(initialValues.priceRange || '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const keywordRef = useRef(null)

  const isHero = variant === 'hero'

  useEffect(() => {
    if (q.trim().length < 1) {
      setSuggestions([])
      setOpen(false)
      return
    }
    const timer = setTimeout(() => {
      fetchPropertySuggestions(q.trim())
        .then(({ data }) => {
          setSuggestions(data)
          setOpen(data.length > 0)
        })
        .catch(() => {})
    }, 180)
    return () => clearTimeout(timer)
  }, [q])

  useEffect(() => {
    const handler = (e) => {
      if (keywordRef.current && !keywordRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const runSearch = (values) => {
    const params = new URLSearchParams()
    if (values.q) params.set('q', values.q)
    if (values.city && values.city !== 'all') params.set('city', values.city)
    if (values.category && values.category !== 'all') params.set('category', values.category)
    if (values.priceRange) params.set('priceRange', values.priceRange)
    if (onSearch) {
      onSearch(values)
      return
    }
    navigate(`/properties?${params.toString()}`)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setOpen(false)
    runSearch({ q, city, category, priceRange })
  }

  const chooseSuggestion = (s) => {
    setOpen(false)
    if (s.type === 'city') {
      const c = CITIES.find((x) => x.name.toLowerCase() === s.label.toLowerCase())
      setQ('')
      setCity(c ? c.id : 'all')
      runSearch({ q: '', city: c ? c.id : 'all', category, priceRange })
    } else if (s.type === 'area') {
      const area = s.label.split(',')[0].trim()
      setQ(area)
      setCity('all')
      runSearch({ q: area, city: 'all', category, priceRange })
    } else {
      setQ(s.label)
      setCity('all')
      runSearch({ q: s.label, city: 'all', category, priceRange })
    }
  }

  const runChip = (chip) => {
    setQ(chip.values.q)
    setCity(chip.values.city)
    setCategory(chip.values.category)
    setPriceRange(chip.values.priceRange)
    setOpen(false)
    runSearch(chip.values)
  }

  const inputBase = isHero
    ? 'w-full border-0 bg-transparent text-base text-white placeholder-white/60 focus:outline-none'
    : 'w-full border-0 bg-transparent text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none'

  const selectBase = isHero
    ? 'w-full border-0 bg-transparent text-sm text-white focus:outline-none [&>option]:text-slate-800'
    : 'w-full border-0 bg-transparent text-sm text-slate-700 dark:text-white focus:outline-none [&>option]:text-slate-800'

  const fieldWrap = isHero
    ? 'flex flex-1 items-center gap-2 border-b border-white/25 py-3'
    : 'flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800'

  return (
    <form
      onSubmit={handleSubmit}
      className={`${
        isHero
          ? 'rounded-2xl bg-white/10 p-5 backdrop-blur-md sm:p-6'
          : 'rounded-2xl border border-slate-200 bg-white p-3 shadow-card dark:border-slate-700 dark:bg-slate-900'
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div ref={keywordRef} className="relative flex flex-1 flex-col">
          <div className={fieldWrap}>
            <Icon name="search" size={isHero ? 20 : 18} className={isHero ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false)
              }}
              placeholder={t('searchPlaceholder')}
              className={inputBase}
              aria-label="Search properties"
              autoComplete="off"
            />
          </div>

          {open && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
              {suggestions.map((s) => (
                <button
                  type="button"
                  key={`${s.type}-${s.label}`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    chooseSuggestion(s)
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Icon name={SUGGESTION_ICONS[s.type]} size={16} className="shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={fieldWrap}>
          <Icon name="map-pin" size={isHero ? 20 : 18} className={isHero ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'} />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={selectBase}
            aria-label="Filter by city"
          >
            <option value="all">{t('allCitiesOption')}</option>
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className={fieldWrap}>
          <Icon name="building" size={isHero ? 20 : 18} className={isHero ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'} />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={selectBase}
            aria-label="Filter by property type"
          >
            <option value="all">{t('allPropertyTypes')}</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{t(`cat_${c.id}`)}</option>
            ))}
          </select>
        </div>

        <div className={fieldWrap}>
          <Icon name="wallet" size={isHero ? 20 : 18} className={isHero ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'} />
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className={selectBase}
            aria-label="Filter by price range"
          >
            <option value="">{t('anyPrice')}</option>
            {PRICE_RANGES.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className={`shrink-0 rounded-xl font-bold shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
            isHero
              ? 'bg-brand-400 px-7 py-3.5 text-base text-slate-900 hover:bg-brand-300'
              : 'bg-primary-600 px-6 py-3 text-sm text-white hover:bg-primary-700'
          }`}
        >
          {t('search')}
        </button>
      </div>

      {isHero && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-medium text-white/60">{t('popularSearches')}:</span>
          {QUICK_SEARCHES.map((chip) => (
            <button
              type="button"
              key={chip.key}
              onClick={() => runChip(chip)}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-white/20"
            >
              {t(chip.key)}
            </button>
          ))}
        </div>
      )}
    </form>
  )
}
