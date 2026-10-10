import AdminLayout from '../../components/admin/AdminLayout'
import Icon from '../../components/ui/Icon'
import Avatar from '../../components/ui/Avatar'
import { useAuth } from '../../context/AuthContext'

const INFO = [
  {
    icon: 'key',
    title: 'Admin access',
    description:
      'Only users with the admin role can sign in to this panel. Non-admin users receive a 403 when calling admin APIs.',
  },
  {
    icon: 'shieldCheck',
    title: 'Property approval',
    description:
      'Properties submitted by owners stay hidden until an admin approves them. You can reject with a reason, and the owner is notified.',
  },
  {
    icon: 'user',
    title: 'Account status',
    description:
      'Deactivating a user blocks them from signing in immediately. The last active admin cannot be demoted or deactivated.',
  },
  {
    icon: 'info',
    title: 'Adding more admins',
    description:
      'From the server folder run: npm run create:admin. You can also promote a user from the Users page in this panel.',
  },
]

export default function AdminSettingsPage() {
  const { user } = useAuth()

  return (
    <AdminLayout title="Settings" subtitle="Admin panel information and maintenance.">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-900 lg:col-span-1">
          <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Signed in as</h3>
          <div className="flex items-center gap-3">
            <Avatar name={user?.name || 'Admin'} seed={user?.avatarSeed} src={user?.avatar} size={48} />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {INFO.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400">
                <Icon name={item.icon} size={20} />
              </div>
              <h3 className="mb-1 font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
