import { useState } from 'react'
import PropTypes from 'prop-types'
import Icon from '../ui/Icon'
import { formatPrice, formatDate, timeAgo } from '../../utils/format'
import AgreementDetailsModal from './AgreementDetailsModal'

const STATUS_STYLES = {
  draft: { label: 'Draft — awaiting signature', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300', icon: 'edit' },
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300', icon: 'check-circle' },
  completed: { label: 'Completed', className: 'bg-primary-50 text-primary-700 dark:bg-slate-800 dark:text-primary-400', icon: 'check' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', icon: 'x' },
  expired: { label: 'Expired', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', icon: 'clock' },
}

export default function AgreementCard({ agreement, onUpdateStatus, tenantView = false }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const status = STATUS_STYLES[agreement.status] || STATUS_STYLES.draft
  const property = agreement.property || {}
  const otherParty = tenantView ? agreement.owner?.name : agreement.tenant?.name

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:shadow-card-hover dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`grid h-11 w-11 place-items-center rounded-xl ${status.className}`}>
            <Icon name={status.icon} size={20} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {property.title || 'Rental agreement'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tenantView ? 'Landlord' : 'Tenant'}: {otherParty || '—'} • {timeAgo(agreement.createdAt)}
            </p>
          </div>
        </div>
        <span className={`badge ${status.className}`}>
          <Icon name={status.icon} size={12} />
          {status.label}
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700 dark:text-slate-200">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="wallet" size={15} className="text-slate-400" />
            <span className="font-bold text-primary-700">{formatPrice(agreement.monthlyRent)}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">/ month</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="calendar" size={15} className="text-slate-400" />
            {formatDate(agreement.startDate)} → {formatDate(agreement.endDate)}
          </span>
          {property.subArea && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="map-pin" size={15} className="text-slate-400" />
              {property.subArea}, {property.city}
            </span>
          )}
        </div>
        {agreement.terms && (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {agreement.terms}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setDetailsOpen(true)}
        className="btn-outline mt-4 w-full"
      >
        <Icon name="file-text" size={16} /> View agreement details
      </button>

      {onUpdateStatus && (
        <div className="mt-4 flex gap-2">
          {agreement.status === 'draft' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(agreement.id, 'active')}
              className="btn flex-1 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-950"
            >
              <Icon name="check-circle" size={16} /> Activate agreement
            </button>
          )}
          {agreement.status === 'active' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(agreement.id, 'completed')}
              className="btn flex-1 border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 dark:border-primary-900 dark:bg-primary-950/60 dark:text-primary-300 dark:hover:bg-primary-950"
            >
              <Icon name="check" size={16} /> Mark completed
            </button>
          )}
          {(agreement.status === 'draft' || agreement.status === 'active') && (
            <button
              type="button"
              onClick={() => onUpdateStatus(agreement.id, 'cancelled')}
              className="btn flex-1 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-950"
            >
              <Icon name="x" size={16} /> Cancel
            </button>
          )}
        </div>
      )}

      <AgreementDetailsModal
        agreementId={detailsOpen ? agreement.id : null}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  )
}

AgreementCard.propTypes = {
  agreement: PropTypes.object.isRequired,
  onUpdateStatus: PropTypes.func,
  tenantView: PropTypes.bool,
}
