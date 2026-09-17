import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RuralStructureForm from '../../components/land/RuralStructureForm'
import { createRuralStructure } from '../../services/ruralStructureService'
import { RuralStructure } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewRuralStructurePage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = (
    data: Omit<RuralStructure, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const structure = createRuralStructure(data)

      navigate(`/terras/estruturas/${structure.id}`, {
        state: {
          successMessage: 'Estrutura cadastrada com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao cadastrar estrutura.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Nova estrutura</h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Preencha as informações abaixo para cadastrar uma nova estrutura rural, como cerca, corredor ou porteira."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Cadastre uma nova estrutura da propriedade
        </p>
      </div>

      <RuralStructureForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/terras/estruturas')}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}