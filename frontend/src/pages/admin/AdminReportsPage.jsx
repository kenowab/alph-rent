import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import StatCard from '../../components/dashboard/StatCard'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { fetchAdminDashboard, fetchAdminProperties, fetchAdminRentalRequests } from '../../api/admin'
import { getCategoryLabel } from '../../components/property/helpers'

export default function AdminReportsPage() {
  const [stats, setStats] = useState(null)
  const [properties, setProperties] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchAdminDashboard(), fetchAdminProperties({ approval: 'all' }), fetchAdminRentalRequests()])
      .then(([statsResult, propsResult, reqsResult]) => {
        if (cancelled) return
        setStats(statsResult.data)
        setProperties(propsResult.data)
        setRequests(reqsResult.data)
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

  const countBy = (items, keyFn) => {
    const counts = {}
    items.forEach((item) => {
      const key = keyFn(item)
      counts[key] = (counts[key] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }

  const byCategory = countBy(properties, (p) => getCategoryLabel(p.category))
  const byCity = countBy(properties, (p) => p.city || 'Unknown')
  const byStatus = countBy(requests, (r) => r.status)

  const Bar = ({ label, count, total, color }) => (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: total ? `${(count / total) * 100}%` : '0%' }} />
      </div>
      <span className="w-8 shrink-0 text-right text-sm font-bold text-slate-900 dark:text-white">{count}</span>
    </div>
  )

  const breakdowns = []

  if (byCategory.length) {
    breakdowns.push({
      title: 'Properties by category',
      rows: byCategory.map(([label, count]) => (
        <Bar key={label} label={label} count={count} total={properties.length} color="bg-primary-600" />
      )),
    })
  }

  if (byCity.length) {
    breakdowns.push({
      title: 'Properties by city',
      rows: byCity.slice(0, 6).map(([label, count]) => (
        <Bar key={label} label={label} count={count} total={properties.length} color="bg-emerald-500" />
      )),
    })
  }

  if (byStatus.length) {
    breakdowns.push({
      title: 'Rental requests by status',
      rows: byStatus.map(([label, count]) => (
        <Bar key={label} label={label} count={count} total={requests.length} color="bg-amber-500" />
      )),
    })
  }

  return (
    <AdminLayout title="Reports" subtitle="Platform overview and activity breakdowns.">
      {loading ? (
        <div className="grid place-items-center py-24 text-slate-400">
          <Spinner size={32} label="Loading reports..." />
        </div>
      ) : error ? (
        <EmptyState icon="alert-triangle" title="Could not load reports" description={error} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="user" title="Total users" value={stats?.totalUsers ?? 0} />
            <StatCard icon="users" title="Owners" value={stats?.totalOwners ?? 0} />
            <StatCard icon="user" title="Tenants" value={stats?.totalTenants ?? 0} />
            <StatCard icon="home" title="Properties" value={stats?.totalProperties ?? 0} />
          </div>

          {breakdowns.length === 0 ? (
            <EmptyState
              icon="file-text"
              title="Not enough data"
              description="Reports will fill in as properties and rental requests are added."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {breakdowns.map((b) => (
                <div key={b.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-900">
                  <h3 className="mb-4 font-bold text-slate-900 dark:text-white">{b.title}</h3>
                  <div className="space-y-3">{b.rows}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
