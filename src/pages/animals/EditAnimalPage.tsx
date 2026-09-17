import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AnimalForm from '../../components/animals/AnimalForm'
import {
  getAnimalById,
  updateAnimal,
} from '../../services/animalService'
import { getLots } from '../../services/lotService'
import { useAuth } from '../../hooks/useAuth'
import { Animal, Lot } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function EditAnimalPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [animal, setAnimal] =
    useState<Animal | undefined>(undefined)

  const [lots, setLots] =
    useState<Lot[]>([])

  const [submitting, setSubmitting] =
    useState(false)

  const [submitError, setSubmitError] =
    useState('')

  useEffect(() => {
    if (id) {
      const found = getAnimalById(id)

      setAnimal(found)
      setLots(getLots())
    }
  }, [id])

  if (!animal) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Animal não encontrado
        </p>

        <button
          onClick={() =>
            navigate('/animais')
          }
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para Animais
        </button>
      </div>
    )
  }

  const handleSubmit = async (
    data: Omit<
      Animal,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      await new Promise(
        resolve =>
          setTimeout(resolve, 300),
      )

      updateAnimal(
        user,
        animal.id,
        data,
      )

      navigate(
        `/animais/${animal.id}`,
        {
          state: {
            successMessage:
              'Dados do animal atualizados com sucesso.',
          },
        },
      )
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar animal.',
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
            Editar Animal
          </h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Aqui você pode atualizar as informações deste animal."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Atualize as informações de {animal.identification}
        </p>
      </div>

      <AnimalForm
        animal={animal}
        lots={lots}
        user={user}
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate(
            `/animais/${animal.id}`,
          )
        }
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}