import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import Icon from '../../components/ui/Icon'
import Spinner from '../../components/ui/Spinner'
import { requestPasswordReset } from '../../api/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    try {
      const result = await requestPasswordReset(email.trim())
      setMessage(result.message)
    } catch (requestError) {
      setError(requestError.message || 'Could not request a password reset. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your account email and we’ll send a reset link if email delivery is available.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label" htmlFor="reset-email">Email address</label>
          <input
            id="reset-email"
            type="email"
            required
            autoComplete="email"
            className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>
        {message && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">{message}</p>}
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner size={18} /> : <Icon name="mail" size={17} />}
          {loading ? 'Requesting reset…' : 'Send reset link'}
        </button>
      </form>
      <p className="mt-5 text-center text-sm">
        <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">Back to sign in</Link>
      </p>
    </AuthLayout>
  )
}
