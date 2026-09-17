import { Link } from 'react-router-dom'
import { mockFarm } from '../data/mockData'
import Card from '../components/ui/Card'
import HelpTip from '../components/ui/HelpTip'
import { MapPin, User, Ruler, Map as MapIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { userHasPermission } from '../services/permissionService'

export default function Property() {
  const { user } = useAuth()
  const canSeeMap = userHasPermission(user, 'map')

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Propriedade</h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Aqui ficam as informações gerais da propriedade rural utilizada no Agro360."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Informações da sua fazenda
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50">
              <MapPin className="w-6 h-6 text-green-700 dark:text-green-300" />
            </div>

            <div>
              <h2 className="font-semibold text-lg">{mockFarm.name}</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {mockFarm.location}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <User className="w-6 h-6 text-blue-700 dark:text-blue-300" />
            </div>

            <div>
              <h2 className="font-semibold text-lg">{mockFarm.owner}</h2>
              <p className="text-gray-600 dark:text-gray-400">Proprietário</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/50">
              <Ruler className="w-6 h-6 text-amber-700 dark:text-amber-300" />
            </div>

            <div>
              <h2 className="font-semibold text-lg">
                {mockFarm.totalArea} ha
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Área total</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Visão geral da estrutura</h2>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Acesse o mapa da propriedade para visualizar as áreas de forma
          integrada e, quando houver conexão com a internet, acompanhar a
          visão de satélite e as condições meteorológicas da região.
        </p>

        {canSeeMap ? (
          <Link
            to="/mapa"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
          >
            <MapIcon className="w-4 h-4 mr-2" />
            Abrir mapa da propriedade
          </Link>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Você não possui permissão para acessar o mapa da propriedade.
          </p>
        )}
      </Card>
    </div>
  )
}