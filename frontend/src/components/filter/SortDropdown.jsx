import { useState } from 'react'
import PropTypes from 'prop-types'
import Icon from '../ui/Icon'
import { SORT_OPTIONS } from '../../data/meta'

export default function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const current = SORT_OPTIONS.find((o) => o.id === value) || SORT_OPTIONS[0]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Icon name="filter" size={16} className="text-slate-400 dark:text-slate-500" />
        <span className="hidden sm:inline">Sort:</span>
        {current.label}
        <Icon name="chevronDown" size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <ul
            className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-card-hover animate-fade-in dark:border-slate-700 dark:bg-slate-900"
            role="listbox"
          >
            {SORT_OPTIONS.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.id === value}
                  onClick={() => {
                    onChange(option.id)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-primary-50 dark:hover:bg-slate-800 ${
                    option.id === value ? 'font-semibold text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {option.label}
                  {option.id === value && <Icon name="check" size={16} />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

SortDropdown.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}
