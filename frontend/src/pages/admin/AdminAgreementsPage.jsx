import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import AgreementDetailsModal from '../../components/dashboard/AgreementDetailsModal'
import EmptyState from '../../components/ui/EmptyState'
import Icon from '../../components/ui/Icon'
import PropertyImage from '../../components/PropertyImage'
import Spinner from '../../components/ui/Spinner'
import { fetchAdminAgreements } from '../../api/interactions'
import { formatDate, formatPrice } from '../../utils/format'

const STATUS_STYLES = {
  draft: 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300',
  active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300',
  completed: 'bg-primary-50 text-primary-700 dark:bg-slate-800 dark:text-primary-400',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  expired: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

export default function AdminAgreementsPage() {
  const [agreements, setAgreements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAgreement, setSelectedAgreement] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchAdminAgreements()
      .then(({ data }) => {
        if (!cancelled) setAgreements(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load rental agreements.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AdminLayout
      title="Rental Agreements"
      subtitle="Agreements created from administrator-approved rental requests."
    >
      {loading ? (
        <div className="grid place-items-center py-24 text-slate-400">
          <Spinner size={32} label="Loading rental agreements..." />
        </div>
      ) : error ? (
        <EmptyState icon="alert-triangle" title="Could not load agreements" description={error} />
      ) : agreements.length === 0 ? (
        <EmptyState
          icon="key"
          title="No rental agreements yet"
          description="Agreements will appear here after an administrator approves a rental request."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-bold">Property</th>
                  <th className="px-4 py-3 font-bold">Tenant</th>
                  <th className="px-4 py-3 font-bold">Owner</th>
                  <th className="px-4 py-3 font-bold">Rent</th>
                  <th className="px-4 py-3 font-bold">Term</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Created</th>
                  <th className="px-4 py-3 font-bold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {agreements.map((agreement) => (
                  <tr key={agreement.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="flex min-w-52 items-center gap-3">
                        {agreement.property && (
                          <PropertyImage
                            property={agreement.property}
                            className="h-12 w-16 shrink-0 rounded-lg"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {agreement.property?.title || 'Property unavailable'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {[agreement.property?.subArea, agreement.property?.city].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {agreement.tenant?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {agreement.owner?.name || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {formatPrice(agreement.monthlyRent)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                      {formatDate(agreement.startDate) || '—'}
                      <br />
                      {formatDate(agreement.endDate) || 'No end date'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_STYLES[agreement.status] || STATUS_STYLES.draft}`}>
                        {agreement.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {formatDate(agreement.createdAt) || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedAgreement(agreement.id)}
                        className="btn-outline px-3 py-1.5 text-xs"
                      >
                        <Icon name="file-text" size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <AgreementDetailsModal
        agreementId={selectedAgreement}
        onClose={() => setSelectedAgreement(null)}
      />
    </AdminLayout>
  )
}
