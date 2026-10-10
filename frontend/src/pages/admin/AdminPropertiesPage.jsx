import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminPropertyTable from '../../components/admin/AdminPropertyTable'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { fetchAdminProperties, approveProperty, rejectProperty } from '../../api/admin'
import { useToast } from '../../context/ToastContext'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export default function AdminPropertiesPage() {
  const { showToast } = useToast()
  const [properties, setProperties] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    fetchAdminProperties({ approval: filter === 'all' ? 'all' : filter })
      .then((res) => setProperties(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filter])

  const handleApprove = (property) => {
    approveProperty(property.id)
      .then(() => {
        showToast(`${property.title} approved`, 'success')
        load()
      })
      .catch((err) => showToast(err.message, 'error'))
  }

  const handleReject = (property, reason) => {
    rejectProperty(property.id, reason)
      .then(() => {
        showToast(`${property.title} rejected`, 'success')
        load()
      })
      .catch((err) => showToast(err.message, 'error'))
  }

  return (
    <AdminLayout title="Properties" subtitle="All property listings across the platform.">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
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
            <Spinner size={32} label="Loading properties..." />
          </div>
        ) : error ? (
          <EmptyState icon="alert-triangle" title="Could not load properties" description={error} />
        ) : (
          <AdminPropertyTable
            properties={properties}
            onApprove={handleApprove}
            onReject={handleReject}
            emptyTitle="No properties"
            emptyDescription={`No ${filter === 'all' ? '' : filter + ' '}properties found.`}
          />
        )}
      </div>
    </AdminLayout>
  )
}
