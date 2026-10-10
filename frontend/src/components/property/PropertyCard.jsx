import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import PropertyImage from '../PropertyImage'
import FavoriteButton from './FavoriteButton'
import Icon from '../ui/Icon'
import Avatar from '../ui/Avatar'
import { formatRent, timeAgo } from '../../utils/format'
import { useRent } from '../../context/RentContext'
import { getCategoryLabel } from './helpers'

export default function PropertyCard({ property, index = 0, onEdit, onDelete, ownerView = false }) {
  const { period } = useRent()
  const approvalBadge =
    ownerView && (property.approvalStatus === 'approved' || property.approvalStatus === 'pending' || property.approvalStatus === 'rejected')
  const approvalBadgeMeta = {
    approved: { label: 'Approved', className: 'bg-emerald-500 text-white', icon: 'check' },
    pending: { label: 'Pending review', className: 'bg-amber-400 text-amber-950', icon: 'clock' },
    rejected: { label: 'Declined', className: 'bg-red-500 text-white', icon: 'x' },
  }[property.approvalStatus]
  return (
    <Link
      to={`/properties/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover animate-fade-in-up dark:border-slate-700 dark:bg-slate-900"
      style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
          <PropertyImage property={property} seed={0} className="h-full w-full" />
        </div>
        <FavoriteButton propertyId={property.id} className="absolute right-3 top-3" />
        {property.images?.length > 1 && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <Icon name="camera" size={13} /> {property.images.length}
          </span>
        )}
        {property.featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-400 px-2.5 py-1 text-xs font-bold text-slate-900 shadow-sm">
            <Icon name="star-solid" size={12} />
            Featured
          </span>
        )}
        {approvalBadge && approvalBadgeMeta && (
          <span
            className={`absolute left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${approvalBadgeMeta.className} ${
              property.featured ? 'top-11' : 'top-3'
            }`}
          >
            <Icon name={approvalBadgeMeta.icon} size={12} />
            {approvalBadgeMeta.label}
          </span>
        )}
        {(onEdit || onDelete) && (
          <div className="absolute bottom-3 right-3 flex gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onEdit(property)
                }}
                className="grid h-8 w-8 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-primary-600"
                aria-label="Edit property"
              >
                <Icon name="edit" size={15} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDelete(property)
                }}
                className="grid h-8 w-8 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-red-500"
                aria-label="Delete property"
              >
                <Icon name="trash" size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="badge bg-primary-50 text-primary-700">{getCategoryLabel(property.category)}</span>
            {property.status === 'rented' ? (
              <span className="badge bg-slate-800 text-white font-extrabold uppercase dark:bg-slate-700">RENTED</span>
            ) : property.status === 'pending' ? (
              <span className="badge bg-amber-100 text-amber-800 font-bold uppercase dark:bg-amber-900/60 dark:text-amber-200">PENDING</span>
            ) : property.status === 'unavailable' ? (
              <span className="badge bg-slate-100 text-slate-500 font-bold uppercase dark:bg-slate-800 dark:text-slate-400">UNAVAILABLE</span>
            ) : (
              <span className="badge bg-emerald-50 text-emerald-700 font-semibold uppercase dark:bg-emerald-950/60 dark:text-emerald-300">AVAILABLE</span>
            )}
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">{timeAgo(property.postedAt)}</span>
        </div>

        <h3 className="line-clamp-1 text-base font-bold text-slate-900 transition-colors group-hover:text-primary-700 dark:text-white dark:group-hover:text-primary-400">
          {property.title}
        </h3>

        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
          <Icon name="map-pin" size={15} className="shrink-0 text-slate-400 dark:text-slate-500" />
          <span className="line-clamp-1">
            {property.subArea}, {property.city}
          </span>
        </p>

        {property.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {property.description}
          </p>
        ) : null}

        <div className="mt-3 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="bed" size={16} className="text-slate-400 dark:text-slate-500" />
            {property.bedrooms > 0 ? `${property.bedrooms} bd` : '—'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="bath" size={16} className="text-slate-400 dark:text-slate-500" />
            {property.bathrooms > 0 ? `${property.bathrooms} ba` : '—'}
          </span>
          {property.area ? (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="ruler" size={16} className="text-slate-400 dark:text-slate-500" />
              {property.area} m²
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {period === 'yearly' ? 'Per year' : 'Per month'}
            </p>
            <p className="text-lg font-extrabold text-primary-700">{formatRent(property.price, period)}</p>
          </div>
          <div className="flex items-center gap-2" title={property.owner?.name}>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{property.owner?.name}</p>
              <p className="flex items-center justify-end gap-1 text-[11px] text-emerald-600">
                {property.owner?.verified && (
                  <span className="inline-flex items-center gap-0.5">
                    <Icon name="verified" size={11} /> Verified
                  </span>
                )}
              </p>
            </div>
            <Avatar name={property.owner?.name} seed={property.owner?.id?.charCodeAt(2) || 0} size={36} />
          </div>
        </div>

        {ownerView && property.approvalStatus === 'rejected' && property.rejectionReason && (
          <p className="mt-2 line-clamp-2 text-xs font-medium text-red-600 dark:text-red-400">
            Rejection reason: {property.rejectionReason}
          </p>
        )}

        <span className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-700 transition-colors group-hover:bg-primary-600 group-hover:text-white dark:bg-slate-800 dark:text-primary-400 dark:group-hover:bg-primary-600 dark:group-hover:text-white">
          View details
          <Icon name="arrowRight" size={15} />
        </span>
      </div>
    </Link>
  )
}

PropertyCard.propTypes = {
  property: PropTypes.object.isRequired,
  index: PropTypes.number,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  ownerView: PropTypes.bool,
}
