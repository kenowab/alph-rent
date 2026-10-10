import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import Spinner from '../../components/ui/Spinner'
import Icon from '../../components/ui/Icon'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function GoogleCallbackPage() {
  const { loginWithGoogle } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(true)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) {
      setError('Google sign-in failed — no session token was returned.')
      setVerifying(false)
      return
    }

    loginWithGoogle(token)
      .then((session) => {
        toast.success(`Welcome, ${session.user.name.split(' ')[0]}!`)
        navigate(session.user.role === 'owner' ? '/dashboard/owner' : '/properties', { replace: true })
      })
      .catch((err) => {
        setError(err.message || 'Could not finish Google sign-in.')
        setVerifying(false)
      })
  }, [loginWithGoogle, navigate, toast])

  return (
    <AuthLayout title={verifying ? 'Completing sign-in' : 'Sign-in failed'} subtitle={verifying ? 'Verifying your Google account…' : 'Something went wrong while signing you in.'}>
      {verifying ? (
        <div className="flex justify-center py-10">
          <Spinner size={36} />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-fade-in dark:border-red-900 dark:bg-red-950/80 dark:text-red-300">
            <Icon name="alert-triangle" size={17} className="shrink-0" />
            {error}
          </div>
          <Link to="/login" className="btn-primary w-full">
            Back to sign in
          </Link>
        </div>
      )}
    </AuthLayout>
  )
}
