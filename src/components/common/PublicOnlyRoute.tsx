import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'

export function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

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