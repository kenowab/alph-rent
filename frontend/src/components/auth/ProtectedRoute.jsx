import { Navigate, useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../ui/Spinner'

export default function ProtectedRoute({ children, role }) {
  const { user, isAuthenticated, sessionReady } = useAuth()
  const location = useLocation()

  if (!sessionReady) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-slate-400">
        <Spinner size={32} label="Loading your session..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (role && user.role !== role) {
    const fallback =
      user.role === 'admin' ? '/admin/dashboard' : user.role === 'owner' ? '/dashboard/owner' : '/dashboard/tenant'
    return <Navigate to={fallback} replace />
  }

  return children
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  role: PropTypes.oneOf(['tenant', 'owner', 'admin']),
}
