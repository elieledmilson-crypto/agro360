import { Navigate, Outlet } from 'react-router-dom'
import { PermissionKey } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import {
  isAdmin,
  userHasPermission,
} from '../../services/permissionService'

type Props =
  | { permission: PermissionKey; adminOnly?: false }
  | { adminOnly: true; permission?: undefined }

export function PermissionRoute(props: Props) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (props.adminOnly) {
    if (!isAdmin(user)) {
      return <Navigate to="/acesso-negado" replace />
    }

    return <Outlet />
  }

  if (props.permission === undefined) {
    return <Navigate to="/acesso-negado" replace />
  }

  if (!userHasPermission(user, props.permission)) {
    return <Navigate to="/acesso-negado" replace />
  }

  return <Outlet />
}