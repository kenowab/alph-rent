import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import StatusBadge from '../../components/admin/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import Icon from '../../components/ui/Icon'
import {
  fetchAdminRentalRequests,
  approveRentalRequest,
  rejectRentalRequest,
} from '../../api/admin'
import { useToast } from '../../context/ToastContext'
import { formatDate, formatPrice } from '../../utils/format'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function AdminRentalRequestsPage() {
  const { showToast } = useToast()
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approveTarget, setApproveTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    setLoading(true)
    fetchAdminRentalRequests()
      .then((res) => setRequests(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleApprove = (request) => {
    approveRentalRequest(request.id)
      .then(() => {
        showToast('Rental request approved', 'success')
        load()
      })
      .catch((err) => showToast(err.message, 'error'))
  }

  const confirmReject = () => {
    if (!rejectTarget) return
    setBusy(true)
    rejectRentalRequest(rejectTarget.id, rejectReason)
      .then(() => {
        showToast('Rental request declined', 'success')
        setRejectTarget(null)
        setRejectReason('')
        load()
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setBusy(false))
  }

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter)

  return (
    <AdminLayout title="Rental Requests" subtitle="All rental requests submitted by tenants.">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`btn px-4 py-2 text-sm ${filter === f.value ? 'border-primary-700 bg-primary-700 text-white hover:bg-primary-800' : 'btn-outline'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="grid place-items-center py-24 text-slate-400">
            <Spinner size={32} label="Loading rental requests..." />
          </div>
        ) : error ? (
          <EmptyState icon="alert-triangle" title="Could not load rental requests" description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No rental requests"
            description="No requests match this view yet."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">Tenant</th>
                    <th className="px-5 py-3.5 font-bold">Email</th>
                    <th className="px-5 py-3.5 font-bold">Phone</th>
                    <th className="px-5 py-3.5 font-bold">Property</th>
                    <th className="px-5 py-3.5 font-bold">Owner</th>
                    <th className="px-5 py-3.5 font-bold">Requested</th>
                    <th className="px-5 py-3.5 font-bold">Status</th>
                    <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((r) => (
                    <tr key={r.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                        {r.tenantName || r.name || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {r.tenantEmail || r.email || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {r.tenantPhone || r.phone || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/properties/${r.propertyId}`}
                          className="line-clamp-2 max-w-[220px] font-medium text-primary-700 transition hover:underline dark:text-primary-400"
                        >
                          <Icon name="home" size={14} className="mr-1 inline" />
                          {r.propertyTitle || 'Property'}
                        </Link>
                        {r.propertyCity && (
                          <p className="text-xs text-slate-400">
                            {r.propertySubArea || ''}, {r.propertyCity}
                          </p>
                        )}
                        {r.propertyPrice != null && (
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {formatPrice(r.propertyPrice)}/mo
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-600 dark:text-slate-300">{r.ownerName || '—'}</p>
                        {r.ownerEmail && <p className="text-xs text-slate-400">{r.ownerEmail}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <StatusBadge kind="request" value={r.status} />
                          {r.status === 'rejected' && r.rejectionReason && (
                            <p
                              className="max-w-[200px] text-[11px] text-red-600 dark:text-red-400"
                              title={r.rejectionReason}
                            >
                              {r.rejectionReason}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {r.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => setApproveTarget(r)}
                                className="btn border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectTarget(r)}
                                className="btn border-red-600 bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
                              >
                                Decline
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
        )}
      </div>

      <Modal
        open={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        title="Approve rental request?"
        size="sm"
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Approve the rental request from{' '}
          <span className="font-semibold text-slate-900 dark:text-white">
            {approveTarget?.tenantName || approveTarget?.name}
          </span>{' '}
          for{' '}
          <span className="font-semibold text-slate-900 dark:text-white">
            {approveTarget?.propertyTitle}
          </span>
          ? The property will stop accepting new applications and a rental agreement will be
          generated.
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
              handleApprove(target)
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
        title="Decline rental request"
        size="sm"
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Decline the rental request from{' '}
          <span className="font-semibold text-slate-900 dark:text-white">
            {rejectTarget?.tenantName || rejectTarget?.name}
          </span>
          ? The tenant will be notified.
        </p>
        <div className="mt-4">
          <label className="label" htmlFor="admin-request-reject-reason">
            Rejection reason (optional)
          </label>
          <textarea
            id="admin-request-reject-reason"
            className="input min-h-[90px] resize-y"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Tenant did not meet income requirements"
            maxLength={1000}
          />
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setRejectTarget(null)}
            className="btn-outline flex-1"
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmReject}
            disabled={busy}
            className="btn flex-1 border-red-600 bg-red-600 text-white hover:bg-red-700"
          >
            <Icon name="x" size={16} /> {busy ? 'Declining...' : 'Decline'}
          </button>
        </div>
      </Modal>
    </AdminLayout>
  )
}
