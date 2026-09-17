import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  getInventoryItemById,
  deleteInventoryItem,
  isBelowMinimum,
  getInventoryMovementsByItemId,
} from '../../services/inventoryService'
import { InventoryMovement } from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import InventoryExpirationBadge from '../../components/inventory/InventoryExpirationBadge'
import {
  Pencil,
  Trash2,
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  Eye,
} from 'lucide-react'

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

function getOriginLabel(movement: InventoryMovement): string {
  if (!movement.origin) return 'Manual'

  const { module, type } = movement.origin

  if (module === 'health' && type === 'vaccination') {
    return 'Baixa por vacinação'
  }

  if (module === 'health' && type === 'treatment') {
    return 'Baixa por tratamento'
  }

  if (module === 'crops' && type === 'crop-management') {
    return 'Baixa por manejo agrícola'
  }

  if (module === 'machines' && type === 'machine-maintenance') {
    return 'Baixa por manutenção de máquina'
  }

  return 'Origem desconhecida'
}

export default function InventoryItemDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const [feedback, setFeedback] = useState<FeedbackType>(null)

  const item = useMemo(
    () => (id ? getInventoryItemById(id) : undefined),
    [id]
  )

  const movements: InventoryMovement[] = useMemo(
    () => (id ? getInventoryMovementsByItemId(id) : []),
    [id]
  )

  useEffect(() => {
    const state = location.state as { successMessage?: string } | null
    if (!state?.successMessage) return

    setFeedback({ type: 'success', message: state.successMessage })
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 5000)
    return () => clearTimeout(timer)
  }, [feedback])

  if (!item) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Item de estoque não encontrado
        </p>

        <Button className="mt-4" onClick={() => navigate('/estoque')}>
          Voltar para estoque
        </Button>
      </div>
    )
  }

  const handleDelete = () => {
    if (window.confirm(`Excluir o item de estoque ${item.name}?`)) {
      try {
        const deleted = deleteInventoryItem(item.id)

        if (deleted) {
          navigate('/estoque', {
            state: { successMessage: 'Item de estoque excluído com sucesso.' },
          })
        } else {
          setFeedback({
            type: 'error',
            message: 'Item de estoque não encontrado.',
          })
        }
      } catch (error) {
        setFeedback({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao excluir item de estoque.',
        })
      }
    }
  }

  const formatQuantity = (value: number) =>
    value.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })

  const formatDate = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')

  return (
    <div className="space-y-6">
      {feedback && (
        <PageFeedback type={feedback.type} message={feedback.message} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/estoque')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para estoque
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{item.code}</h1>

            <HelpTip
              title="O que encontro nesta página?"
              description="Aqui você consulta os dados cadastrados deste item de estoque, seu saldo atual, validade e histórico de movimentações."
            />
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            {item.name}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/estoque/movimentacoes/nova?inventoryItemId=${item.id}&type=Entrada`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <ArrowDownCircle className="w-4 h-4 mr-2" />
            Registrar entrada
          </Link>

          <Link
            to={`/estoque/movimentacoes/nova?inventoryItemId=${item.id}&type=Saída`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <ArrowUpCircle className="w-4 h-4 mr-2" />
            Registrar saída
          </Link>

          <Button
            variant="outline"
            onClick={() => navigate(`/estoque/${item.id}/editar`)}
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
            <p className="text-sm text-gray-500 dark:text-gray-400">Código</p>
            <p className="font-medium">{item.code}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
            <p className="font-medium">{item.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Categoria
            </p>
            <p className="font-medium">{item.category}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Unidade
            </p>
            <p className="font-medium">{item.unit}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Quantidade atual
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {formatQuantity(item.currentQuantity)} {item.unit}
              </span>

              {isBelowMinimum(item) && (
                <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  Abaixo do mínimo
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Quantidade mínima
            </p>
            <p className="font-medium">
              {item.minimumQuantity !== undefined
                ? `${formatQuantity(item.minimumQuantity)} ${item.unit}`
                : 'Não informada'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Lote</p>
            <p className="font-medium">{item.batchNumber ?? 'Não informado'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Validade
            </p>

            {item.expirationDate ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">
                  {new Date(
                    item.expirationDate + 'T00:00:00'
                  ).toLocaleDateString('pt-BR')}
                </span>

                <InventoryExpirationBadge
                  expirationDate={item.expirationDate}
                />
              </div>
            ) : (
              <p className="font-medium">Não informada</p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Localização
            </p>
            <p className="font-medium">{item.location ?? 'Não informada'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Situação
            </p>
            <span
              className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                item.status === 'Ativo'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {item.status}
            </span>
          </div>
        </div>

        {item.description && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Descrição
            </p>
            <p className="mt-1">{item.description}</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data de cadastro
            </p>
            <p className="font-medium">
              {new Date(item.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização
            </p>
            <p className="font-medium">
              {new Date(item.updatedAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">Histórico de movimentações</h2>

            <HelpTip
              title="O que é este histórico?"
              description="Este histórico mostra as entradas e saídas que alteraram o saldo deste item ao longo do tempo."
            />
          </div>

          <Link
            to={`/estoque/movimentacoes?inventoryItemId=${item.id}`}
            className="inline-flex items-center text-sm text-green-600 hover:underline"
          >
            <ArrowRightLeft className="w-4 h-4 mr-1" />
            Ver movimentações
          </Link>
        </div>

        {movements.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhuma movimentação registrada para este item.
          </p>
        ) : (
          <div className="space-y-3">
            {movements.map(movement => (
              <button
                key={movement.id}
                onClick={() =>
                  navigate(`/estoque/movimentacoes/${movement.id}`)
                }
                className="block w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {formatDate(movement.movementDate)} · {movement.type}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Quantidade: {formatQuantity(movement.quantity)}{' '}
                      {item.unit}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Saldo após movimentação:{' '}
                      {formatQuantity(movement.balanceAfter)} {item.unit}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Motivo: {movement.reason}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Origem: {getOriginLabel(movement)}
                    </p>
                  </div>

                  <span className="inline-flex items-center text-xs text-green-600">
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}