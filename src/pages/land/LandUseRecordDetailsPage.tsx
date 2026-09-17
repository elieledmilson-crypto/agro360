import { useState, useEffect } from 'react'
import {
  useParams,
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom'
import { getLandUseRecordById } from '../../services/landUseService'
import { getLandAreaById } from '../../services/landService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import { Pencil, ArrowLeft } from 'lucide-react'

export default function LandUseRecordDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [successMessage, setSuccessMessage] = useState<string | null>(
    null
  )

  const record = id
    ? getLandUseRecordById(id)
    : undefined

  const area = record
    ? getLandAreaById(record.landAreaId)
    : undefined

  useEffect(() => {
    const state = location.state as {
      successMessage?: string
    } | null

    if (!state?.successMessage) return

    setSuccessMessage(state.successMessage)

    navigate(location.pathname, {
      replace: true,
      state: null,
    })
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    if (!successMessage) return

    const timer = setTimeout(
      () => setSuccessMessage(null),
      5000
    )

    return () => clearTimeout(timer)
  }, [successMessage])

  if (!record) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Registro de utilização não encontrado
        </p>

        <Button
          className="mt-4"
          onClick={() =>
            navigate('/terras/historico')
          }
        >
          Voltar para histórico
        </Button>
      </div>
    )
  }

  const formatDate = (date?: string) => {
    if (!date) return 'Não informada'

    return new Date(
      date + 'T00:00:00'
    ).toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <PageFeedback
          type="success"
          message={successMessage}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() =>
              navigate('/terras/historico')
            }
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para histórico
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Registro de utilização
            </h1>

            <HelpTip
              title="O que encontro nesta página?"
              description="Aqui você consulta os dados deste registro de utilização, com área, tipo, período e observações."
            />
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            {record.type}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() =>
            navigate(
              `/terras/historico/${record.id}/editar`
            )
          }
        >
          <Pencil className="w-4 h-4 mr-2 inline" />
          Editar
        </Button>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Área
            </p>

            {area ? (
              <Link
                to={`/terras/${area.id}`}
                className="font-medium text-green-600 hover:underline"
              >
                {area.code} — {area.name}
              </Link>
            ) : (
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Área não encontrada
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tipo de utilização
            </p>
            <p className="font-medium">
              {record.type}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data de início
            </p>
            <p className="font-medium">
              {formatDate(record.startDate)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data de término
            </p>
            <p className="font-medium">
              {formatDate(record.endDate)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Situação
            </p>

            {record.endDate ? (
              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                Finalizado
              </span>
            ) : (
              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                Em andamento
              </span>
            )}
          </div>
        </div>

        {record.description && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Descrição
            </p>
            <p className="mt-1">
              {record.description}
            </p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data de cadastro
            </p>
            <p className="font-medium">
              {new Date(
                record.createdAt
              ).toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização
            </p>
            <p className="font-medium">
              {new Date(
                record.updatedAt
              ).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}