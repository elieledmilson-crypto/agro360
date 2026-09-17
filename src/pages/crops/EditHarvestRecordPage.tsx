import {
  useState,
  useMemo,
} from 'react'
import {
  useParams,
  useNavigate,
} from 'react-router-dom'
import HarvestRecordForm from '../../components/crops/HarvestRecordForm'
import {
  getHarvestRecordById,
  updateHarvestRecord,
} from '../../services/harvestService'
import { HarvestRecord } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function EditHarvestRecordPage() {
  const { id } = useParams<{
    id: string
  }>()

  const navigate = useNavigate()

  const [submitting, setSubmitting] =
    useState(false)

  const [submitError, setSubmitError] =
    useState('')

  const record = useMemo(
    () =>
      id
        ? getHarvestRecordById(id)
        : undefined,
    [id]
  )

  if (!record) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Colheita não encontrada
        </p>

        <button
          onClick={() =>
            navigate(
              '/cultivos/colheitas'
            )
          }
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para colheitas
        </button>
      </div>
    )
  }

  const handleSubmit = (
    data: Omit<
      HarvestRecord,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      updateHarvestRecord(
        record.id,
        data
      )

      navigate(
        `/cultivos/colheitas/${record.id}`,
        {
          state: {
            successMessage:
              'Colheita atualizada com sucesso.',
          },
        }
      )
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar colheita.'
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
            Editar colheita
          </h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Aqui você pode atualizar as informações desta colheita. As alterações serão salvas no cadastro existente."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados da colheita.
        </p>
      </div>

      <HarvestRecordForm
        record={record}
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate(
            `/cultivos/colheitas/${record.id}`
          )
        }
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}