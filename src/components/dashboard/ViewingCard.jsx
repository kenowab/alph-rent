

import PropTypes from 'prop-types'
import Icon from '../ui/Icon'
import { formatPrice, timeAgo, formatDate } from '../../utils/format'

const STATUS_STYLES = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300', icon: 'clock' },
  accepted: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300', icon: 'check-circle' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 dark:bg-red-950/80 dark:text-red-300', icon: 'x-circle' },
  completed: { label: 'Completed', className: 'bg-primary-50 text-primary-700 dark:bg-slate-800 dark:text-primary-400', icon: 'check' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', icon: 'x' },
}

export default function ViewingCard({
  viewing,
  onUpdateStatus,
  tenantView = false,
}) {
  const status = STATUS_STYLES[viewing.status] || STATUS_STYLES.pending
  const property = viewing.property || {}
  const personName = tenantView ? property.title : (viewing.tenant?.name || viewing.name)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:shadow-card-hover dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`grid h-11 w-11 place-items-center rounded-xl ${status.className}`}>
            <Icon name={status.icon} size={20} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {personName || 'Property viewing'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{timeAgo(viewing.createdAt)}</p>
          </div>
        </div>
        <span className={`badge ${status.className}`}>
          <Icon name={status.icon} size={12} />
          {status.label}
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
        {!tenantView && (
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {viewing.tenant?.name || viewing.name} requested a viewing
          </p>
        )}
        {tenantView && (
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {property.title || 'Property viewing'}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Icon name="calendar" size={13} />
            {formatDate(viewing.requestedDate)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" size={13} />
            {viewing.requestedTime}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="phone" size={13} />
            {viewing.tenant?.phone || viewing.phone}
          </span>
          {viewing.message && (
            <span className="inline-flex w-full items-start gap-1.5 italic">
              <Icon name="message" size={13} className="mt-0.5 shrink-0" />
              &ldquo;{viewing.message}&rdquo;
            </span>
          )}
        </div>
      </div>

      {onUpdateStatus && (
        <div className="mt-4 flex gap-2">
          {!tenantView && viewing.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={() => onUpdateStatus(viewing.id, 'accepted')}
                className="btn flex-1 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-950"
              >
                <Icon name="check" size={16} /> Accept
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus(viewing.id, 'rejected')}
                className="btn flex-1 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-950"
              >
                <Icon name="x" size={16} /> Reject
              </button>
            </>
          )}
          {!tenantView && viewing.status === 'accepted' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(viewing.id, 'completed')}
              className="btn flex-1 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-950"
            >
              <Icon name="check-circle" size={16} /> Mark completed
            </button>
          )}
          {tenantView && (viewing.status === 'pending' || viewing.status === 'accepted') && (
            <button
              type="button"
              onClick={() => onUpdateStatus(viewing.id, 'cancelled')}
              className="btn flex-1 border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Icon name="x" size={16} /> Cancel viewing
            </button>
          )}
        </div>
      )}

      {property.price && (
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              {property.subArea}, {property.city}
            </span>
            <span className="font-bold text-primary-700">{formatPrice(property.price)}/mo</span>
          </div>
        </div>
      )}
    </div>
  )
}

ViewingCard.propTypes = {
  viewing: PropTypes.object.isRequired,
  onUpdateStatus: PropTypes.func,
  tenantView: PropTypes.bool,
}
