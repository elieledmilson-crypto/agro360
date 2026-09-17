import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import TreatmentForm from '../../components/health/TreatmentForm'
import {
  getTreatmentById,
  updateTreatment,
} from '../../services/healthService'
import {
  hasInventoryMovementByOrigin,
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
  Treatment,
  InventoryMovement,
  FinancialTransaction,
} from '../../types'
import Card from '../../components/ui/Card'
import HelpTip from '../../components/ui/HelpTip'
import { formatCurrencyBRL } from '../../utils/format'

export default function EditTreatmentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [treatment, setTreatment] =
    useState<Treatment | undefined>(undefined)

  const [hasStockConsumption, setHasStockConsumption] =
    useState(false)

  const [submitting, setSubmitting] =
    useState(false)

  const [submitError, setSubmitError] =
    useState('')

  const canSeeInventory =
    userHasPermission(user, 'inventory')

  const canSeeFinance =
    userHasPermission(user, 'finance')

  useEffect(() => {
    if (id) {
      const found =
        getTreatmentById(id)

      setTreatment(found)

      if (found) {
        setHasStockConsumption(
          hasInventoryMovementByOrigin(
            'health',
            'treatment',
            found.id
          )
        )
      } else {
        setHasStockConsumption(false)
      }
    }
  }, [id])

  const stockMovements =
    useMemo<InventoryMovement[]>(() => {
      if (!treatment) return []
      if (!canSeeInventory) return []

      return getInventoryMovementsByOrigin(
        'health',
        'treatment',
        treatment.id
      )
    }, [
      treatment,
      canSeeInventory,
    ])

  const financialTransactions =
    useMemo<FinancialTransaction[]>(() => {
      if (!treatment) return []
      if (!canSeeFinance) return []

      return getFinancialTransactionsByOrigin(
        'health',
        'treatment',
        treatment.id
      ).filter(
        transaction =>
          transaction.type === 'Despesa'
      )
    }, [
      treatment,
      canSeeFinance,
    ])

  if (!treatment) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Tratamento não encontrado
        </p>

        <button
          onClick={() =>
            navigate(
              '/saude-animal/tratamentos'
            )
          }
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para tratamentos
        </button>
      </div>
    )
  }

  const handleSubmit = (
    data: Omit<
      Treatment,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      updateTreatment(
        treatment.id,
        data
      )

      navigate(
        `/animais/${data.animalId}`,
        {
          state: {
            successMessage:
              'Tratamento atualizado com sucesso.',
          },
        }
      )
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar tratamento.'
      )
    } finally {
      setSubmitting(false)
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
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">
            Editar Tratamento
          </h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Aqui você pode atualizar as informações deste tratamento. As alterações serão salvas no registro existente."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados do tratamento
        </p>
      </div>

      <TreatmentForm
        treatment={treatment}
        hasStockConsumption={
          hasStockConsumption
        }
        user={user}
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate(-1)
        }
        submitting={submitting}
        submitError={submitError}
      />

      {canSeeInventory &&
        stockMovements.length > 0 && (
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