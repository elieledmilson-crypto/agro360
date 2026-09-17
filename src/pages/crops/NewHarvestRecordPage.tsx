import {
  useState,
  useMemo,
} from 'react'
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import HarvestRecordForm from '../../components/crops/HarvestRecordForm'
import { createHarvestRecord } from '../../services/harvestService'
import { getCropCycleById } from '../../services/cropService'
import { HarvestRecord } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewHarvestRecordPage() {
  const navigate = useNavigate()
  const [searchParams] =
    useSearchParams()

  const preselectedCropCycleId =
    useMemo(() => {
      const rawId =
        searchParams.get(
          'cropCycleId'
        )

      if (!rawId) {
        return undefined
      }

      const cropCycle =
        getCropCycleById(rawId)

      return cropCycle
        ? cropCycle.id
        : undefined
    }, [searchParams])

  const [submitting, setSubmitting] =
    useState(false)

  const [submitError, setSubmitError] =
    useState('')

  const handleSubmit = (
    data: Omit<
      HarvestRecord,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const record =
        createHarvestRecord(data)

      navigate(
        `/cultivos/colheitas/${record.id}`,
        {
          state: {
            successMessage:
              'Colheita cadastrada com sucesso.',
          },
        }
      )
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao cadastrar colheita.'
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
            Nova colheita
          </h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Registre os dados da colheita de um cultivo, como área colhida e produção obtida, para acompanhar a produtividade."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Registre a colheita de um
          cultivo.
        </p>
      </div>

      <HarvestRecordForm
        preselectedCropCycleId={
          preselectedCropCycleId
        }
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate(
            '/cultivos/colheitas'
          )
        }
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}