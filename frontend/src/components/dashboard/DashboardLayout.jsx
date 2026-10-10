import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'

export default function DashboardLayout({ role, tabs, activeTab, onChangeTab, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-800 p-5">
        <Avatar name={user?.name} seed={user?.avatarSeed} src={user?.avatar} size={44} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{user?.name}</p>
          <span className="inline-block rounded-full bg-primary-600/60 px-2 py-0.5 text-[11px] font-semibold capitalize text-primary-100">
            {role} account
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onChangeTab(tab.id)
                setSidebarOpen(false)
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon name={tab.icon} size={18} />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-auto grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-slate-800 p-3">
        {role === 'owner' && (
          <Link
            to="/dashboard/owner/add-property"
            className="flex items-center gap-3 rounded-xl bg-brand-400 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-brand-300"
          >
            <Icon name="plus" size={18} />
            Post new property
          </Link>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <Icon name="logout" size={18} />
          Sign out
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
              aria-label="Open dashboard menu"
            >
              <Icon name="menu" size={18} />
              Menu
            </button>
            <p className="text-sm font-bold capitalize text-slate-700 dark:text-slate-200">
              {tabs.find((t) => t.id === activeTab)?.label}
            </p>
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
              aria-label="Close dashboard menu"
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
