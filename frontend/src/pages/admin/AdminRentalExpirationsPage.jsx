import { useCallback, useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import EmptyState from '../../components/ui/EmptyState'
import Icon from '../../components/ui/Icon'
import Spinner from '../../components/ui/Spinner'
import {
  fetchAdminRentalExpirations,
  markAdminAgreementExpired,
  setExpiredAgreementPropertyAvailability,
} from '../../api/admin'
import { formatDate } from '../../utils/format'

function remainingDays(endDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate || '')) return null
  const end = Date.parse(`${endDate}T00:00:00.000Z`)
  const today = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`)
  if (Number.isNaN(end) || new Date(end).toISOString().slice(0, 10) !== endDate) return null
  return Math.round((end - today) / 86400000)
}

function expirationLabel(agreement, days) {
  if (agreement.status === 'expired') return 'Expired'
  if (days === null) return 'Invalid end date'
  if (days < 0) return 'Expired / Action Required'
  return 'Active'
}

export default function AdminRentalExpirationsPage() {
  const [agreements, setAgreements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyAction, setBusyAction] = useState('')

  const loadAgreements = useCallback(async () => {
    const { data } = await fetchAdminRentalExpirations()
    setAgreements(data)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchAdminRentalExpirations()
      .then(({ data }) => {
        if (!cancelled) setAgreements(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load rental expirations.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleExpire(agreement) {
    if (!window.confirm(`Mark the rental for "${agreement.property?.title || 'this property'}" as expired?`)) {
      return
    }
    setBusyAction(`${agreement.id}:expire`)
    setError('')
    setMessage('')
    try {
      await markAdminAgreementExpired(agreement.id)
      await loadAgreements()
      setMessage('Rental marked as expired. The tenant and owner have been notified.')
    } catch (err) {
      setError(err.message || 'Could not mark this rental as expired.')
    } finally {
      setBusyAction('')
    }
  }

  async function handleAvailability(agreement, status) {
    const action = status === 'available' ? 'mark this property as available' : 'keep this property unavailable'
    if (!window.confirm(`Are you sure you want to ${action}?`)) return

    setBusyAction(`${agreement.id}:${status}`)
    setError('')
    setMessage('')
    try {
      await setExpiredAgreementPropertyAvailability(agreement.id, status)
      await loadAgreements()
      setMessage(status === 'available' ? 'Property marked as available.' : 'Property kept unavailable.')
    } catch (err) {
      setError(err.message || 'Could not update property availability.')
    } finally {
      setBusyAction('')
    }
  }

  return (
    <AdminLayout
      title="Rental Expiration Management"
      subtitle="Review end dates, explicitly record expired rentals, and decide property readiness."
    >
      <div className="space-y-4">
        <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          Rentals are never expired automatically. Property availability stays unchanged until an administrator reviews it.
        </p>
        {message && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}

        {loading ? (
          <div className="grid place-items-center py-24 text-slate-400">
            <Spinner size={32} label="Loading rental expirations..." />
          </div>
        ) : error && agreements.length === 0 ? (
          <EmptyState icon="alert-triangle" title="Could not load rental expirations" description={error} />
        ) : agreements.length === 0 ? (
          <EmptyState
            icon="clock"
            title="No expiring rentals"
            description="Active rentals with end dates and previously expired rentals will appear here."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-bold">Property</th>
                    <th className="px-4 py-3 font-bold">Tenant</th>
                    <th className="px-4 py-3 font-bold">Owner</th>
                    <th className="px-4 py-3 font-bold">Rental dates</th>
                    <th className="px-4 py-3 font-bold">Rental status</th>
                    <th className="px-4 py-3 font-bold">Property availability</th>
                    <th className="px-4 py-3 font-bold">Admin actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {agreements.map((agreement) => {
                    const days = remainingDays(agreement.endDate)
                    const actionRequired = agreement.status === 'active' && days !== null && days < 0
                    const isExpired = agreement.status === 'expired'
                    const propertyStatus = agreement.property?.status
                    return (
                      <tr key={agreement.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {agreement.property?.title || 'Property unavailable'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {[agreement.property?.subArea, agreement.property?.city].filter(Boolean).join(', ') || '—'}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                          {agreement.tenant?.name || '—'}
                        </td>
                        <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                          {agreement.owner?.name || '—'}
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          <span className="block">Start: {formatDate(agreement.startDate) || '—'}</span>
                          <span className="block">End: {formatDate(agreement.endDate) || '—'}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`badge ${
                            actionRequired
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                              : isExpired
                                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                          }`}>
                            {expirationLabel(agreement, days)}
                          </span>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {isExpired || (days !== null && days < 0)
                              ? 'Expired'
                              : days === null
                                ? 'Remaining time unavailable'
                                : days === 0
                                  ? 'Ends today'
                                  : `${days} day${days === 1 ? '' : 's'} remaining`}
                          </p>
                        </td>
                        <td className="px-4 py-4 capitalize text-slate-700 dark:text-slate-300">
                          {propertyStatus || 'Unavailable'}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-start gap-2">
                            {actionRequired && (
                              <button
                                type="button"
                                disabled={Boolean(busyAction)}
                                onClick={() => handleExpire(agreement)}
                                className="btn-primary whitespace-nowrap px-3 py-1.5 text-xs disabled:opacity-60"
                              >
                                <Icon name="clock" size={14} />
                                {busyAction === `${agreement.id}:expire` ? 'Updating...' : 'Mark as Expired'}
                              </button>
                            )}
                            {isExpired && agreement.property && (
                              <>
                                <button
                                  type="button"
                                  disabled={Boolean(busyAction) || propertyStatus === 'available'}
                                  onClick={() => handleAvailability(agreement, 'available')}
                                  className="btn-primary whitespace-nowrap px-3 py-1.5 text-xs disabled:opacity-60"
                                >
                                  Mark Available
                                </button>
                                <button
                                  type="button"
                                  disabled={Boolean(busyAction) || propertyStatus === 'unavailable'}
                                  onClick={() => handleAvailability(agreement, 'unavailable')}
                                  className="btn-outline whitespace-nowrap px-3 py-1.5 text-xs disabled:opacity-60"
                                >
                                  Keep Unavailable
                                </button>
                              </>
                            )}
                            {!actionRequired && !isExpired && (
                              <span className="text-xs text-slate-400">No action required</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
