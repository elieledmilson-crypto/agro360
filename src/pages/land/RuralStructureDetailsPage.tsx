import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  getRuralStructureById,
  deleteRuralStructure,
  getLandAreasForStructure,
} from '../../services/ruralStructureService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import { Pencil, Trash2, ArrowLeft } from 'lucide-react'

export default function RuralStructureDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [deleteError, setDeleteError] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(
    null
  )

  const structure = id
    ? getRuralStructureById(id)
    : undefined

  const linkedAreas = structure
    ? getLandAreasForStructure(structure)
    : []

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

  if (!structure) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Estrutura não encontrada
        </p>

        <Button
          className="mt-4"
          onClick={() => navigate('/terras/estruturas')}
        >
          Voltar para estruturas
        </Button>
      </div>
    )
  }

  const handleDelete = () => {
    if (window.confirm(`Excluir a estrutura ${structure.code}?`)) {
      try {
        deleteRuralStructure(structure.id)
        navigate('/terras/estruturas')
      } catch (error) {
        setDeleteError(
          error instanceof Error
            ? error.message
            : 'Erro ao excluir estrutura.'
        )
      }
    }
  }

  const statusClass =
    structure.status === 'Em uso'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
      : structure.status === 'Em manutenção'
        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'

  const conditionClass =
    structure.condition === 'Boa'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
      : structure.condition === 'Regular'
        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'

  return (
    <div className="space-y-6">
      {successMessage && (
        <PageFeedback
          type="success"
          message={successMessage}
        />
      )}

      {deleteError && (
        <PageFeedback
          type="error"
          message={deleteError}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/terras/estruturas')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para estruturas
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              {structure.code}
            </h1>

            <HelpTip
              title="O que encontro nesta página?"
              description="Aqui você consulta os dados desta estrutura e as áreas vinculadas a ela."
            />
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            {structure.name}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              navigate(
                `/terras/estruturas/${structure.id}/editar`
              )
            }
          >
            <Pencil className="w-4 h-4 mr-2 inline" />
            Editar
          </Button>

          <Button
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2 inline" />
            Excluir
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Código
            </p>
            <p className="font-medium">{structure.code}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nome
            </p>
            <p className="font-medium">{structure.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tipo
            </p>
            <p className="font-medium">{structure.type}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Situação
            </p>

            <span
              className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}
            >
              {structure.status}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Conservação
            </p>

            <span
              className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${conditionClass}`}
            >
              {structure.condition}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Comprimento
            </p>
            <p className="font-medium">
              {structure.lengthMeters
                ? `${structure.lengthMeters} m`
                : 'Não informado'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Largura
            </p>
            <p className="font-medium">
              {structure.widthMeters
                ? `${structure.widthMeters} m`
                : 'Não informada'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data de cadastro
            </p>
            <p className="font-medium">
              {new Date(
                structure.createdAt
              ).toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização
            </p>
            <p className="font-medium">
              {new Date(
                structure.updatedAt
              ).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {structure.description && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Descrição
            </p>
            <p className="mt-1">{structure.description}</p>
          </div>
        )}

        <div className="mt-6">
          <p className="text-sm font-medium mb-2">
            Áreas vinculadas
          </p>

          {linkedAreas.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhuma área vinculada.
            </p>
          ) : (
            <div className="space-y-2">
              {linkedAreas.map(area => (
                <button
                  key={area.id}
                  onClick={() => navigate(`/terras/${area.id}`)}
                  className="block w-full text-left p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  {area.code} — {area.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}