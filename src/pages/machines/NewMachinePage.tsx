import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MachineForm from '../../components/machines/MachineForm'
import { createMachine } from '../../services/machineService'
import { Machine } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewMachinePage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = (
    data: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const machine = createMachine(data)

      navigate(`/maquinas/${machine.id}`, {
        state: {
          successMessage:
            'Máquina ou equipamento cadastrado com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao cadastrar máquina.'
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
            Nova Máquina ou Equipamento
          </h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Preencha as informações abaixo para cadastrar uma máquina ou equipamento utilizado na propriedade."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Cadastre uma nova máquina ou equipamento.
        </p>
      </div>

      <MachineForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/maquinas')}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}