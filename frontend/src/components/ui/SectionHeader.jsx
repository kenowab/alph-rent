import { Link } from 'react-router-dom'
import Icon from './Icon'

export default function SectionHeader({ title, subtitle, linkTo, linkLabel }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 sm:text-base">{subtitle}</p>
        )}
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 transition hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {linkLabel || 'View all'}
          <Icon name="arrowRight" size={16} />
        </Link>
      )}
    </div>
  )
}
