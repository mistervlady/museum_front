import { Navigate } from 'react-router-dom'
import Spinner from '@/components/ui/Spinner'
import { useAuth } from './AuthProvider'
import { VALID_STAFF_ROLES, type ValidStaffRole } from './constants'

interface StaffAdminRouteProps {
  children: JSX.Element
}

/**
 * Type guard to check if a value is a valid staff role
 */
function isValidStaffRole(role: string | undefined): role is ValidStaffRole {
  if (!role) return false
  return VALID_STAFF_ROLES.includes(role.toLowerCase() as ValidStaffRole)
}

/**
 * Route guard that ensures only authenticated staff members can access admin pages.
 * Staff members include users with valid staff roles defined in VALID_STAFF_ROLES.
 */
export default function StaffAdminRoute({ children }: StaffAdminRouteProps) {
  const { loading, isAuthenticated, user } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/staff/login" replace />
  }

  // Check if user has a valid staff role
  if (!isValidStaffRole(user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-museum-950">
        <div className="text-center text-museum-300 px-4">
          <h1 className="text-2xl font-bold mb-2 text-red-400">Доступ запрещён</h1>
          <p>Администрирование доступно только сотрудникам музея.</p>
        </div>
      </div>
    )
  }

  return children
}
