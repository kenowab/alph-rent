import { useState } from 'react'
import Icon from '../ui/Icon'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function ProfileSettings({ type }) {
  const { user, updateUser } = useAuth()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: 'Addis Ababa',
    bio: type === 'owner' ? 'Property owner on Alpha Rent Ethiopia.' : '',
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateUser({ ...user, name: form.name, email: form.email, phone: form.phone })
      toast.success('Profile updated successfully')
    } finally {
      setSaving(false)
    }
  }

  const row = (label, value, icon) => (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
      <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Icon name={icon} size={16} className="text-slate-400 dark:text-slate-500" />
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name} seed={user?.avatarSeed} src={user?.avatar} size={64} />
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{user?.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-primary-700 dark:bg-slate-800 dark:text-primary-400">
              {user?.role} account
            </span>
          </div>
          <button
            type="button"
            onClick={() => toast.info('Avatar upload is coming soon')}
            className="btn-outline ml-auto"
          >
            <Icon name="camera" size={16} /> Change photo
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Profile details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="profile-name">Full name</label>
            <input id="profile-name" className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500" value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="label" htmlFor="profile-email">Email</label>
            <input id="profile-email" type="email" className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="label" htmlFor="profile-phone">Phone</label>
            <input id="profile-phone" className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500" value={form.phone} onChange={set('phone')} placeholder="+251 9..." />
          </div>
          <div>
            <label className="label" htmlFor="profile-city">City</label>
            <select id="profile-city" className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500" value={form.city} onChange={set('city')}>
              <option>Addis Ababa</option>
              <option>Adama</option>
              <option>Bahir Dar</option>
              <option>Dire Dawa</option>
              <option>Hawassa</option>
              <option>Mekelle</option>
              <option>Jimma</option>
            </select>
          </div>
        </div>
        {type === 'owner' && (
          <div>
            <label className="label" htmlFor="profile-bio">About you (shown to tenants)</label>
            <textarea id="profile-bio" className="input min-h-[90px] dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500" value={form.bio} onChange={set('bio')} placeholder="Tell tenants a bit about yourself" />
          </div>
        )}
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account</h3>
        <div className="mt-4 space-y-2">
          {row('Account type', user?.role === 'owner' ? 'Property owner' : 'Tenant', 'user-check')}
          {row('Member since', 'January 2024', 'calendar')}
          {row('Email verified', 'Yes', 'check-circle')}
          {row('Phone verified', 'Yes', 'phone')}
        </div>
        <button
          type="button"
          onClick={() => toast.info('Password change is coming soon')}
          className="btn-outline mt-4"
        >
          Change password
        </button>
      </div>
    </div>
  )
}
