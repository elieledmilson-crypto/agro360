import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AnimalForm from '../../components/animals/AnimalForm'
import { createAnimal } from '../../services/animalService'
import { getLots } from '../../services/lotService'
import { useAuth } from '../../hooks/useAuth'
import { Animal, Lot } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewAnimalPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const lots = useMemo<Lot[]>(() => getLots(), [])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = async (
    data: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      await new Promise(resolve => setTimeout(resolve, 300))

      const animal = createAnimal(data, user)

      navigate(`/animais/${animal.id}`, {
        state: {
          successMessage: 'Animal cadastrado com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao cadastrar animal.',
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
            Cadastrar Animal
          </h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Preencha as informações abaixo para cadastrar um novo animal no Agro360."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Preencha os dados do novo animal
        </p>
      </div>

      <AnimalForm
        lots={lots}
        user={user}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/animais')}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}