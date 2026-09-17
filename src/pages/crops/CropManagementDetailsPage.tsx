import { useState, useEffect } from 'react'
import {
  useParams,
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom'
import { getCropManagementById } from '../../services/cropManagementService'
import { getCropCycleById } from '../../services/cropService'
import { getLandAreaById } from '../../services/landService'
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
import CropManagementTypeBadge from '../../components/crops/CropManagementTypeBadge'
import {
  Pencil,
  ArrowLeft,
} from 'lucide-react'
import { formatCurrencyBRL } from '../../utils/format'

export default function CropManagementDetailsPage() {
  const { id } = useParams<{
    id: string
  }>()

  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(null)

  const management = id
    ? getCropManagementById(id)
    : undefined

  const cropCycle = management
    ? getCropCycleById(
        management.cropCycleId
      )
    : undefined

  const area = cropCycle
    ? getLandAreaById(
        cropCycle.landAreaId
      )
    : undefined

  useEffect(() => {
    const state = location.state as {
      successMessage?: string
    } | null

    if (!state?.successMessage) return

    setSuccessMessage(
      state.successMessage
    )

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
    if (!successMessage) return

    const timer = setTimeout(
      () => setSuccessMessage(null),
      5000
    )

    return () =>
      clearTimeout(timer)
  }, [successMessage])

  if (!management) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Manejo não encontrado
        </p>

        <Button
          className="mt-4"
          onClick={() =>
            navigate(
              '/cultivos/manejos'
            )
          }
        >
          Voltar para manejos
        </Button>
      </div>
    )
  }

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

  const stockMovements: InventoryMovement[] =
    canSeeInventory
      ? getInventoryMovementsByOrigin(
          'crops',
          'crop-management',
          management.id
        )
      : []

  const financialTransactions: FinancialTransaction[] =
    canSeeFinance
      ? getFinancialTransactionsByOrigin(
          'crops',
          'crop-management',
          management.id
        ).filter(
          transaction =>
            transaction.type ===
            'Despesa'
        )
      : []

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return 'Não informada'
    }

    return new Date(
      date + 'T00:00:00'
    ).toLocaleDateString(
      'pt-BR'
    )
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
      {successMessage && (
        <PageFeedback
          type="success"
          message={
            successMessage
          }
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() =>
              navigate(
                '/cultivos/manejos'
              )
            }
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para manejos
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Manejo agrícola
            </h1>

            <HelpTip
              title="O que encontro nesta página?"
              description="Aqui você consulta os dados deste manejo agrícola, com tipo de operação, produto, dose, responsável e observações."
            />
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            {formatDate(
              management.date
            )}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() =>
            navigate(
              `/cultivos/manejos/${management.id}/editar`
            )
          }
        >
          <Pencil className="w-4 h-4 mr-2 inline" />
          Editar
        </Button>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data
            </p>

            <p className="font-medium">
              {formatDate(
                management.date
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tipo
            </p>

            <CropManagementTypeBadge
              type={
                management.type
              }
            />
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Descrição
            </p>

            <p className="font-medium">
              {
                management.description
              }
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Produto ou material
            </p>

            <p className="font-medium">
              {management.productOrMaterial ??
                'Não informado'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dose ou quantidade
            </p>

            <p className="font-medium">
              {management.doseOrQuantity ??
                'Não informada'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Responsável
            </p>

            <p className="font-medium">
              {management.responsible ??
                'Não informado'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cultivo
            </p>

            {cropCycle ? (
              <Link
                to={`/cultivos/${cropCycle.id}`}
                className="font-medium text-green-600 hover:underline"
              >
                {cropCycle.crop}
                {cropCycle.cultivar
                  ? ` — ${cropCycle.cultivar}`
                  : ''}
                {` — ${cropCycle.season}`}
              </Link>
            ) : (
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Cultivo não encontrado
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Talhão
            </p>

            {area ? (
              <Link
                to={`/terras/${area.id}`}
                className="font-medium text-green-600 hover:underline"
              >
                {area.code} —{' '}
                {area.name}
              </Link>
            ) : (
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Área não encontrada
              </p>
            )}
          </div>
        </div>

        {management.notes && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Observações
            </p>

            <p className="mt-1">
              {management.notes}
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
                management.createdAt
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
                management.updatedAt
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