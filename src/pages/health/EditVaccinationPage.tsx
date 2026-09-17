import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import VaccinationForm from '../../components/health/VaccinationForm'
import {
  getVaccinationById,
  updateVaccination,
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
  Vaccination,
  InventoryMovement,
  FinancialTransaction,
} from '../../types'
import Card from '../../components/ui/Card'
import HelpTip from '../../components/ui/HelpTip'
import { formatCurrencyBRL } from '../../utils/format'

export default function EditVaccinationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [vaccination, setVaccination] =
    useState<Vaccination | undefined>(
      undefined
    )

  const [
    hasStockConsumption,
    setHasStockConsumption,
  ] = useState(false)

  const [submitting, setSubmitting] =
    useState(false)

  const [submitError, setSubmitError] =
    useState('')

  const canSeeInventory = userHasPermission(user, 'inventory')
  const canSeeFinance = userHasPermission(user, 'finance')

  useEffect(() => {
    if (id) {
      const found =
        getVaccinationById(id)

      setVaccination(found)

      if (found) {
        setHasStockConsumption(
          hasInventoryMovementByOrigin(
            'health',
            'vaccination',
            found.id
          )
        )
      } else {
        setHasStockConsumption(false)
      }
    }
  }, [id])

  const stockMovements = useMemo<InventoryMovement[]>(() => {
    if (!vaccination) return []
    if (!canSeeInventory) return []

    return getInventoryMovementsByOrigin(
      'health',
      'vaccination',
      vaccination.id
    )
  }, [vaccination, canSeeInventory])

  const financialTransactions = useMemo<FinancialTransaction[]>(() => {
    if (!vaccination) return []
    if (!canSeeFinance) return []

    return getFinancialTransactionsByOrigin(
      'health',
      'vaccination',
      vaccination.id
    ).filter(transaction => transaction.type === 'Despesa')
  }, [vaccination, canSeeFinance])

  if (!vaccination) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Vacinação não encontrada
        </p>

        <button
          onClick={() =>
            navigate(
              '/saude-animal/vacinacoes'
            )
          }
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para vacinações
        </button>
      </div>
    )
  }

  const handleSubmit = async (
    data: Omit<
      Vaccination,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      await new Promise(
        resolve =>
          setTimeout(resolve, 300)
      )

      updateVaccination(
        vaccination.id,
        data
      )

      navigate(
        `/animais/${data.animalId}`,
        {
          state: {
            successMessage:
              'Vacinação atualizada com sucesso.',
          },
        }
      )
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar vacinação.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')

  const formatQuantity = (value: number) =>
    value.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">
            Editar Vacinação
          </h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Aqui você pode atualizar as informações desta vacinação. As alterações serão salvas no registro existente."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados da vacinação
        </p>
      </div>

      <VaccinationForm
        vaccination={vaccination}
        hasStockConsumption={
          hasStockConsumption
        }
        user={user}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        submitting={submitting}
        submitError={submitError}
      />

      {canSeeInventory && stockMovements.length > 0 && (
        <Card className="p-6">
          <h2 className="font-semibold mb-3">
            Movimentações de estoque vinculadas
          </h2>

          <ul className="space-y-2 text-sm">
            {stockMovements.map(movement => {
              const item = getInventoryItemById(movement.inventoryItemId)
              const code = movement.itemCodeSnapshot ?? item?.code ?? '—'
              const name = movement.itemNameSnapshot ?? item?.name ?? 'Item'
              const unit = movement.unitSnapshot ?? item?.unit ?? ''

              return (
                <li key={movement.id}>
                  <Link
                    to={`/estoque/movimentacoes/${movement.id}`}
                    className="text-green-600 hover:underline"
                  >
                    {formatDate(movement.movementDate)} — {code} — {name} (
                    {formatQuantity(movement.quantity)} {unit}) ·{' '}
                    {movement.type}
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {canSeeFinance && financialTransactions.length > 0 && (
        <Card className="p-6">
          <h2 className="font-semibold mb-3">
            Despesa financeira vinculada
          </h2>

          <ul className="space-y-2 text-sm">
            {financialTransactions.map(transaction => {
              const category = getFinancialCategoryById(
                transaction.categoryId
              )

              return (
                <li key={transaction.id}>
                  <Link
                    to={`/financeiro/despesas/${transaction.id}`}
                    className="text-green-600 hover:underline"
                  >
                    {formatDate(transaction.date)} —{' '}
                    {transaction.description} (
                    {category?.name ?? 'Categoria não encontrada'} ·{' '}
                    {formatCurrencyBRL(transaction.amount)})
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}