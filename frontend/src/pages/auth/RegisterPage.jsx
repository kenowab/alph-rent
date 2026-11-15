import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import Icon from '../../components/ui/Icon'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import GoogleButton from '../../components/auth/GoogleButton'

const ROLES = [
  { id: 'tenant', label: 'Tenant', icon: 'key', desc: 'Renting a property' },
  { id: 'owner', label: 'Property Owner', icon: 'building2', desc: 'Listing my property' },
]

const steps = ['Account', 'Review']

const PHONE_RE = /^\+?[0-9][0-9\s\-()]{5,}$/

const STRENGTHS = {
  weak: { label: 'Weak', bars: 1, bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
  medium: { label: 'Medium', bars: 2, bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  strong: { label: 'Strong', bars: 3, bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
}

function getPasswordStrength(password) {
  if (!password) return null
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  if (score <= 2) return STRENGTHS.weak
  if (score <= 4) return STRENGTHS.medium
  return STRENGTHS.strong
}

const inputClass = (hasError) =>
  `input pr-11 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 ${
    hasError ? 'border-red-400 focus:border-red-500 focus:ring-red-100 dark:border-red-600' : ''
  }`

const FieldError = ({ message }) =>
  message ? (
    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
      <Icon name="alert-triangle" size={13} className="shrink-0" />
      {message}
    </p>
  ) : null

export default function RegisterPage() {
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Public signup only allows Tenant and Owner. Any other value in the URL
  // (including 'admin') falls back to tenant so admin can never be selected.
  const urlRole = searchParams.get('role')
  const initialRole = urlRole === 'owner' ? 'owner' : urlRole === 'tenant' ? 'tenant' : 'tenant'

  const [step, setStep] = useState(0)
  const [role, setRole] = useState(initialRole)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [duplicateEmail, setDuplicateEmail] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [agreed, setAgreed] = useState(false)

  const strength = getPasswordStrength(form.password)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((current) => (current[key] ? { ...current, [key]: '' } : current))
    setError('')
    if (key === 'email') setDuplicateEmail(false)
  }

  const validate = () => {
    const next = {}
    if (!role) next.role = 'Please choose your account role'
    if (!form.name.trim()) next.name = 'Please enter your full name'
    else if (form.name.trim().length < 2) next.name = 'Name must be at least 2 characters'
    if (!form.email.trim()) next.email = 'Please enter your email address'
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) next.email = 'Please enter a valid email address'
    if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) next.phone = 'Please enter a valid phone number'
    if (!form.password) next.password = 'Please enter a password'
    else if (form.password.length < 6) next.password = 'Password must be at least 6 characters'
    if (!form.confirmPassword) next.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match'
    if (!agreed) next.agreed = 'Please accept the terms and conditions'
    return next
  }

  const nextStep = (e) => {
    e.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setError('Please fix the highlighted fields before continuing')
      return
    }
    setErrors({})
    setError('')
    setStep(1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setDuplicateEmail(false)
    try {
      const session = await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role,
      })
      toast.success('Account created — welcome to Alpha Rental Platform!')
      navigate(session.user.role === 'owner' ? '/dashboard/owner' : '/dashboard/tenant', { replace: true })
    } catch (err) {
      if (err.status === 409) {
        setDuplicateEmail(true)
        toast.info('This email is already registered. Please log in instead.')
        return
      }
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const roleLabel = ROLES.find((r) => r.id === role)?.label || 'Tenant'

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join Alpha Rental Platform in under a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
            Sign in
          </Link>
        </>
      }
    >
      <div className="mb-6 flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition ${
                i <= step ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              {i < step ? <Icon name="check" size={14} /> : i + 1}
            </span>
            <span className={`hidden text-xs font-semibold sm:block ${i <= step ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
              {label}
            </span>
            {i < steps.length - 1 && <span className={`h-0.5 flex-1 rounded ${i < step ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      {step === 0 ? (
        <form onSubmit={nextStep} noValidate className="space-y-5">
          <div>
            <span className="label">I am joining as a</span>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setRole(r.id)
                    setErrors((current) => (current.role ? { ...current, role: '' } : current))
                    setError('')
                  }}
                  className={`rounded-2xl border-2 p-4 text-left transition ${
                    role === r.id
                      ? 'border-primary-600 bg-primary-50 dark:border-primary-500 dark:bg-slate-800'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                  }`}
                  aria-pressed={role === r.id}
                >
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-xl ${
                      role === r.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <Icon name={r.icon} size={20} />
                  </span>
                  <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{r.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{r.desc}</p>
                </button>
              ))}
            </div>
            <FieldError message={errors.role} />
          </div>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">or</span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <GoogleButton role={role} label="Sign up with Google" />

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">or sign up with email</span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <div>
            <label className="label" htmlFor="reg-name">Full name</label>
            <input id="reg-name" className={inputClass(errors.name)} required value={form.name} onChange={set('name')} placeholder="e.g. Sara Bekele" autoComplete="name" />
            <FieldError message={errors.name} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="reg-email">Email address</label>
              <input id="reg-email" type="email" className={inputClass(errors.email)} required value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
              <FieldError message={errors.email} />
            </div>
            <div>
              <label className="label" htmlFor="reg-phone">Phone (optional)</label>
              <input id="reg-phone" type="tel" className={inputClass(errors.phone)} value={form.phone} onChange={set('phone')} placeholder="+251 9..." autoComplete="tel" />
              <FieldError message={errors.phone} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="reg-password">Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className={inputClass(errors.password)}
                  required
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
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
              {strength && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((bar) => (
                      <span
                        key={bar}
                        className={`h-1.5 flex-1 rounded-full transition ${
                          strength.bars >= bar ? strength.bar : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`mt-1 text-xs font-semibold ${strength.text}`}>Password strength: {strength.label}</p>
                </div>
              )}
              <FieldError message={errors.password} />
            </div>
            <div>
              <label className="label" htmlFor="reg-confirm">Confirm password</label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  className={inputClass(errors.confirmPassword)}
                  required
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  <Icon name={showConfirm ? 'eye-off' : 'eye'} size={18} />
                </button>
              </div>
              <FieldError message={errors.confirmPassword} />
            </div>
          </div>

          <div>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setErrors((current) => (current.agreed ? { ...current, agreed: '' } : current)) }} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800" />
              <span>
                I agree to the <span className="font-semibold text-primary-600">Terms of Service</span> and{' '}
                <span className="font-semibold text-primary-600">Privacy Policy</span>.
              </span>
            </label>
            <FieldError message={errors.agreed} />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-fade-in dark:border-red-900 dark:bg-red-950/80 dark:text-red-300">
              <Icon name="alert-triangle" size={17} className="shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full">
            Continue <Icon name="arrowRight" size={17} />
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Review your details</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Role</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">{roleLabel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Name</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">{form.name.trim()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Email</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">{form.email.trim()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Phone</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">{form.phone.trim() || 'Not provided'}</dd>
              </div>
            </dl>
          </div>

          {duplicateEmail && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 animate-fade-in dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
              <div className="flex items-start gap-2">
                <Icon name="info" size={17} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">This email is already registered. Please log in instead.</p>
                  <Link
                    to="/login"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700"
                  >
                    <Icon name="logout" size={15} />
                    Go to Login
                  </Link>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-fade-in dark:border-red-900 dark:bg-red-950/80 dark:text-red-300">
              <Icon name="alert-triangle" size={17} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(0)} className="btn-outline flex-1">
              Back
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <Spinner size={18} /> : <Icon name="check-circle" size={17} />}
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
