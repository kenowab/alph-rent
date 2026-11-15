import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'

const HIGHLIGHTS = [
  { icon: 'building', text: 'Thousands of verified listings' },
  { icon: 'shield-check', text: 'Safe and secure transactions' },
  { icon: 'users', text: 'Direct contact with owners' },
  { icon: 'bolt', text: 'Instant rental requests' },
]

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 lg:block">
        <span className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              <Icon name="bolt" size={14} className="text-brand-400" />
              Alpha Rental Platform
            </span>
            <h2 className="mt-8 text-3xl font-extrabold leading-tight text-white">
              Your next home is one search away.
            </h2>
            <p className="mt-3 max-w-sm text-white/70">
              Join thousands of tenants and property owners across Ethiopia renting smarter.
            </p>
          </div>

          <div className="space-y-4">
            {HIGHLIGHTS.map((h, i) => (
              <div key={h.text} className="flex items-center gap-3 text-white/85 animate-fade-in-up" style={{ animationDelay: `${i * 90}ms` }}>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 backdrop-blur-sm">
                  <Icon name={h.icon} size={20} className="text-brand-400" />
                </span>
                <span className="text-sm font-medium">{h.text}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-white/50">© {new Date().getFullYear()} Alpha Rental Platform</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-8 dark:bg-slate-950">
        <div className="w-full max-w-md animate-fade-in">
          <Link to="/" className="mb-8 inline-block text-sm font-semibold text-slate-500 transition hover:text-primary-600 dark:text-slate-400">
            ← Back to home
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
