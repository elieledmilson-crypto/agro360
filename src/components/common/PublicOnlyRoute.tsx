import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600 dark:text-gray-300">
        Carregando sessão...
      </div>
    )
  }

  if (isAuthenticated) {
    const from =
      location.state?.from?.pathname ||
      '/dashboard'

    return (
      <Navigate
        to={from}
        replace
      />
    )
  }

  return <Outlet />
}
