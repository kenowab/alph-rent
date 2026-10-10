import PropTypes from 'prop-types'
import Icon from '../ui/Icon'
import { CITIES, CATEGORIES, PRICE_RANGES } from '../../data/meta'

const BEDROOM_OPTIONS = [
  { id: 'any', label: 'Any', value: 0 },
  { id: '1', label: '1+', value: 1 },
  { id: '2', label: '2+', value: 2 },
  { id: '3', label: '3+', value: 3 },
  { id: '4', label: '4+', value: 4 },
]

const BATHROOM_OPTIONS = [
  { id: 'any', label: 'Any', value: 0 },
  { id: '1', label: '1+', value: 1 },
  { id: '2', label: '2+', value: 2 },
  { id: '3', label: '3+', value: 3 },
]

const AMENITIES = [
  { id: 'furnished', label: 'Furnished' },
  { id: 'parking', label: 'Parking' },
  { id: 'security', label: 'Security' },
  { id: 'waterTank', label: 'Water tank' },
  { id: 'elevator', label: 'Elevator' },
]

export default function FilterPanel({ filters, onChange, onClear, compact = false }) {
  const setFilter = (key, value) => onChange({ ...filters, [key]: value })

  const inputClass = 'input !py-2.5 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500'
  const labelClass = 'label text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'

  return (
    <div className={`${compact ? 'space-y-4' : 'space-y-6'}`}>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
          <Icon name="filter" size={18} className="text-primary-600" />
          Filters
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-medium text-primary-600 transition hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Clear all
        </button>
      </div>

      <div>
        <label className={labelClass} htmlFor="filter-city">City</label>
        <select
          id="filter-city"
          value={filters.city || 'all'}
          onChange={(e) => setFilter('city', e.target.value)}
          className={inputClass}
        >
          <option value="all">All Ethiopia</option>
          {CITIES.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="filter-category">Property type</label>
        <select
          id="filter-category"
          value={filters.category || 'all'}
          onChange={(e) => setFilter('category', e.target.value)}
          className={inputClass}
        >
          <option value="all">All types</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="filter-status">Availability</label>
        <select
          id="filter-status"
          value={filters.status || ''}
          onChange={(e) => setFilter('status', e.target.value)}
          className={inputClass}
        >
          <option value="">Available only</option>
          <option value="all">All listings</option>
          <option value="pending">Pending</option>
          <option value="rented">Rented</option>
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="filter-price">Monthly price</label>
        <select
          id="filter-price"
          value={filters.priceRange || ''}
          onChange={(e) => setFilter('priceRange', e.target.value)}
          className={inputClass}
        >
          <option value="">Any price</option>
          {PRICE_RANGES.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Bedrooms</label>
        <div className="grid grid-cols-5 gap-1.5">
          {BEDROOM_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilter('minBedrooms', opt.value)}
              className={`rounded-lg border px-1 py-2 text-xs font-semibold transition ${
                filters.minBedrooms === opt.value
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Bathrooms</label>
        <div className="grid grid-cols-4 gap-1.5">
          {BATHROOM_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilter('minBathrooms', opt.value)}
              className={`rounded-lg border px-1 py-2 text-xs font-semibold transition ${
                filters.minBathrooms === opt.value
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className={labelClass}>Amenities</span>
        <div className="mt-2 space-y-2.5">
          {AMENITIES.map((amenity) => (
            <label
              key={amenity.id}
              className="flex cursor-pointer items-center gap-3 text-sm text-slate-700 dark:text-slate-200"
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                  filters.amenities?.includes(amenity.id)
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
                }`}
              >
                {filters.amenities?.includes(amenity.id) && <Icon name="check" size={13} />}
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={filters.amenities?.includes(amenity.id) || false}
                onChange={(e) => {
                  const current = filters.amenities || []
                  const next = e.target.checked
                    ? [...current, amenity.id]
                    : current.filter((a) => a !== amenity.id)
                  setFilter('amenities', next)
                }}
              />
              {amenity.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

FilterPanel.propTypes = {
  filters: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  compact: PropTypes.bool,
}
