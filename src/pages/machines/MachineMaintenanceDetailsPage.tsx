import {
  useState,
  useEffect,
  useMemo,
} from 'react'
import {
  useParams,
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom'
import {
  getMachineMaintenanceRecordById,
  deleteMachineMaintenanceRecord,
} from '../../services/machineMaintenanceService'
import { getMachineById } from '../../services/machineService'
import {
  getInventoryMovementsByOrigin,
  getInventoryItemById,
} from '../../services/inventoryService'
import {
  getFinancialTransactionsByOrigin,
  getFinancialCategoryById,
} from '../../services/financeService'
import { useAuth } from '../../hooks/useAuth'
import { userHasPermission } from '../../services/permissionService'
import {
  InventoryMovement,
  FinancialTransaction,
} from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import {
  Pencil,
  Trash2,
  ArrowLeft,
} from 'lucide-react'
import { formatCurrencyBRL } from '../../utils/format'

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function MachineMaintenanceDetailsPage() {
  const { id } =
    useParams<{ id: string }>()

  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [feedback, setFeedback] =
    useState<FeedbackType>(null)

  const record = useMemo(
    () =>
      id
        ? getMachineMaintenanceRecordById(
            id
          )
        : undefined,
    [id]
  )

  const machine = useMemo(
    () =>
      record
        ? getMachineById(
            record.machineId
          )
        : undefined,
    [record]
  )

  const canSeeInventory =
    userHasPermission(
      user,
      'inventory'
    )

  const canSeeFinance =
    userHasPermission(
      user,
      'finance'
    )

  const stockMovements =
    useMemo<InventoryMovement[]>(() => {
      if (!record) return []
      if (!canSeeInventory) return []

      return getInventoryMovementsByOrigin(
        'machines',
        'machine-maintenance',
        record.id
      )
    }, [
      record,
      canSeeInventory,
    ])

  const financialTransactions =
    useMemo<FinancialTransaction[]>(() => {
      if (!record) return []
      if (!canSeeFinance) return []

      return getFinancialTransactionsByOrigin(
        'machines',
        'machine-maintenance',
        record.id
      ).filter(
        transaction =>
          transaction.type ===
          'Despesa'
      )
    }, [
      record,
      canSeeFinance,
    ])

  useEffect(() => {
    const state =
      location.state as {
        successMessage?: string
      } | null

    if (!state?.successMessage) {
      return
    }

    setFeedback({
      type: 'success',
      message:
        state.successMessage,
    })

    navigate(location.pathname, {
      replace: true,
      state: null,
    })
  }, [
    location.pathname,
    location.state,
    navigate,
  ])

  useEffect(() => {
    if (!feedback) return

    const timer = setTimeout(
      () =>
        setFeedback(null),
      5000
    )

    return () =>
      clearTimeout(timer)
  }, [feedback])

  if (!record) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Registro de manutenção não encontrado
        </p>

        <Button
          className="mt-4"
          onClick={() =>
            navigate(
              '/maquinas/manutencoes'
            )
          }
        >
          Voltar para manutenções
        </Button>
      </div>
    )
  }

  const handleDelete = () => {
    if (
      window.confirm(
        'Excluir este registro de manutenção?'
      )
    ) {
      try {
        const deleted =
          deleteMachineMaintenanceRecord(
            record.id
          )

        if (deleted) {
          navigate(
            '/maquinas/manutencoes',
            {
              state: {
                successMessage:
                  'Registro de manutenção excluído com sucesso.',
              },
            }
          )
        } else {
          setFeedback({
            type: 'error',
            message:
              'Registro de manutenção não encontrado.',
          })
        }
      } catch (error) {
        setFeedback({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao excluir registro de manutenção.',
        })
      }
    }
  }

  const formatDate = (
    date: string
  ) =>
    new Date(
      date + 'T00:00:00'
    ).toLocaleDateString(
      'pt-BR'
    )

  const formatHourMeter = (
    value?: number
  ) => {
    if (
      value === undefined
    ) {
      return 'Não informado'
    }

    return `${value.toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }
    )} h`
  }

  const formatQuantity = (
    value: number
  ) =>
    value.toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    )

  return (
    <div className="space-y-6">
      {feedback && (
        <PageFeedback
          type={feedback.type}
          message={
            feedback.message
          }
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() =>
              navigate(
                '/maquinas/manutencoes'
              )
            }
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para manutenções
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Manutenção
            </h1>

            <HelpTip
              title="O que encontro nesta página?"
              description="Aqui você consulta os dados registrados desta manutenção, como máquina, data, tipo, horímetro e serviço realizado."
            />
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            {formatDate(
              record.maintenanceDate
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              navigate(
                `/maquinas/manutencoes/${record.id}/editar`
              )
            }
          >
            <Pencil className="w-4 h-4 mr-2 inline" />
            Editar
          </Button>

          <Button
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
            onClick={
              handleDelete
            }
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
              Máquina/Equipamento
            </p>

            {machine ? (
              <Link
                to={`/maquinas/${machine.id}`}
                className="font-medium text-green-600 hover:underline"
              >
                {machine.code} —{' '}
                {machine.name}
              </Link>
            ) : (
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Máquina ou equipamento não encontrado
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data da manutenção
            </p>

            <p className="font-medium">
              {formatDate(
                record.maintenanceDate
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tipo
            </p>

            <p className="font-medium">
              {record.type}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Horímetro na manutenção
            </p>

            <p className="font-medium">
              {formatHourMeter(
                record.hourMeter
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Serviço realizado
            </p>

            <p className="font-medium">
              {
                record.servicePerformed
              }
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Responsável
            </p>

            <p className="font-medium">
              {record.responsible ??
                'Não informado'}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Observações
          </p>

          <p className="font-medium">
            {record.notes ??
              'Não informado'}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data de cadastro
            </p>

            <p className="font-medium">
              {new Date(
                record.createdAt
              ).toLocaleDateString(
                'pt-BR'
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização
            </p>

            <p className="font-medium">
              {new Date(
                record.updatedAt
              ).toLocaleDateString(
                'pt-BR'
              )}
            </p>
          </div>
        </div>
      </Card>

      {canSeeInventory &&
        stockMovements.length >
          0 && (
          <Card className="p-6">
            <h2 className="font-semibold mb-3">
              Movimentações de estoque vinculadas
            </h2>

            <ul className="space-y-2 text-sm">
              {stockMovements.map(
                movement => {
                  const item =
                    getInventoryItemById(
                      movement.inventoryItemId
                    )

                  const code =
                    movement.itemCodeSnapshot ??
                    item?.code ??
                    '—'

                  const name =
                    movement.itemNameSnapshot ??
                    item?.name ??
                    'Item'

                  const unit =
                    movement.unitSnapshot ??
                    item?.unit ??
                    ''

                  return (
                    <li
                      key={
                        movement.id
                      }
                    >
                      <Link
                        to={`/estoque/movimentacoes/${movement.id}`}
                        className="text-green-600 hover:underline"
                      >
                        {formatDate(
                          movement.movementDate
                        )}{' '}
                        — {code} —{' '}
                        {name} (
                        {formatQuantity(
                          movement.quantity
                        )}{' '}
                        {unit}) ·{' '}
                        {movement.type}
                      </Link>
                    </li>
                  )
                }
              )}
            </ul>
          </Card>
        )}

      {canSeeFinance &&
        financialTransactions.length >
          0 && (
          <Card className="p-6">
            <h2 className="font-semibold mb-3">
              Despesa financeira vinculada
            </h2>

            <ul className="space-y-2 text-sm">
              {financialTransactions.map(
                transaction => {
                  const category =
                    getFinancialCategoryById(
                      transaction.categoryId
                    )

                  return (
                    <li
                      key={
                        transaction.id
                      }
                    >
                      <Link
                        to={`/financeiro/despesas/${transaction.id}`}
                        className="text-green-600 hover:underline"
                      >
                        {formatDate(
                          transaction.date
                        )}{' '}
                        —{' '}
                        {
                          transaction.description
                        }{' '}
                        (
                        {category?.name ??
                          'Categoria não encontrada'}{' '}
                        ·{' '}
                        {formatCurrencyBRL(
                          transaction.amount
                        )}
                        )
                      </Link>
                    </li>
                  )
                }
              )}
            </ul>
          </Card>
        )}
    </div>
  )
}