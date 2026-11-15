import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import StatCard from '../../components/dashboard/StatCard'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { fetchAdminDashboard } from '../../api/admin'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchAdminDashboard()
      .then(({ data }) => {
        if (!cancelled) setStats(data)
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

  if (loading) {
    return (
      <AdminLayout title="Dashboard" subtitle="Platform overview at a glance.">
        <div className="grid place-items-center py-32 text-slate-400">
          <Spinner size={36} label="Loading dashboard..." />
        </div>
      </AdminLayout>
    )
  }

  if (error || !stats) {
    return (
      <AdminLayout title="Dashboard" subtitle="Platform overview at a glance.">
        <EmptyState icon="alert-triangle" title="Could not load the dashboard" description={error} />
      </AdminLayout>
    )
  }

  const sections = [
    {
      heading: 'Users',
      cards: [
        { icon: 'users', label: 'Total Users', value: stats.totalUsers, style: 'blue' },
        { icon: 'user-check', label: 'Total Owners', value: stats.totalOwners, style: 'violet' },
        { icon: 'user', label: 'Total Tenants', value: stats.totalTenants, style: 'green' },
      ],
    },
    {
      heading: 'Properties',
      cards: [
        { icon: 'building', label: 'Total Properties', value: stats.totalProperties, style: 'blue' },
        { icon: 'clock', label: 'Pending Properties', value: stats.pendingProperties, style: 'amber' },
        { icon: 'check-circle', label: 'Approved Properties', value: stats.approvedProperties, style: 'green' },
        { icon: 'x-circle', label: 'Rejected Properties', value: stats.rejectedProperties, style: 'violet' },
      ],
    },
    {
      heading: 'Rental requests',
      cards: [
        { icon: 'calendar', label: 'Total Requests', value: stats.totalRentalRequests, style: 'blue' },
        { icon: 'clock', label: 'Pending Requests', value: stats.pendingRentalRequests, style: 'amber' },
        { icon: 'check-circle', label: 'Approved Rentals', value: stats.approvedRentals, style: 'green' },
        { icon: 'x-circle', label: 'Rejected Rentals', value: stats.rejectedRentals, style: 'violet' },
      ],
    },
    {
      heading: 'Rental agreements',
      cards: [
        { icon: 'key', label: 'Total Agreements', value: stats.totalAgreements, style: 'blue' },
        { icon: 'check-circle', label: 'Active Agreements', value: stats.activeAgreements, style: 'green' },
      ],
    },
  ]

  return (
    <AdminLayout title="Dashboard" subtitle="Platform overview at a glance.">
      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {section.heading}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {section.cards.map((card) => (
                <StatCard key={card.label} {...card} />
              ))}
            </div>
          </section>
        ))}

        <div className="grid gap-4 lg:grid-cols-2">
          <Link
            to="/admin/approvals"
            className="group flex items-center justify-between rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-card transition hover:shadow-card-hover dark:border-amber-900 dark:from-amber-950/40 dark:to-slate-900"
          >
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                {stats.pendingProperties} pending
              </p>
              <h3 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
                Property approvals
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Review owner-submitted listings before they go live.
              </p>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-amber-100 text-amber-700 transition group-hover:scale-105 dark:bg-amber-900/60 dark:text-amber-300">
              <span className="grid h-12 w-12 place-items-center">
                <span className="grid h-12 w-12 place-items-center">
                  <span className="text-2xl font-extrabold">→</span>
                </span>
              </span>
            </span>
          </Link>

          <Link
            to="/admin/rental-requests"
            className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition hover:shadow-card-hover dark:border-slate-700 dark:bg-slate-900"
          >
            <div>
              <p className="text-sm font-semibold text-primary-700 dark:text-primary-400">
                {stats.pendingRentalRequests} pending
              </p>
              <h3 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
                Rental requests
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Monitor applications flowing between tenants and owners.
              </p>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-50 text-primary-600 transition group-hover:scale-105 dark:bg-slate-800 dark:text-primary-400">
              <span className="text-2xl font-extrabold">→</span>
            </span>
          </Link>
          <Link
            to="/admin/agreements"
            className="group flex items-center justify-between rounded-2xl border border-emerald-200 bg-white p-6 shadow-card transition hover:shadow-card-hover dark:border-emerald-900 dark:bg-slate-900"
          >
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {stats.activeAgreements} active
              </p>
              <h3 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
                Rental agreements
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Review tenants, owners, property details, and agreement terms.
              </p>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:scale-105 dark:bg-slate-800 dark:text-emerald-400">
              <span className="text-2xl font-extrabold">→</span>
            </span>
          </Link>
          <Link
            to="/admin/expirations"
            className="group flex items-center justify-between rounded-2xl border border-amber-200 bg-white p-6 shadow-card transition hover:shadow-card-hover dark:border-amber-900 dark:bg-slate-900"
          >
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                Admin review required
              </p>
              <h3 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
                Rental Expiration Management
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Review rental end dates, record expirations, and decide property readiness.
              </p>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-600 transition group-hover:scale-105 dark:bg-slate-800 dark:text-amber-400">
              <span className="text-2xl font-extrabold">→</span>
            </span>
          </Link>
        </div>
      </div>
    </AdminLayout>
  )
}
