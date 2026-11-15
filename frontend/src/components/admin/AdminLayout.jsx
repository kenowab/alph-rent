import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'grid' },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/owners', label: 'Owners', icon: 'user-check' },
  { to: '/admin/tenants', label: 'Tenants', icon: 'user' },
  { to: '/admin/properties', label: 'Properties', icon: 'building' },
  { to: '/admin/approvals', label: 'Property Approvals', icon: 'check-circle' },
  { to: '/admin/rental-requests', label: 'Rental Requests', icon: 'calendar' },
  { to: '/admin/agreements', label: 'Rental Agreements', icon: 'key' },
  { to: '/admin/expirations', label: 'Rental Expiration Management', icon: 'clock' },
  { to: '/admin/reports', label: 'Reports', icon: 'file-text' },
  { to: '/admin/settings', label: 'Settings', icon: 'settings' },
]

export default function AdminLayout({ title, subtitle, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
      isActive
        ? 'bg-primary-600 text-white shadow-md'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-800 p-5">
        <Avatar name={user?.name} seed={user?.avatarSeed} src={user?.avatar} size={44} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{user?.name}</p>
          <span className="inline-block rounded-full bg-violet-600/70 px-2 py-0.5 text-[11px] font-semibold capitalize text-violet-100">
            Administrator
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin/dashboard'}
            onClick={() => setSidebarOpen(false)}
            className={linkClass}
          >
            <Icon name={item.icon} size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-slate-800 p-3">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          <Icon name="home" size={18} />
          View public site
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <Icon name="logout" size={18} />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="container-page py-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 overflow-hidden rounded-2xl bg-slate-900 shadow-card">
            {SidebarContent}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="btn-outline"
              aria-label="Open admin menu"
            >
              <Icon name="menu" size={18} />
              Menu
            </button>
            <p className="text-sm font-bold capitalize text-slate-700 dark:text-slate-200">{title}</p>
          </div>
          <div className="mb-6 hidden lg:block">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] bg-slate-900 shadow-2xl animate-slide-in-right">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Close admin menu"
            >
              <Icon name="x" size={20} />
            </button>
            {SidebarContent}
          </div>
        </div>
      )}
    </div>
  )
}
