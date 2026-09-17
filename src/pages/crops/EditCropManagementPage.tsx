import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CropManagementForm from '../../components/crops/CropManagementForm'
import {
  getCropManagementById,
  updateCropManagement,
} from '../../services/cropManagementService'
import { hasInventoryMovementByOrigin } from '../../services/inventoryService'
import { useAuth } from '../../hooks/useAuth'
import { CropManagement } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function EditCropManagementPage() {
  const { id } =
    useParams<{ id: string }>()

  const navigate =
    useNavigate()

  const { user } =
    useAuth()

  const [submitting, setSubmitting] =
    useState(false)

  const [submitError, setSubmitError] =
    useState('')

  const [
    hasStockConsumption,
    setHasStockConsumption,
  ] = useState(false)

  const management = useMemo(
    () =>
      id
        ? getCropManagementById(
            id
          )
        : undefined,
    [id]
  )

  useEffect(() => {
    if (management) {
      setHasStockConsumption(
        hasInventoryMovementByOrigin(
          'crops',
          'crop-management',
          management.id
        )
      )
    } else {
      setHasStockConsumption(false)
    }
  }, [management])

  if (!management) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Manejo não encontrado
        </p>

        <button
          onClick={() =>
            navigate(
              '/cultivos/manejos'
            )
          }
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para manejos
        </button>
      </div>
    )
  }

  const handleSubmit = (
    data: Omit<
      CropManagement,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      updateCropManagement(
        management.id,
        data
      )

      navigate(
        `/cultivos/manejos/${management.id}`,
        {
          state: {
            successMessage:
              'Manejo atualizado com sucesso.',
          },
        }
      )
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar manejo.'
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
            Editar manejo
          </h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Aqui você pode atualizar as informações deste manejo. As alterações serão salvas no cadastro existente."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados do manejo.
        </p>
      </div>

      <CropManagementForm
        management={
          management
        }
        hasStockConsumption={
          hasStockConsumption
        }
        user={user}
        onSubmit={
          handleSubmit
        }
        onCancel={() =>
          navigate(
            `/cultivos/manejos/${management.id}`
          )
        }
        submitting={
          submitting
        }
        submitError={
          submitError
        }
      />
    </div>
  )
}