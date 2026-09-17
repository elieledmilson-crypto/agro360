import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getLots,
  createLot,
  updateLot,
  deleteLot,
} from '../../services/lotService'
import { clearLotFromAnimals } from '../../services/animalService'
import { getActiveOccupationByLotId } from '../../services/paddockOccupationService'
import { getLandAreaById } from '../../services/landService'
import { Lot } from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  ArrowLeft,
} from 'lucide-react'

export default function LotsPage() {
  const navigate = useNavigate()

  const [lots, setLots] = useState<Lot[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setLots(getLots())
  }, [])

  const handleCreate = (e: FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    createLot(
      name.trim(),
      description.trim() || undefined
    )

    setName('')
    setDescription('')
    setLots(getLots())
  }

  const handleUpdate = (e: FormEvent) => {
    e.preventDefault()

    if (!editingId || !editName.trim()) return

    updateLot(editingId, {
      name: editName.trim(),
      description:
        editDescription.trim() || undefined,
    })

    setEditingId(null)
    setLots(getLots())
  }

  const handleDelete = (id: string) => {
    const lot = lots.find(l => l.id === id)

    if (!lot) return

    if (
      window.confirm(
        'Excluir este lote? Animais desse lote ficarão sem lote.'
      )
    ) {
      try {
        const success = deleteLot(id)

        if (success) {
          clearLotFromAnimals(id, lot.name)
          setError('')
          setLots(getLots())
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Erro ao excluir lote.'
        )
      }
    }
  }

  const getCurrentPaddock = (
    lotId: string
  ): string => {
    const occupation =
      getActiveOccupationByLotId(lotId)

    if (!occupation) return 'Sem piquete'

    const area = getLandAreaById(
      occupation.landAreaId
    )

    return area
      ? `${area.code} — ${area.name}`
      : 'Piquete não encontrado'
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/animais')}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Animais
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">
            Lotes de Animais
          </h1>

          <HelpTip
            title="Para que servem os lotes?"
            description="Os lotes permitem organizar vários animais em grupos, facilitando o manejo e o acompanhamento do rebanho."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Organize seus animais em grupos
        </p>
      </div>

      {error && (
        <PageFeedback
          type="error"
          message={error}
        />
      )}

      <Card className="p-6">
        <h2 className="font-semibold mb-4">
          Adicionar novo lote
        </h2>

        <form
          onSubmit={handleCreate}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Input
            label="Nome do lote *"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Lote de Engorda 01"
            required
          />

          <Input
            label="Descrição"
            value={description}
            onChange={e =>
              setDescription(e.target.value)
            }
            placeholder="Opcional"
          />

          <div className="sm:self-end">
            <Button type="submit">
              <Plus className="w-4 h-4 mr-2 inline" />
              Adicionar
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {lots.map(lot => (
          <Card
            key={lot.id}
            className="p-4"
          >
            {editingId === lot.id ? (
              <form
                onSubmit={handleUpdate}
                className="flex flex-col sm:flex-row gap-3 items-start sm:items-center"
              >
                <div className="flex-1">
                  <Input
                    label="Nome"
                    value={editName}
                    onChange={e =>
                      setEditName(e.target.value)
                    }
                    required
                  />
                </div>

                <div className="flex-1">
                  <Input
                    label="Descrição"
                    value={editDescription}
                    onChange={e =>
                      setEditDescription(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Salvar
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setEditingId(null)
                    }
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {lot.name}
                  </p>

                  {lot.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {lot.description}
                    </p>
                  )}

                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Piquete atual:{' '}
                    {getCurrentPaddock(lot.id)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(lot.id)
                      setEditName(lot.name)
                      setEditDescription(
                        lot.description ?? ''
                      )
                    }}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Editar lote"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(lot.id)
                    }
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                    aria-label="Excluir lote"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}

        {lots.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            Nenhum lote cadastrado. Adicione um para
            organizar seus animais.
          </p>
        )}
      </div>
    </div>
  )
}