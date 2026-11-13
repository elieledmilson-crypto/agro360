import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  MapPin,
  Sprout,
  PawPrint,
  HeartPulse,
  LandPlot,
  Tractor,
  Package,
  CircleDollarSign,
  Users,
  CalendarDays,
  BarChart3,
  Map as MapIcon,
  BrainCircuit,
  Settings,
} from 'lucide-react'
import { PermissionKey, User } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import {
  isAdmin,
  userHasPermission,
} from '../../services/permissionService'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  permission?: PermissionKey
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/inteligencia',
    label: 'Agro360 Intelligence',
    icon: BrainCircuit,
    permission: 'intelligence',
  },
  {
    to: '/agenda',
    label: 'Agenda',
    icon: CalendarDays,
    permission: 'agenda',
  },
  {
    to: '/animais',
    label: 'Animais',
    icon: PawPrint,
    permission: 'animals',
  },
  {
    to: '/saude-animal',
    label: 'Saúde Animal',
    icon: HeartPulse,
    permission: 'health',
  },
  {
    to: '/terras',
    label: 'Terras',
    icon: LandPlot,
    permission: 'land',
  },
  {
    to: '/cultivos',
    label: 'Cultivos',
    icon: Sprout,
    permission: 'crops',
  },
  {
    to: '/maquinas',
    label: 'Máquinas',
    icon: Tractor,
    permission: 'machines',
  },
  {
    to: '/estoque',
    label: 'Estoque',
    icon: Package,
    permission: 'inventory',
  },
  {
    to: '/financeiro',
    label: 'Financeiro',
    icon: CircleDollarSign,
    permission: 'finance',
  },
  {
    to: '/relatorios',
    label: 'Relatórios',
    icon: BarChart3,
    permission: 'reports',
  },
  {
    to: '/funcionarios',
    label: 'Funcionários',
    icon: Users,
    adminOnly: true,
  },
  {
    to: '/perfil',
    label: 'Meu perfil',
    icon: Settings,
  },
  {
    to: '/propriedade',
    label: 'Propriedade',
    icon: MapPin,
    permission: 'property',
  },
  {
    to: '/mapa',
    label: 'Mapa',
    icon: MapIcon,
    permission: 'map',
  },
]

function canSeeItem(user: User | null, item: NavItem): boolean {
  if (!user) return false

  if (item.adminOnly) {
    return isAdmin(user)
  }

  if (!item.permission) {
    return true
  }

  return userHasPermission(user, item.permission)
}

export default function Sidebar() {
  const { user } = useAuth()

  const visibleItems = navItems.filter(item =>
    canSeeItem(user, item),
  )

  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30">
      <div className="flex items-center gap-2 h-16 px-6 border-b border-gray-200 dark:border-gray-800">
        <Sprout className="w-8 h-8 text-green-600" />

        <span className="text-xl font-bold">
          Agro360
        </span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {visibleItems.map(item => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({
                isActive,
              }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                  isActive
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
        Agro360 v0.1.0
      </div>
    </aside>
  )
}
