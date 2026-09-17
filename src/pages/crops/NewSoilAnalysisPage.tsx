import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SoilAnalysisForm from '../../components/crops/SoilAnalysisForm'
import { createSoilAnalysis } from '../../services/soilAnalysisService'
import { SoilAnalysis } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewSoilAnalysisPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] =
    useState(false)
  const [submitError, setSubmitError] =
    useState('')

  const handleSubmit = (
    data: Omit<
      SoilAnalysis,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const analysis =
        createSoilAnalysis(data)

      navigate(
        `/cultivos/solo/${analysis.id}`,
        {
          state: {
            successMessage:
              'Análise de solo cadastrada com sucesso.',
          },
        }
      )
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao cadastrar análise.'
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
            Nova análise de solo
          </h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Preencha os resultados da análise de solo de um talhão para manter o histórico de fertilidade da propriedade."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Registre uma nova análise de
          solo para um talhão.
        </p>
      </div>

      <SoilAnalysisForm
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate('/cultivos/solo')
        }
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}