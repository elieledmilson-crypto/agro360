import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import HelpTip from '../../components/ui/HelpTip'
import HealthSummaryCards from '../../components/health/HealthSummaryCards'
import {
  Syringe,
  Activity,
  ClipboardList,
  Plus,
  ArrowRight,
} from 'lucide-react'

export default function HealthPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Saúde Animal</h1>

          <HelpTip
            title="Para que serve Saúde Animal?"
            description="Aqui você acompanha vacinas, tratamentos e ocorrências de saúde dos animais, mantendo o histórico sanitário organizado."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Acompanhe vacinações, tratamentos e ocorrências
        </p>
      </div>

      <HealthSummaryCards />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Syringe className="w-6 h-6 text-blue-600" />
            <h2 className="font-semibold">Vacinações</h2>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Registre vacinas aplicadas e acompanhe próximas doses.
          </p>

          <div className="flex flex-col gap-2">
            <Link to="/saude-animal/vacinacoes/nova">
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2 inline" />
                Registrar vacinação
              </Button>
            </Link>

            <Link
              to="/saude-animal/vacinacoes"
              className="text-sm text-green-600 hover:underline flex items-center gap-1"
            >
              Ver vacinações <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-emerald-600" />
            <h2 className="font-semibold">Tratamentos</h2>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Gerencie tratamentos em andamento e concluídos.
          </p>

          <div className="flex flex-col gap-2">
            <Link to="/saude-animal/tratamentos/novo">
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2 inline" />
                Novo tratamento
              </Button>
            </Link>

            <Link
              to="/saude-animal/tratamentos"
              className="text-sm text-green-600 hover:underline flex items-center gap-1"
            >
              Ver tratamentos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <ClipboardList className="w-6 h-6 text-purple-600" />
            <h2 className="font-semibold">Ocorrências</h2>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Registre eventos clínicos e observações de saúde.
          </p>

          <div className="flex flex-col gap-2">
            <Link to="/saude-animal/ocorrencias/nova">
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2 inline" />
                Registrar ocorrência
              </Button>
            </Link>

            <Link
              to="/saude-animal/ocorrencias"
              className="text-sm text-green-600 hover:underline flex items-center gap-1"
            >
              Ver ocorrências <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}