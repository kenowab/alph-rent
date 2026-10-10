import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import StatusBadge from '../../components/admin/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import Icon from '../../components/ui/Icon'
import Avatar from '../../components/ui/Avatar'
import PropertyImage from '../../components/PropertyImage'
import { fetchAdminOwners, fetchAdminProperties } from '../../api/admin'
import { formatPrice, formatDate } from '../../utils/format'

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchAdminOwners(), fetchAdminProperties({ approval: 'all' })])
      .then(([ownersResult, propsResult]) => {
        if (cancelled) return
        setOwners(ownersResult.data)
        setProperties(propsResult.data)
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

  const ownerProperties = (ownerId) => properties.filter((p) => p.owner?.id === ownerId)

  return (
    <AdminLayout title="Owners" subtitle="Property owners and their portfolios.">
      {loading ? (
        <div className="grid place-items-center py-24 text-slate-400">
          <Spinner size={32} label="Loading owners..." />
        </div>
      ) : error ? (
        <EmptyState icon="alert-triangle" title="Could not load owners" description={error} />
      ) : owners.length === 0 ? (
        <EmptyState icon="user-check" title="No owners yet" description="Owners appear here once they register." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Owner</th>
                  <th className="px-5 py-3.5 font-bold">Email</th>
                  <th className="px-5 py-3.5 font-bold">Phone</th>
                  <th className="px-5 py-3.5 font-bold">Properties</th>
                  <th className="px-5 py-3.5 font-bold">Approved</th>
                  <th className="px-5 py-3.5 font-bold">Pending</th>
                  <th className="px-5 py-3.5 font-bold">Account</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {owners.map((o) => (
                  <tr key={o.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={o.name} seed={o.avatarSeed} src={o.avatar} size={36} />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{o.name}</p>
                          <p className="text-xs text-slate-400">{formatDate(o.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{o.email}</td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{o.phone || '—'}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">{o.totalProperties}</td>
                    <td className="px-5 py-3.5">
                      <span className="badge bg-emerald-100 font-semibold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                        {o.approvedProperties}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="badge bg-amber-100 font-semibold text-amber-700 dark:bg-amber-900/60 dark:text-amber-200">
                        {o.pendingProperties}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge kind="user-status" value={o.active === false ? 'deactivated' : 'active'} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(o)}
                        className="btn-outline px-3 py-1.5 text-xs"
                      >
                        View properties
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
        title={`${selected?.name}'s properties`}
        size="xl"
      >
        {selected && (() => {
          const list = ownerProperties(selected.id)
          return list.length === 0 ? (
            <EmptyState icon="building" title="No properties" description="This owner has not posted any properties yet." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {list.map((p) => (
                <div key={p.id} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <PropertyImage property={p} className="aspect-[16/9]" />
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-slate-900 dark:text-white">{p.title}</p>
                      <StatusBadge kind="approval" value={p.approvalStatus || 'pending'} />
                    </div>
                    <p className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                      <Icon name="map-pin" size={14} /> {p.subArea}, {p.city}
                    </p>
                    <p className="text-sm font-extrabold text-primary-700 dark:text-primary-400">
                      {formatPrice(p.price)}
                      <span className="ml-1 text-xs font-medium text-slate-400">/mo</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </Modal>
    </AdminLayout>
  )
}
