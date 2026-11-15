import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Modal from '../ui/Modal'
import EmptyState from '../ui/EmptyState'
import Spinner from '../ui/Spinner'
import PropertyImage from '../PropertyImage'
import { fetchRentalAgreement } from '../../api/interactions'
import { formatDate, formatPrice } from '../../utils/format'

const STATUS_LABELS = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
}

export default function AgreementDetailsModal({ agreementId, onClose }) {
  const [agreement, setAgreement] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!agreementId) return undefined
    let cancelled = false
    setLoading(true)
    setError('')
    fetchRentalAgreement(agreementId)
      .then(({ data }) => {
        if (!cancelled) setAgreement(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load this rental agreement.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [agreementId])

  const property = agreement?.property || {}

  return (
    <Modal
      open={Boolean(agreementId)}
      onClose={onClose}
      title="Rental agreement details"
      size="lg"
    >
      {loading ? (
        <div className="grid place-items-center py-12">
          <Spinner size={32} label="Loading agreement..." />
        </div>
      ) : error ? (
        <EmptyState icon="alert-triangle" title="Could not load agreement" description={error} />
      ) : agreement ? (
        <div className="space-y-5">
          {property.id && (
            <div className="flex items-center gap-4">
              <PropertyImage property={property} className="h-20 w-28 shrink-0 rounded-xl" />
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold text-slate-900 dark:text-white">
                  {property.title || 'Rental property'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {[property.address, property.subArea, property.city].filter(Boolean).join(', ')}
                </p>
                {property.category && (
                  <p className="mt-1 text-xs capitalize text-slate-500 dark:text-slate-400">
                    {property.category}
                  </p>
                )}
              </div>
            </div>
          )}

          <dl className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 dark:bg-slate-800">
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Agreement status</dt>
              <dd className="mt-1 font-semibold text-slate-900 dark:text-white">
                {STATUS_LABELS[agreement.status] || agreement.status}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Monthly rent</dt>
              <dd className="mt-1 font-semibold text-slate-900 dark:text-white">
                {formatPrice(agreement.monthlyRent)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Start date</dt>
              <dd className="mt-1 text-slate-900 dark:text-white">{formatDate(agreement.startDate) || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">End date</dt>
              <dd className="mt-1 text-slate-900 dark:text-white">{formatDate(agreement.endDate) || 'Not specified'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Created</dt>
              <dd className="mt-1 text-slate-900 dark:text-white">{formatDate(agreement.createdAt) || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Rental request</dt>
              <dd className="mt-1 text-slate-900 dark:text-white">
                {agreement.application?.status || 'Not linked'}
              </dd>
            </div>
          </dl>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white">Tenant</h4>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{agreement.tenant?.name || '—'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{agreement.tenant?.email || ''}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{agreement.tenant?.phone || ''}</p>
            </section>
            <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white">Owner / landlord</h4>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{agreement.owner?.name || '—'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{agreement.owner?.email || ''}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{agreement.owner?.phone || ''}</p>
            </section>
          </div>

          {agreement.terms && (
            <section>
              <h4 className="font-bold text-slate-900 dark:text-white">Agreement terms</h4>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {agreement.terms}
              </p>
            </section>
          )}
        </div>
      ) : null}
    </Modal>
  )
}

AgreementDetailsModal.propTypes = {
  agreementId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
}
