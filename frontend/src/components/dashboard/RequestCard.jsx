import PropTypes from 'prop-types'
import Icon from '../ui/Icon'
import PropertyImage from '../PropertyImage'
import { formatPrice, formatDate } from '../../utils/format'

const STATUS_STYLES = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300', icon: 'clock' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300', icon: 'check-circle' },
  rejected: { label: 'Declined', className: 'bg-red-50 text-red-700 dark:bg-red-950/80 dark:text-red-300', icon: 'x-circle' },
  contacted: { label: 'Contacted', className: 'bg-primary-50 text-primary-700 dark:bg-slate-800 dark:text-primary-400', icon: 'message' },
}

export default function RequestCard({ request, property, onUpdateStatus, tenantView = false }) {
  const status = STATUS_STYLES[request.status] || STATUS_STYLES.pending

  const thumbProperty =
    tenantView && request.propertyImage
      ? {
          title: request.propertyTitle || 'Property',
          category: request.propertyCategory || 'apartment',
          images: [request.propertyImage],
        }
      : null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:shadow-card-hover dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {thumbProperty ? (
            <div className="h-11 w-16 shrink-0 overflow-hidden rounded-xl">
              <PropertyImage property={thumbProperty} seed={0} className="h-full w-full" />
            </div>
          ) : (
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${status.className}`}>
              <Icon name={status.icon} size={20} />
            </span>
          )}
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {tenantView ? request.propertyTitle : request.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tenantView ? formatDate(request.createdAt) : request.phone}
            </p>
          </div>
        </div>
        <span className={`badge ${status.className}`}>
          <Icon name={status.icon} size={12} />
          {status.label}
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
        {tenantView && property && (
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{property.title}</p>
        )}
        {tenantView && (
          <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
              <Icon name="tag" size={13} />
              {formatPrice(request.propertyPrice ?? property?.price)}/mo
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="calendar" size={13} />
              {formatDate(request.createdAt)}
            </span>
            {request.ownerName && (
              <span className="inline-flex items-center gap-1">
                <Icon name="building" size={13} />
                {request.ownerName}
              </span>
            )}
          </div>
        )}
        {!tenantView && (
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Interested in {request.propertyTitle || 'a property'}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Icon name="phone" size={13} /> {request.phone}
          </span>
          {request.email && (
            <span className="inline-flex items-center gap-1">
              <Icon name="mail" size={13} /> {request.email}
            </span>
          )}
          {request.startDate && (
            <span className="inline-flex items-center gap-1">
              <Icon name="calendar" size={13} /> Rent: {request.startDate}
              {request.endDate && <> → {request.endDate}</>}
            </span>
          )}
          {!request.startDate && request.moveInDate && (
            <span className="inline-flex items-center gap-1">
              <Icon name="calendar" size={13} /> Moves in {request.moveInDate}
            </span>
          )}
          {request.message && (
            <span className="inline-flex w-full items-start gap-1.5 italic">
              <Icon name="message" size={13} className="mt-0.5 shrink-0" />
              &ldquo;{request.message}&rdquo;
            </span>
          )}
        </div>
      </div>

      {request.status === 'rejected' && request.rejectionReason && (
        <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300">
          <p className="flex items-start gap-1.5">
            <Icon name="info" size={13} className="mt-0.5 shrink-0" />
            <span>
              <span className="font-bold">Rejection reason:</span> {request.rejectionReason}
            </span>
          </p>
        </div>
      )}

      {request.status === 'approved' && tenantView && (
        <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
          <p className="flex items-start gap-1.5">
            <Icon name="check-circle" size={13} className="mt-0.5 shrink-0" />
            <span>Your rental request has been approved by Admin.</span>
          </p>
        </div>
      )}

      {onUpdateStatus && request.status === 'pending' && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onUpdateStatus(request.id, 'approved')}
            className="btn flex-1 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-950"
          >
            <Icon name="check" size={16} /> Approve
          </button>
          <button
            type="button"
            onClick={() => onUpdateStatus(request.id, 'rejected')}
            className="btn flex-1 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-950"
          >
            <Icon name="x" size={16} /> Decline
          </button>
        </div>
      )}

      {!onUpdateStatus && property && (
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">{property.subArea}, {property.city}</span>
            <span className="font-bold text-primary-700">{formatPrice(property.price)}/mo</span>
          </div>
        </div>
      )}
    </div>
  )
}

RequestCard.propTypes = {
  request: PropTypes.object.isRequired,
  property: PropTypes.object,
  onUpdateStatus: PropTypes.func,
  tenantView: PropTypes.bool,
}
