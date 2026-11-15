import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PropertyGrid from '../components/property/PropertyGrid'
import FilterPanel from '../components/filter/FilterPanel'
import SortDropdown from '../components/filter/SortDropdown'
import SearchBar from '../components/search/SearchBar'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Icon from '../components/ui/Icon'
import { fetchProperties } from '../api/properties'
import { PRICE_RANGES } from '../data/meta'
import { getCategoryLabel, getCityLabel } from '../components/property/helpers'
import { useFavorites } from '../context/FavoritesContext'

const DEFAULT_FILTERS = {
  category: 'all',
  city: 'all',
  status: '',
  priceRange: '',
  minBedrooms: 0,
  minBathrooms: 0,
  amenities: [],
}

function priceRangeToNumbers(rangeId) {
  return PRICE_RANGES.find((r) => r.id === rangeId) || null
}

function filtersFromParams(params) {
  return {
    ...DEFAULT_FILTERS,
    category: params.get('category') || 'all',
    city: params.get('city') || 'all',
    status: params.get('status') || '',
    priceRange: params.get('priceRange') || '',
    q: params.get('q') || '',
    minBedrooms: Number(params.get('minBedrooms')) || 0,
    minBathrooms: Number(params.get('minBathrooms')) || 0,
    amenities: params.get('amenities') ? params.get('amenities').split(',') : [],
  }
}

export default function ListingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { favorites, isFavorite } = useFavorites()
  const [filters, setFilters] = useState(() => filtersFromParams(searchParams))
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const favoritesMode = searchParams.get('favorites') === '1'

  useEffect(() => {
    setFilters(filtersFromParams(searchParams))
    setSort(searchParams.get('sort') || 'newest')
  }, [searchParams])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const range = priceRangeToNumbers(filters.priceRange)
    const params = {
      category: filters.category,
      city: filters.city,
      status: filters.status || undefined,
      q: filters.q,
      minPrice: range?.min,
      maxPrice: range?.max,
      minBedrooms: filters.minBedrooms || undefined,
      minBathrooms: filters.minBathrooms || undefined,
      amenities: filters.amenities.length ? filters.amenities : undefined,
      sort,
    }

    fetchProperties(params)
      .then(({ data }) => {
        if (!cancelled) setProperties(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filters, sort])

  const handleFiltersChange = (next) => {
    setFilters(next)
    const params = new URLSearchParams()
    if (next.category !== 'all') params.set('category', next.category)
    if (next.city !== 'all') params.set('city', next.city)
    if (next.status) params.set('status', next.status)
    if (next.priceRange) params.set('priceRange', next.priceRange)
    if (next.q) params.set('q', next.q)
    if (next.minBedrooms) params.set('minBedrooms', next.minBedrooms)
    if (next.minBathrooms) params.set('minBathrooms', next.minBathrooms)
    if (next.amenities.length) params.set('amenities', next.amenities.join(','))
    if (sort !== 'newest') params.set('sort', sort)
    setSearchParams(params, { replace: true })
  }

  const handleClear = () => {
    setFilters({ ...DEFAULT_FILTERS, q: filters.q })
    setSearchParams({}, { replace: true })
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.category !== 'all') count += 1
    if (filters.city !== 'all') count += 1
    if (filters.status) count += 1
    if (filters.priceRange) count += 1
    if (filters.minBedrooms) count += 1
    if (filters.minBathrooms) count += 1
    if (filters.amenities.length) count += 1
    return count
  }, [filters])

  const resultTitle = useMemo(() => {
    const parts = []
    if (filters.category !== 'all') parts.push(`${getCategoryLabel(filters.category)}s for rent`)
    if (filters.city !== 'all') parts.push(`in ${getCityLabel(filters.city)}`)
    return parts.length ? parts.join(' ') : 'Properties for rent across Ethiopia'
  }, [filters])

  const handleSearch = ({ q, city, category, priceRange }) => {
    handleFiltersChange({ ...filters, q, city, category, priceRange })
  }

  const shownProperties = useMemo(() => {
    if (!favoritesMode) return properties
    return properties.filter((p) => isFavorite(p.id))
  }, [properties, favoritesMode, isFavorite])

  return (
    <div className="container-page py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          {resultTitle}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          {loading ? 'Searching...' : `${properties.length} properties found`}
        </p>
      </div>

      <div className="mb-6">
        <SearchBar variant="inline" onSearch={handleSearch} initialValues={filters} />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-700 dark:bg-slate-900">
            <FilterPanel
              filters={filters}
              onChange={handleFiltersChange}
              onClear={handleClear}
            />
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="btn-outline lg:hidden"
            >
              <Icon name="filter" size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-primary-600 text-xs font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <SortDropdown value={sort} onChange={setSort} />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400 dark:text-slate-500">
              <Spinner size={32} label="Loading properties..." />
            </div>
          ) : shownProperties.length === 0 ? (
            <EmptyState
              icon="search"
              title={favoritesMode ? 'No favorites yet' : 'No properties match your filters'}
              description={
                favoritesMode
                  ? 'Tap the heart on any property to save it here for later.'
                  : 'Try adjusting your search criteria or removing some filters.'
              }
              action={
                <button
                  type="button"
                  onClick={() => {
                    if (favoritesMode) {
                      setSearchParams({}, { replace: true })
                    } else {
                      handleClear()
                    }
                  }}
                  className="btn-primary"
                >
                  {favoritesMode ? 'Browse properties' : 'Clear filters'}
                </button>
              }
            />
          ) : (
            <PropertyGrid properties={shownProperties} columns={3} />
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] overflow-y-auto bg-white p-5 shadow-2xl animate-slide-in-right dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800"
                aria-label="Close filters"
              >
                <Icon name="x" size={20} />
              </button>
            </div>
            <FilterPanel filters={filters} onChange={handleFiltersChange} onClear={handleClear} />
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="btn-primary mt-6 w-full"
            >
              Show {loading ? '' : properties.length} results
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
