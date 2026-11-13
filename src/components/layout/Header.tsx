import { Link, useLocation } from 'react-router-dom'

import {
  Bell,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
} from 'lucide-react'

import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import {
  userHasPermission,
} from '../../services/permissionService'
import { getAlertCountForUser } from '../../services/alertService'

export default function Header({
  onMenuClick,
}: {
  onMenuClick: () => void
}) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const showAlerts = userHasPermission(user, 'agenda')

  const alertCount = showAlerts
    ? getAlertCountForUser(user)
    : 0

  const alertBadgeText =
    alertCount > 99 ? '99+' : String(alertCount)

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Abrir menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      <h1 className="hidden lg:block text-lg font-semibold">
        Gestão Rural
      </h1>

      <div className="flex items-center gap-2">
        {showAlerts && (
          <Link
            to="/alertas"
            aria-current={
              location.pathname === '/alertas'
                ? 'page'
                : undefined
            }
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={`Alertas (${alertCount})`}
            title={`Alertas (${alertCount})`}
          >
            <Bell className="w-5 h-5" />

            {alertCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold leading-none shadow-sm"
                aria-hidden="true"
              >
                {alertBadgeText}
              </span>
            )}
          </Link>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Alternar tema"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>

        <Link
          to="/perfil"
          className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-lg border-l border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-current={
            location.pathname === '/perfil'
              ? 'page'
              : undefined
          }
          title="Meu perfil"
        >
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <User className="w-4 h-4 text-green-700 dark:text-green-300" />
          </div>

          <span className="hidden md:block text-sm font-medium">
            {user?.name}
          </span>
        </Link>

        <button
          onClick={logout}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600"
          aria-label="Sair"
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
