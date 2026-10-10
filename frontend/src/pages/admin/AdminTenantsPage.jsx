import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import StatusBadge from '../../components/admin/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import Icon from '../../components/ui/Icon'
import Avatar from '../../components/ui/Avatar'
import { fetchAdminTenants, fetchAdminRentalRequests } from '../../api/admin'
import { formatDate } from '../../utils/format'

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchAdminTenants(), fetchAdminRentalRequests()])
      .then(([tenantsResult, requestsResult]) => {
        if (cancelled) return
        setTenants(tenantsResult.data)
        setRequests(requestsResult.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const tenantRequests = (tenantId) => requests.filter((r) => r.userId === tenantId)

  return (
    <AdminLayout title="Tenants" subtitle="Renters and their activity.">
      {loading ? (
        <div className="grid place-items-center py-24 text-slate-400">
          <Spinner size={32} label="Loading tenants..." />
        </div>
      ) : error ? (
        <EmptyState icon="alert-triangle" title="Could not load tenants" description={error} />
      ) : tenants.length === 0 ? (
        <EmptyState icon="user" title="No tenants yet" description="Tenants appear here once they register." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Tenant</th>
                  <th className="px-5 py-3.5 font-bold">Email</th>
                  <th className="px-5 py-3.5 font-bold">Phone</th>
                  <th className="px-5 py-3.5 font-bold">Rental requests</th>
                  <th className="px-5 py-3.5 font-bold">Approved</th>
                  <th className="px-5 py-3.5 font-bold">Account</th>
                  <th className="px-5 py-3.5 font-bold">Registered</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tenants.map((t) => (
                  <tr key={t.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={t.name} seed={t.avatarSeed} src={t.avatar} size={36} />
                        <p className="font-semibold text-slate-900 dark:text-white">{t.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{t.email}</td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{t.phone || '—'}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">{t.totalRequests}</td>
                    <td className="px-5 py-3.5">
                      <span className="badge bg-emerald-100 font-semibold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                        {t.approvedRentals}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge kind="user-status" value={t.active === false ? 'deactivated' : 'active'} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{formatDate(t.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(t)}
                        className="btn-outline px-3 py-1.5 text-xs"
                      >
                        View activity
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={`${selected?.name}'s rental activity`}
        size="lg"
      >
        {selected && (() => {
          const list = tenantRequests(selected.id)
          return list.length === 0 ? (
            <EmptyState icon="calendar" title="No rental requests" description="This tenant has not submitted any rental requests yet." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {r.propertyTitle || 'Property'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {r.propertyCity ? `${r.propertySubArea || ''}, ${r.propertyCity}` : '—'} • {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <StatusBadge kind="request" value={r.status} />
                </li>
              ))}
            </ul>
          )
        })()}
      </Modal>
    </AdminLayout>
  )
}
