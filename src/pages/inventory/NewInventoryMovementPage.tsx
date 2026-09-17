import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import InventoryMovementForm, {
  InventoryMovementFinancialPayload,
} from '../../components/inventory/InventoryMovementForm'
import {
  createInventoryMovement,
  getInventoryItemById,
} from '../../services/inventoryService'
import { createInventoryMovementWithFinancial } from '../../services/inventoryIntegrationService'
import { useAuth } from '../../hooks/useAuth'
import {
  InventoryMovement,
  InventoryMovementType,
} from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewInventoryMovementPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const {
    preselectedItemId,
    preselectedType,
  } = useMemo(() => {
    const requestedItemId =
      searchParams.get('inventoryItemId') ?? ''

    const requestedType =
      searchParams.get('type') ?? ''

    const validItemId =
      requestedItemId &&
      getInventoryItemById(requestedItemId)
        ? requestedItemId
        : undefined

    let validType: InventoryMovementType | undefined

    if (
      requestedType === 'Entrada' ||
      requestedType === 'Saída'
    ) {
      validType = requestedType
    }

    return {
      preselectedItemId: validItemId,
      preselectedType: validType,
    }
  }, [searchParams])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = (
    data: Omit<
      InventoryMovement,
      'id' | 'createdAt' | 'balanceBefore' | 'balanceAfter'
    >,
    financial?: InventoryMovementFinancialPayload,
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      let movementId: string

      if (financial) {
        const financialInput = {
          type: 'Despesa' as const,
          ...financial,
        }

        const result = createInventoryMovementWithFinancial(
          user,
          data,
          financialInput,
        )

        movementId = result.movement.id
      } else {
        const movement = createInventoryMovement(data)
        movementId = movement.id
      }

      navigate(`/estoque/movimentacoes/${movementId}`, {
        state: {
          successMessage:
            'Movimentação de estoque registrada com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao registrar movimentação.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">
            Nova movimentação de estoque
          </h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Registre uma entrada ou saída para atualizar o saldo de um item do estoque."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Registre uma entrada ou saída de estoque.
        </p>
      </div>

      <InventoryMovementForm
        preselectedItemId={preselectedItemId}
        preselectedType={preselectedType}
        user={user}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/estoque/movimentacoes')}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}