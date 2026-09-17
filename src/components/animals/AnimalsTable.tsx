import { Eye, Pencil, Trash2 } from 'lucide-react'
import { Animal, Lot } from '../../types'
import AnimalStatusBadge from './AnimalStatusBadge'

interface Props {
  animals: Animal[]
  lots: Lot[]
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function AnimalsTable({
  animals,
  lots,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const getLotName = (lotId?: string) => {
    if (!lotId) return 'Sem lote'

    return (
      lots.find(lot => lot.id === lotId)?.name ??
      'Sem lote'
    )
  }

  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <tr>
            <th className="px-4 py-3">Identificação</th>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Espécie</th>
            <th className="px-4 py-3">Raça</th>
            <th className="px-4 py-3">Sexo</th>
            <th className="px-4 py-3">Categoria</th>
            <th className="px-4 py-3">Lote</th>
            <th className="px-4 py-3">Peso (kg)</th>
            <th className="px-4 py-3">Situação</th>
            <th className="px-4 py-3">Ações</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {animals.map(animal => (
            <tr
              key={animal.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
            >
              <td className="px-4 py-3 font-medium">
                {animal.identification}
              </td>

              <td className="px-4 py-3">
                {animal.name ?? '—'}
              </td>

              <td className="px-4 py-3">
                {animal.species}
              </td>

              <td className="px-4 py-3">
                {animal.breed}
              </td>

              <td className="px-4 py-3">
                {animal.sex}
              </td>

              <td className="px-4 py-3">
                {animal.category}
              </td>

              <td className="px-4 py-3">
                {getLotName(animal.lotId)}
              </td>

              <td className="px-4 py-3">
                {animal.currentWeight ?? '—'}
              </td>

              <td className="px-4 py-3">
                <AnimalStatusBadge
                  status={animal.status}
                />
              </td>

              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => onView(animal.id)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Ver animal"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onEdit(animal.id)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Editar animal"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDelete(animal.id)}
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                    aria-label="Excluir animal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}