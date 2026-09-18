import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function PropertyReadyRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600 dark:text-gray-300">
        Carregando propriedade...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!user.propertyId) {
    return <Navigate to="/configuracao-inicial" replace />
  }

  return <Outlet />
}
