import { Farm, DashboardStats, Activity } from '../types'

export const mockFarm: Farm = {
  id: '1',
  name: 'Fazenda Santa Luzia',
  location: 'Uberlândia - MG',
  totalArea: 450,
  owner: 'João da Silva',
}

export const mockStats: DashboardStats = {
  animalsCount: 128,
  pendingVaccines: 7,
  areasCount: 12,
  activeCultivations: 4,
  upcomingActivities: 9,
}

export const mockActivities: Activity[] = [
  {
    id: '1',
    title: 'Vacinação contra febre aftosa',
    date: '2025-02-10',
    type: 'vaccine',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Plantio de milho no talhão 3',
    date: '2025-02-15',
    type: 'planting',
    status: 'pending',
  },
  {
    id: '3',
    title: 'Manutenção do trator John Deere',
    date: '2025-02-05',
    type: 'maintenance',
    status: 'overdue',
  },
  {
    id: '4',
    title: 'Colheita de soja - talhão 1',
    date: '2025-02-20',
    type: 'harvest',
    status: 'pending',
  },
]