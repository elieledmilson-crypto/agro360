import { Animal } from '../../types'
import Button from '../ui/Button'
import Card from '../ui/Card'
import AnimalStatusBadge from './AnimalStatusBadge'

interface Props {
  animal: Animal
  lotName?: string
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function AnimalCard({
  animal,
  lotName,
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-sm">
            {animal.identification}
          </p>

          {animal.name && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {animal.name}
            </p>
          )}
        </div>

        <AnimalStatusBadge status={animal.status} />
      </div>

      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
        <p>
          {animal.species} · {animal.breed}
        </p>

        <p>
          {animal.sex} · {animal.category}
        </p>

        {animal.currentWeight && (
          <p>Peso: {animal.currentWeight} kg</p>
        )}

        {lotName && <p>Lote: {lotName}</p>}
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          onClick={() => onView(animal.id)}
          className="text-xs px-2 py-1"
        >
          Ver
        </Button>

        <Button
          variant="outline"
          onClick={() => onEdit(animal.id)}
          className="text-xs px-2 py-1"
        >
          Editar
        </Button>

        <Button
          variant="outline"
          onClick={() => onDelete(animal.id)}
          className="text-xs px-2 py-1 text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
        >
          Excluir
        </Button>
      </div>
    </Card>
  )
}