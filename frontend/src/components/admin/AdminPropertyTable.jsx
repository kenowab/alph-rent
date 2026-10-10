import { useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import EmptyState from '../ui/EmptyState'
import Modal from '../ui/Modal'
import Icon from '../ui/Icon'
import PropertyImage from '../PropertyImage'
import { getCategoryLabel } from '../property/helpers'
import { formatPrice, formatDate } from '../../utils/format'

export default function AdminPropertyTable({
  properties,
  onApprove,
  onReject,
  showRejectReason = true,
  emptyTitle = 'No properties',
  emptyDescription = 'No properties match this view yet.',
}) {
  const [approveTarget, setApproveTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const openReject = (property) => {
    setRejectTarget(property)
    setRejectReason(property.rejectionReason || '')
  }

  const confirmReject = () => {
    if (!rejectTarget) return
    onReject(rejectTarget, rejectReason)
    setRejectTarget(null)
  }

  if (properties.length === 0) {
    return <EmptyState icon="building" title={emptyTitle} description={emptyDescription} />
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5 font-bold">Property</th>
                <th className="px-5 py-3.5 font-bold">Owner</th>
                <th className="px-5 py-3.5 font-bold">Location</th>
                <th className="px-5 py-3.5 font-bold">Price</th>
                <th className="px-5 py-3.5 font-bold">Type</th>
                <th className="px-5 py-3.5 font-bold">Created</th>
                <th className="px-5 py-3.5 font-bold">Status</th>
                <th className="px-5 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {properties.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg">
                        <PropertyImage property={p} className="h-full w-full" />
                      </div>
                      <Link
                        to={`/properties/${p.id}`}
                        className="line-clamp-2 max-w-[220px] font-semibold text-slate-900 transition hover:text-primary-700 dark:text-white dark:hover:text-primary-400"
                      >
                        {p.title}
                      </Link>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{p.owner?.name || '—'}</p>
                    <p className="text-xs text-slate-400">{p.owner?.email || ''}</p>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {p.subArea}, {p.city}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">{formatPrice(p.price)}</td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{getCategoryLabel(p.category)}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{formatDate(p.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="space-y-1">
                      <StatusBadge kind="approval" value={p.approvalStatus || 'pending'} />
                      {p.approvalStatus === 'rejected' && showRejectReason && p.rejectionReason && (
                        <p className="max-w-[180px] text-[11px] text-red-600 dark:text-red-400" title={p.rejectionReason}>
                          {p.rejectionReason}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/properties/${p.id}`} className="btn-outline px-3 py-1.5 text-xs">
                        View
                      </Link>
                      {p.approvalStatus === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setApproveTarget(p)}
                            className="btn border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openReject(p)}
                            className="btn border-red-600 bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        title="Approve property?"
        size="sm"
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Approve <span className="font-semibold text-slate-900 dark:text-white">{approveTarget?.title}</span>?
          It will become visible to tenants immediately.
        </p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => setApproveTarget(null)} className="btn-outline flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const target = approveTarget
              setApproveTarget(null)
              onApprove(target)
            }}
            className="btn flex-1 border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Icon name="check" size={16} /> Approve
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Reject property"
        size="sm"
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Reject <span className="font-semibold text-slate-900 dark:text-white">{rejectTarget?.title}</span>? The
          owner will be notified.
        </p>
        <div className="mt-4">
          <label className="label" htmlFor="admin-reject-reason">Rejection reason (optional)</label>
          <textarea
            id="admin-reject-reason"
            className="input min-h-[90px] resize-y"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Missing photos, unclear address, or price seems unrealistic"
            maxLength={1000}
          />
        </div>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => setRejectTarget(null)} className="btn-outline flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmReject}
            className="btn flex-1 border-red-600 bg-red-600 text-white hover:bg-red-700"
          >
            <Icon name="x" size={16} /> Reject
          </button>
        </div>
      </Modal>
    </>
  )
}

AdminPropertyTable.propTypes = {
  properties: PropTypes.array,
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  showRejectReason: PropTypes.bool,
  emptyTitle: PropTypes.string,
  emptyDescription: PropTypes.string,
}
