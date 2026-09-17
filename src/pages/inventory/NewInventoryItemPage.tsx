import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import InventoryItemForm from '../../components/inventory/InventoryItemForm'
import { createInventoryItem } from '../../services/inventoryService'
import { InventoryItem } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewInventoryItemPage() {
  const navigate = useNavigate()

  const [submitting, setSubmitting] =
    useState(false)

  const [submitError, setSubmitError] =
    useState('')

  const handleSubmit = (
    data: Omit<
      InventoryItem,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const item =
        createInventoryItem(
          data
        )

      navigate(
        `/estoque/${item.id}`,
        {
          state: {
            successMessage:
              'Item de estoque cadastrado com sucesso.',
          },
        }
      )
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao cadastrar item.'
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
            Novo item de estoque
          </h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Cadastre um item que será acompanhado no estoque da propriedade."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Preencha os dados do novo
          item.
        </p>
      </div>

      <InventoryItemForm
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate('/estoque')
        }
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}