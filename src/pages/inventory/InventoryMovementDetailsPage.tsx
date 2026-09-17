import { useState, useEffect, useMemo } from 'react'
import {
  useParams,
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom'
import {
  getInventoryMovementById,
  getInventoryItemById,
} from '../../services/inventoryService'
import {
  getFinancialTransactionsByOrigin,
  getFinancialCategoryById,
} from '../../services/financeService'
import { useAuth } from '../../hooks/useAuth'
import { userHasPermission } from '../../services/permissionService'
import {
  PermissionKey,
  InventoryMovement,
} from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import {
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react'
import { formatCurrencyBRL } from '../../utils/format'

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

interface OriginInfo {
  label: string
  path?: string
  modulePermission: PermissionKey | null
}

function getOriginInfo(
  movement: InventoryMovement,
): OriginInfo | null {
  if (!movement.origin) return null

  const {
    module,
    type,
    recordId,
  } = movement.origin

  if (
    module === 'health' &&
    type === 'vaccination'
  ) {
    return {
      label: 'Baixa por vacinação',
      path: `/saude-animal/vacinacoes/${recordId}/editar`,
      modulePermission: 'health',
    }
  }

  if (
    module === 'health' &&
    type === 'treatment'
  ) {
    return {
      label: 'Baixa por tratamento',
      path: `/saude-animal/tratamentos/${recordId}/editar`,
      modulePermission: 'health',
    }
  }

  if (
    module === 'crops' &&
    type === 'crop-management'
  ) {
    return {
      label: 'Baixa por manejo agrícola',
      path: `/cultivos/manejos/${recordId}`,
      modulePermission: 'crops',
    }
  }

  if (
    module === 'machines' &&
    type === 'machine-maintenance'
  ) {
    return {
      label: 'Baixa por manutenção de máquina',
      path: `/maquinas/manutencoes/${recordId}`,
      modulePermission: 'machines',
    }
  }

  return {
    label: 'Origem desconhecida',
    modulePermission: null,
  }
}

export default function InventoryMovementDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [feedback, setFeedback] =
    useState<FeedbackType>(null)

  const movement = useMemo(
    () =>
      id
        ? getInventoryMovementById(id)
        : undefined,
    [id],
  )

  const item = useMemo(
    () =>
      movement
        ? getInventoryItemById(
            movement.inventoryItemId,
          )
        : undefined,
    [movement],
  )

  const canSeeFinance =
    userHasPermission(
      user,
      'finance',
    )

  const linkedFinancials =
    useMemo(() => {
      if (
        !movement ||
        !canSeeFinance
      ) {
        return []
      }

      const results: Array<{
        id: string
        categoryName: string
        amount: number
        date: string
        description: string
      }> = []

      const financial =
        getFinancialTransactionsByOrigin(
          'inventory',
          'inventory-entry',
          movement.id,
        )

      for (
        const transaction of financial
      ) {
        const category =
          getFinancialCategoryById(
            transaction.categoryId,
          )

        results.push({
          id: transaction.id,
          categoryName:
            category?.name ??
            'Categoria não encontrada',
          amount:
            transaction.amount,
          date:
            transaction.date,
          description:
            transaction.description,
        })
      }

      return results
    }, [
      movement,
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
      () => setFeedback(null),
      5000,
    )

    return () =>
      clearTimeout(timer)
  }, [feedback])

  if (!movement) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Movimentação não encontrada
        </p>

        <Button
          className="mt-4"
          onClick={() =>
            navigate(
              '/estoque/movimentacoes',
            )
          }
        >
          Voltar para movimentações
        </Button>
      </div>
    )
  }

  const formatDate = (
    date: string,
  ) =>
    new Date(
      date + 'T00:00:00',
    ).toLocaleDateString(
      'pt-BR',
    )

  const formatQuantity = (
    value: number,
  ) =>
    value.toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    )

  const displayCode =
    movement.itemCodeSnapshot ??
    item?.code ??
    '—'

  const displayName =
    movement.itemNameSnapshot ??
    item?.name ??
    'Item não encontrado'

  const unit =
    movement.unitSnapshot ??
    item?.unit ??
    ''

  const typeBadge = () => {
    if (
      movement.type === 'Entrada'
    ) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
          <ArrowDownCircle className="w-3 h-3" />
          Entrada
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
        <ArrowUpCircle className="w-3 h-3" />
        Saída
      </span>
    )
  }

  const originInfo =
    getOriginInfo(movement)

  const hasOriginPermission =
    originInfo !== null &&
    (
      originInfo.modulePermission ===
        null ||
      userHasPermission(
        user,
        originInfo.modulePermission,
      )
    )

  const isIntegrated =
    movement.origin !== undefined

  const maskOriginDerivedContent =
    isIntegrated &&
    !hasOriginPermission

  return (
    <div className="space-y-6">
      {feedback && (
        <PageFeedback
          type={feedback.type}
          message={feedback.message}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() =>
              navigate(
                '/estoque/movimentacoes',
              )
            }
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para movimentações
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Movimentação de Estoque
            </h1>

            <HelpTip
              title="O que encontro nesta página?"
              description="Aqui você consulta os dados desta movimentação e o saldo do item antes e depois do registro."
            />
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            {formatDate(
              movement.movementDate,
            )}
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Item
            </p>

            {item ? (
              <Link
                to={`/estoque/${item.id}`}
                className="font-medium text-green-600 hover:underline"
              >
                {displayCode} — {displayName}
              </Link>
            ) : (
              <p className="font-medium text-gray-700 dark:text-gray-300">
                {displayCode} — {displayName}
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Código do item
            </p>

            <p className="font-medium">
              {displayCode}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tipo
            </p>

            {typeBadge()}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data
            </p>

            <p className="font-medium">
              {formatDate(
                movement.movementDate,
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Quantidade
            </p>

            <p className="font-medium">
              {formatQuantity(
                movement.quantity,
              )}{' '}
              {unit}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Unidade
            </p>

            <p className="font-medium">
              {unit || '—'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Saldo anterior
            </p>

            <p className="font-medium">
              {formatQuantity(
                movement.balanceBefore,
              )}{' '}
              {unit}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Saldo posterior
            </p>

            <p className="font-medium">
              {formatQuantity(
                movement.balanceAfter,
              )}{' '}
              {unit}
            </p>
          </div>

          {!maskOriginDerivedContent && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Responsável
              </p>

              <p className="font-medium">
                {movement.responsible ??
                  'Não informado'}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Motivo
          </p>

          {maskOriginDerivedContent ? (
            <p className="mt-1 font-medium text-gray-500 dark:text-gray-400">
              Movimentação integrada
            </p>
          ) : (
            <p className="mt-1 font-medium">
              {movement.reason}
            </p>
          )}
        </div>

        {!maskOriginDerivedContent &&
          movement.notes && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Observações
              </p>

              <p className="mt-1">
                {movement.notes}
              </p>
            </div>
          )}

        <div className="mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Origem
          </p>

          {movement.origin ? (
            hasOriginPermission &&
            originInfo ? (
              originInfo.path ? (
                <Link
                  to={originInfo.path}
                  className="mt-1 font-medium text-green-600 hover:underline"
                >
                  {originInfo.label}
                </Link>
              ) : (
                <p className="mt-1 font-medium">
                  {originInfo.label}
                </p>
              )
            ) : (
              <p className="mt-1 font-medium text-gray-500 dark:text-gray-400">
                Origem integrada (sem permissão para ver detalhes).
              </p>
            )
          ) : (
            <p className="mt-1 font-medium">
              Movimentação manual
            </p>
          )}
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Data de registro
          </p>

          <p className="font-medium">
            {new Date(
              movement.createdAt,
            ).toLocaleDateString(
              'pt-BR',
            )}
          </p>
        </div>
      </Card>

      {canSeeFinance &&
        linkedFinancials.length >
          0 && (
          <Card className="p-6">
            <h2 className="font-semibold mb-3">
              Financeiro vinculado
            </h2>

            <ul className="space-y-2 text-sm">
              {linkedFinancials.map(
                financial => (
                  <li
                    key={
                      financial.id
                    }
                  >
                    <Link
                      to={`/financeiro/despesas/${financial.id}`}
                      className="text-green-600 hover:underline"
                    >
                      {financial.date}{' '}
                      —{' '}
                      {
                        financial.description
                      }{' '}
                      (
                      {
                        financial.categoryName
                      }{' '}
                      ·{' '}
                      {formatCurrencyBRL(
                        financial.amount,
                      )}
                      )
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </Card>
        )}
    </div>
  )
}