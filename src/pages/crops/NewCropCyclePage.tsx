import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CropCycleForm from '../../components/crops/CropCycleForm'
import { createCropCycle } from '../../services/cropService'
import { CropCycle } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewCropCyclePage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = (
    data: Omit<CropCycle, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const cycle = createCropCycle(data)

      navigate(`/cultivos/${cycle.id}`, {
        state: {
          successMessage: 'Cultivo cadastrado com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao cadastrar cultivo.'
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
            Novo cultivo
          </h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Preencha as informações abaixo para cadastrar um novo cultivo em um talhão da propriedade."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Cadastre um novo cultivo para um talhão.
        </p>
      </div>

      <CropCycleForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/cultivos')}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}