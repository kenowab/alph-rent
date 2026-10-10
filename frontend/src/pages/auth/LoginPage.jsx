import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import Icon from '../../components/ui/Icon'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import GoogleButton from '../../components/auth/GoogleButton'

const ROLES = [
  { id: 'tenant', label: 'Tenant', icon: 'key' },
  { id: 'owner', label: 'Owner', icon: 'building2' },
  { id: 'admin', label: 'Admin', icon: 'shield-check' },
]

const SUBTITLES = {
  tenant: 'Sign in to manage your rental activity and saved properties.',
  owner: 'Sign in to manage your listings, requests and messages.',
  admin: 'Restricted access — authorized Alpha Rent administrators only.',
}

export default function LoginPage() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [role, setRole] = useState('tenant')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')

  const isAdmin = role === 'admin'

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError('')
  }

  const selectRole = (next) => {
    setRole(next)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // The backend decides the real role from the database — the selected tab
      // below is only a UI hint and is never sent to the API.
      const session = await login(form)
      const requested = location.state?.from
      const roleHome =
        session.user.role === 'owner'
          ? '/dashboard/owner'
          : session.user.role === 'admin'
            ? '/admin/dashboard'
            : '/dashboard/tenant'
      const destination =
        requested && requested.startsWith('/admin') === (session.user.role === 'admin')
          ? requested
          : roleHome
      toast.success(`Welcome back, ${session.user.name.split(' ')[0]}!`)
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={isAdmin ? 'Admin Login' : 'Welcome back'}
      subtitle={SUBTITLES[role]}
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register/role" className="font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
            Create one free
          </Link>
        </>
      }
    >
      <div className="mb-6 grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
        {ROLES.map((r) => {
          const active = role === r.id
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => selectRole(r.id)}
              aria-pressed={active}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-sm font-bold transition ${
                active
                  ? 'bg-white text-primary-700 shadow-sm dark:bg-slate-700 dark:text-primary-300'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon name={r.icon} size={16} />
              {r.label}
            </button>
          )
        })}
      </div>

      {isAdmin && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800 dark:border-primary-900 dark:bg-primary-950/40 dark:text-primary-300">
          <Icon name="shield-check" size={17} className="mt-0.5 shrink-0" />
          <span>
            Admin access is verified on the server. Only an account with the <b>admin</b> role can
            sign in here.
          </span>
        </div>
      )}

      {!isAdmin && (
        <>
          <GoogleButton role={role} />

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">or sign in with email</span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label" htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            required
            className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
            value={form.email}
            onChange={set('email')}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="login-password">Password</label>
            <button type="button" className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              className="input pr-11 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-fade-in dark:border-red-900 dark:bg-red-950/80 dark:text-red-300">
            <Icon name="alert-triangle" size={17} className="shrink-0" />
            {error}
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800" />
          Keep me signed in
        </label>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner size={18} /> : <Icon name={isAdmin ? 'shield-check' : 'logout'} size={17} />}
          {loading ? 'Signing in...' : isAdmin ? 'Admin Login' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  )
}
