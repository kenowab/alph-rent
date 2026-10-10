import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminPropertyTable from '../../components/admin/AdminPropertyTable'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { fetchAdminPendingProperties, approveProperty, rejectProperty } from '../../api/admin'
import { useToast } from '../../context/ToastContext'

export default function AdminApprovalsPage() {
  const { showToast } = useToast()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    fetchAdminPendingProperties()
      .then((res) => setProperties(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

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
    <AdminLayout
      title="Property Approvals"
      subtitle="Properties submitted by owners that are waiting for review."
    >
      {loading ? (
        <div className="grid place-items-center py-24 text-slate-400">
          <Spinner size={32} label="Loading pending properties..." />
        </div>
      ) : error ? (
        <EmptyState icon="alert-triangle" title="Could not load approvals" description={error} />
      ) : properties.length === 0 ? (
        <EmptyState
          icon="check-circle"
          title="All caught up"
          description="No properties are waiting for approval right now."
        />
      ) : (
        <AdminPropertyTable
          properties={properties}
          onApprove={handleApprove}
          onReject={handleReject}
          emptyTitle="All caught up"
          emptyDescription="No properties are waiting for approval right now."
        />
      )}
    </AdminLayout>
  )
}
