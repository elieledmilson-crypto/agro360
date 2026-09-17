import { PermissionKey, User } from '../types'

export interface PermissionOption {
  key: PermissionKey
  label: string
}

export const PERMISSION_OPTIONS: PermissionOption[] = [
  { key: 'animals', label: 'Animais' },
  { key: 'health', label: 'Saúde Animal' },
  { key: 'land', label: 'Terras' },
  { key: 'crops', label: 'Cultivos' },
  { key: 'machines', label: 'Máquinas' },
  { key: 'inventory', label: 'Estoque' },
  { key: 'finance', label: 'Financeiro' },
  { key: 'property', label: 'Propriedade' },
  { key: 'agenda', label: 'Agenda e alertas' },
  { key: 'reports', label: 'Relatórios' },
  { key: 'map', label: 'Mapa' },
  { key: 'intelligence', label: 'Agro360 Intelligence' },
]

export const VALID_PERMISSION_KEYS: PermissionKey[] =
  PERMISSION_OPTIONS.map(option => option.key)

export function isPermissionKey(value: unknown): value is PermissionKey {
  return (
    typeof value === 'string' &&
    VALID_PERMISSION_KEYS.includes(value as PermissionKey)
  )
}

export function getPermissionLabel(permission: PermissionKey): string {
  const option = PERMISSION_OPTIONS.find(item => item.key === permission)
  return option?.label ?? permission
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin'
}

export function userHasPermission(
  user: User | null,
  permission: PermissionKey,
): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  return (user.permissions ?? []).includes(permission)
}

export function requirePermissions(
  user: User | null,
  permissions: PermissionKey[],
): void {
  for (const permission of permissions) {
    if (!userHasPermission(user, permission)) {
      throw new Error(
        `Permissão necessária: ${getPermissionLabel(permission)}.`,
      )
    }
  }
}

export function requireAnyPermission(
  user: User | null,
  permissions: PermissionKey[],
): void {
  if (permissions.length === 0) return

  const has = permissions.some(permission =>
    userHasPermission(user, permission),
  )

  if (!has) {
    const labels = permissions
      .map(permission => getPermissionLabel(permission))
      .join(' ou ')

    throw new Error(`Permissão necessária: ${labels}.`)
  }
}