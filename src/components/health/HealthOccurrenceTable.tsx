import { HealthOccurrence, Animal } from '../../types'
import Badge from '../ui/Badge'
import { Pencil, Trash2 } from 'lucide-react'

interface Props {
  occurrences: HealthOccurrence[]
  animals: Animal[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function HealthOccurrenceTable({
  occurrences,
  animals,
  onEdit,
  onDelete,
}: Props) {
  const getAnimal = (animalId: string) =>
    animals.find(animal => animal.id === animalId)

  const severityBadge = (severity: string) => {
    switch (severity) {
      case 'Baixa':
        return <Badge variant="info">Baixa</Badge>
      case 'Média':
        return <Badge variant="warning">Média</Badge>
      case 'Alta':
        return <Badge variant="danger">Alta</Badge>
      default:
        return <Badge variant="info">{severity}</Badge>
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'Aberta':
        return <Badge variant="warning">Aberta</Badge>
      case 'Resolvida':
        return <Badge variant="success">Resolvida</Badge>
      default:
        return <Badge variant="info">{status}</Badge>
    }
  }

  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <tr>
            <th className="px-4 py-3">Animal</th>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Título</th>
            <th className="px-4 py-3">Severidade</th>
            <th className="px-4 py-3">Situação</th>
            <th className="px-4 py-3">Ações</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {occurrences.map(occurrence => {
            const animal = getAnimal(occurrence.animalId)

            return (
              <tr
                key={occurrence.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
              >
                <td className="px-4 py-3">
                  {animal?.identification ?? '—'}
                  {animal?.name ? ` — ${animal.name}` : ''}
                </td>

                <td className="px-4 py-3">
                  {new Date(
                    occurrence.date + 'T00:00:00',
                  ).toLocaleDateString('pt-BR')}
                </td>

                <td className="px-4 py-3">
                  {occurrence.type}
                </td>

                <td className="px-4 py-3">
                  {occurrence.title}
                </td>

                <td className="px-4 py-3">
                  {severityBadge(occurrence.severity)}
                </td>

                <td className="px-4 py-3">
                  {statusBadge(occurrence.status)}
                </td>

                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(occurrence.id)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="Editar ocorrência"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDelete(occurrence.id)}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                      aria-label="Excluir ocorrência"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}