import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import StatusBadge from '../../components/admin/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import Icon from '../../components/ui/Icon'
import Avatar from '../../components/ui/Avatar'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { fetchAdminUsers, updateAdminUser } from '../../api/admin'
import { formatDate } from '../../utils/format'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'admin', label: 'Admin' },
  { id: 'owner', label: 'Owner' },
  { id: 'tenant', label: 'Tenant' },
]

export default function AdminUsersPage() {
  const toast = useToast()
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [role, setRole] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [pendingRole, setPendingRole] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async (nextRole, nextSearch) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await fetchAdminUsers({ role: nextRole, search: nextSearch })
      setUsers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(role, search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  const filtered = useMemo(() => {
    if (!search.trim()) return users
    const needle = search.trim().toLowerCase()
    return users.filter((u) =>
      [u.name, u.email, u.phone].some((field) => String(field || '').toLowerCase().includes(needle)),
    )
  }, [users, search])

  const openView = (user) => {
    setSelected(user)
    setPendingRole(user.role)
  }

  const saveChanges = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const { data } = await updateAdminUser(selected.id, {
        ...(pendingRole !== selected.role ? { role: pendingRole } : {}),
        ...(selected.active === false ? { active: true } : {}),
      })
      toast.success('User updated successfully')
      setSelected(null)
      setUsers((current) => current.map((u) => (u.id === data.id ? data : u)))
      load(role, search)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const { data } = await updateAdminUser(selected.id, { active: !selected.active })
      toast.success(data.active ? 'Account activated' : 'Account deactivated')
      setSelected(data)
      setUsers((current) => current.map((u) => (u.id === data.id ? data : u)))
      load(role, search)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout title="Users" subtitle="Manage every account on the platform.">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setRole(f.id)}
              className={`btn px-4 py-2 text-sm ${role === f.id ? 'bg-primary-600 text-white hover:bg-primary-700' : 'btn-outline'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone..."
            className="input pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-24 text-slate-400">
          <Spinner size={32} label="Loading users..." />
        </div>
      ) : error ? (
        <EmptyState icon="alert-triangle" title="Could not load users" description={error} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="users" title="No users found" description="Try a different filter or search term." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 font-bold">User</th>
                  <th className="px-5 py-3.5 font-bold">Email</th>
                  <th className="px-5 py-3.5 font-bold">Phone</th>
                  <th className="px-5 py-3.5 font-bold">Role</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold">Registered</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((u) => (
                  <tr key={u.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} seed={u.avatarSeed} src={u.avatar} size={36} />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
                          {u.id === me?.id && (
                            <p className="text-[11px] font-bold text-primary-600 dark:text-primary-400">You</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{u.email}</td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{u.phone || '—'}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge kind="role" value={u.role} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge kind="user-status" value={u.active === false ? 'deactivated' : 'active'} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button type="button" onClick={() => openView(u)} className="btn-outline px-3 py-1.5 text-xs">
                        View
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
        title="User details"
        size="md"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={selected.name} seed={selected.avatarSeed} src={selected.avatar} size={56} />
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{selected.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge kind="role" value={selected.role} />
                  <StatusBadge kind="user-status" value={selected.active === false ? 'deactivated' : 'active'} />
                </div>
              </div>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</dt>
                <dd className="mt-0.5 text-slate-700 dark:text-slate-200">{selected.email || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</dt>
                <dd className="mt-0.5 text-slate-700 dark:text-slate-200">{selected.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">City</dt>
                <dd className="mt-0.5 text-slate-700 dark:text-slate-200">{selected.city || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Registered</dt>
                <dd className="mt-0.5 text-slate-700 dark:text-slate-200">{formatDate(selected.createdAt)}</dd>
              </div>
            </dl>

            <div>
              <label className="label" htmlFor="admin-user-role">Role</label>
              <select
                id="admin-user-role"
                className="input"
                value={pendingRole}
                onChange={(e) => setPendingRole(e.target.value)}
                disabled={selected.role === 'admin'}
              >
                {selected.role === 'admin' && (
                  <option value="admin">Admin (Platform Administrator)</option>
                )}
                <option value="owner">Owner</option>
                <option value="tenant">Tenant</option>
              </select>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {selected.role === 'admin'
                  ? 'Only 1 person is allowed as Platform Admin and cannot be demoted.'
                  : 'Only 1 person is allowed as Admin. Tenants and owners can switch between Tenant and Owner.'}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={toggleActive}
                disabled={saving}
                className={`btn flex-1 sm:flex-none ${selected.active === false ? 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700' : 'border-red-600 bg-red-600 text-white hover:bg-red-700'}`}
              >
                {selected.active === false ? 'Activate account' : 'Deactivate account'}
              </button>
              <button type="button" onClick={saveChanges} disabled={saving} className="btn-primary">
                {saving ? <Spinner size={16} /> : <Icon name="check" size={16} />}
                Save changes
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  )
}
