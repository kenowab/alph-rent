import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import HomePage from './pages/HomePage'
import ListingPage from './pages/ListingPage'
import PropertyDetailsPage from './pages/PropertyDetailsPage'
import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import RegisterPage from './pages/auth/RegisterPage'
import RoleSelectPage from './pages/auth/RoleSelectPage'
import GoogleCallbackPage from './pages/auth/GoogleCallbackPage'
import TenantDashboardPage from './pages/dashboard/TenantDashboardPage'
import OwnerDashboardPage from './pages/dashboard/OwnerDashboardPage'
import AddPropertyPage from './pages/dashboard/AddPropertyPage'
import NotFoundPage from './pages/NotFoundPage'
import { useAuth } from './context/AuthContext'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminOwnersPage from './pages/admin/AdminOwnersPage'
import AdminTenantsPage from './pages/admin/AdminTenantsPage'
import AdminPropertiesPage from './pages/admin/AdminPropertiesPage'
import AdminApprovalsPage from './pages/admin/AdminApprovalsPage'
import AdminRentalRequestsPage from './pages/admin/AdminRentalRequestsPage'
import AdminAgreementsPage from './pages/admin/AdminAgreementsPage'
import AdminRentalExpirationsPage from './pages/admin/AdminRentalExpirationsPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'

function RoleDashboardRedirect() {
  const { user } = useAuth()
  const fallback =
    user?.role === 'admin'
      ? '/admin/dashboard'
      : user?.role === 'owner'
        ? '/dashboard/owner'
        : '/dashboard/tenant'
  return <Navigate to={fallback} replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/properties" element={<ListingPage />} />
        <Route path="/properties/:id" element={<PropertyDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/role" element={<RoleSelectPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RoleDashboardRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tenant"
          element={
            <ProtectedRoute role="tenant">
              <TenantDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/owner"
          element={
            <ProtectedRoute role="owner">
              <OwnerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/owner/add-property"
          element={
            <ProtectedRoute role="owner">
              <AddPropertyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/owner/edit-property/:id"
          element={
            <ProtectedRoute role="owner">
              <AddPropertyPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <Navigate to="/admin/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute role="admin">
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/owners"
        element={
          <ProtectedRoute role="admin">
            <AdminOwnersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tenants"
        element={
          <ProtectedRoute role="admin">
            <AdminTenantsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/properties"
        element={
          <ProtectedRoute role="admin">
            <AdminPropertiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/approvals"
        element={
          <ProtectedRoute role="admin">
            <AdminApprovalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/rental-requests"
        element={
          <ProtectedRoute role="admin">
            <AdminRentalRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/agreements"
        element={
          <ProtectedRoute role="admin">
            <AdminAgreementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/expirations"
        element={
          <ProtectedRoute role="admin">
            <AdminRentalExpirationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute role="admin">
            <AdminReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute role="admin">
            <AdminSettingsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
