import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import Icon from '../../components/ui/Icon'
import Spinner from '../../components/ui/Spinner'
import { resetPassword } from '../../api/auth'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (!token) {
      setError('This reset link is invalid. Request a new password reset link.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const result = await resetPassword({ token, password })
      navigate('/login', { replace: true, state: { passwordResetMessage: result.message } })
    } catch (requestError) {
      setError(requestError.message || 'Could not reset your password. Request a new link and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Reset links expire after 15 minutes and can only be used once.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label" htmlFor="new-password">New password</label>
          <input id="new-password" type="password" required minLength={6} autoComplete="new-password" className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="confirm-new-password">Confirm new password</label>
          <input id="confirm-new-password" type="password" required minLength={6} autoComplete="new-password" className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        </div>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner size={18} /> : <Icon name="key" size={17} />}
          {loading ? 'Updating password…' : 'Update password'}
        </button>
      </form>
      <p className="mt-5 text-center text-sm">
        <Link to="/forgot-password" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">Request another reset link</Link>
      </p>
    </AuthLayout>
  )
}
