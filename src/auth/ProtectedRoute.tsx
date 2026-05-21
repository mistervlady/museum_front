import { Navigate } from 'react-router-dom'
import Spinner from '@/components/ui/Spinner'
import { useAuth } from './AuthProvider'

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { loading, isAuthenticated } = useAuth()

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

  return children
}
