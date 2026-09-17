import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SoilAnalysisForm from '../../components/crops/SoilAnalysisForm'
import {
  getSoilAnalysisById,
  updateSoilAnalysis,
} from '../../services/soilAnalysisService'
import { SoilAnalysis } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function EditSoilAnalysisPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [submitting, setSubmitting] =
    useState(false)
  const [submitError, setSubmitError] =
    useState('')

  const analysis = id
    ? getSoilAnalysisById(id)
    : undefined

  if (!analysis) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Análise não encontrada
        </p>

        <button
          onClick={() =>
            navigate('/cultivos/solo')
          }
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para análises
        </button>
      </div>
    )
  }

  const handleSubmit = (
    data: Omit<
      SoilAnalysis,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      updateSoilAnalysis(
        analysis.id,
        data
      )

      navigate(
        `/cultivos/solo/${analysis.id}`,
        {
          state: {
            successMessage:
              'Análise de solo atualizada com sucesso.',
          },
        }
      )
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar análise.'
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
            Editar análise de solo
          </h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Aqui você pode atualizar as informações desta análise de solo. As alterações serão salvas no cadastro existente."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados da análise.
        </p>
      </div>

      <SoilAnalysisForm
        analysis={analysis}
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate(
            `/cultivos/solo/${analysis.id}`
          )
        }
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}