import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LandUseForm from '../../components/land/LandUseForm'
import {
  getLandUseRecordById,
  updateLandUseRecord,
} from '../../services/landUseService'
import { LandUseRecord } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function EditLandUseRecordPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const record = id
    ? getLandUseRecordById(id)
    : undefined

  if (!record) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Registro de utilização não encontrado
        </p>

        <button
          onClick={() =>
            navigate('/terras/historico')
          }
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para histórico
        </button>
      </div>
    )
  }

  const handleSubmit = (
    data: Omit<LandUseRecord, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      updateLandUseRecord(record.id, data)

      navigate(`/terras/historico/${record.id}`, {
        state: {
          successMessage:
            'Registro atualizado com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar registro.'
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
            Editar registro de utilização
          </h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Aqui você pode atualizar as informações deste registro. As alterações serão salvas no cadastro existente."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados do registro.
        </p>
      </div>

      <LandUseForm
        record={record}
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate(
            `/terras/historico/${record.id}`
          )
        }
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}