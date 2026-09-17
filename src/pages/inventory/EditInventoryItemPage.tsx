import { useState, useMemo } from 'react'
import {
  useParams,
  useNavigate,
} from 'react-router-dom'
import InventoryItemForm from '../../components/inventory/InventoryItemForm'
import {
  getInventoryItemById,
  updateInventoryItem,
} from '../../services/inventoryService'
import { InventoryItem } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function EditInventoryItemPage() {
  const { id } =
    useParams<{ id: string }>()

  const navigate = useNavigate()

  const [submitting, setSubmitting] =
    useState(false)

  const [submitError, setSubmitError] =
    useState('')

  const item = useMemo(
    () =>
      id
        ? getInventoryItemById(id)
        : undefined,
    [id]
  )

  if (!item) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Item de estoque não encontrado
        </p>

        <button
          onClick={() =>
            navigate('/estoque')
          }
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para estoque
        </button>
      </div>
    )
  }

  const handleSubmit = (
    data: Omit<
      InventoryItem,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const updated =
        updateInventoryItem(
          item.id,
          data
        )

      if (!updated) {
        throw new Error(
          'Item de estoque não encontrado.'
        )
      }

      navigate(
        `/estoque/${updated.id}`,
        {
          state: {
            successMessage:
              'Item de estoque atualizado com sucesso.',
          },
        }
      )
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar item.'
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
            Editar item de estoque
          </h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Aqui você pode atualizar as informações deste item de estoque."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados do item.
        </p>
      </div>

      <InventoryItemForm
        item={item}
        currentQuantityReadOnly
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate(
            `/estoque/${item.id}`
          )
        }
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}