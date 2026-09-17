import { Treatment, Animal } from '../../types'
import Badge from '../ui/Badge'
import { Pencil, Trash2 } from 'lucide-react'

interface Props {
  treatments: Treatment[]
  animals: Animal[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function TreatmentTable({
  treatments,
  animals,
  onEdit,
  onDelete,
}: Props) {
  const getAnimal = (animalId: string) =>
    animals.find(a => a.id === animalId)

  const statusBadge = (status: string) => {
    switch (status) {
      case 'Em andamento':
        return (
          <Badge variant="warning">
            Em andamento
          </Badge>
        )

      case 'Concluído':
        return (
          <Badge variant="success">
            Concluído
          </Badge>
        )

      case 'Interrompido':
        return (
          <Badge variant="danger">
            Interrompido
          </Badge>
        )

      default:
        return (
          <Badge variant="info">
            {status}
          </Badge>
        )
    }
  }

  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <tr>
            <th className="px-4 py-3">
              Animal
            </th>
            <th className="px-4 py-3">
              Motivo
            </th>
            <th className="px-4 py-3">
              Medicamento
            </th>
            <th className="px-4 py-3">
              Início
            </th>
            <th className="px-4 py-3">
              Término
            </th>
            <th className="px-4 py-3">
              Situação
            </th>
            <th className="px-4 py-3">
              Responsável
            </th>
            <th className="px-4 py-3">
              Ações
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {treatments.map(
            treatment => {
              const animal =
                getAnimal(
                  treatment.animalId,
                )

              return (
                <tr
                  key={treatment.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <td className="px-4 py-3">
                    {animal?.identification ??
                      '—'}
                    {animal?.name
                      ? ` — ${animal.name}`
                      : ''}
                  </td>

                  <td className="px-4 py-3">
                    {treatment.reason}
                  </td>

                  <td className="px-4 py-3">
                    {treatment.medication ??
                      '—'}
                  </td>

                  <td className="px-4 py-3">
                    {new Date(
                      treatment.startDate +
                        'T00:00:00',
                    ).toLocaleDateString(
                      'pt-BR',
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {treatment.endDate
                      ? new Date(
                          treatment.endDate +
                            'T00:00:00',
                        ).toLocaleDateString(
                          'pt-BR',
                        )
                      : '—'}
                  </td>

                  <td className="px-4 py-3">
                    {statusBadge(
                      treatment.status,
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {treatment.responsible ??
                      '—'}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          onEdit(
                            treatment.id,
                          )
                        }
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="Editar tratamento"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          onDelete(
                            treatment.id,
                          )
                        }
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                        aria-label="Excluir tratamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            },
          )}
        </tbody>
      </table>
    </div>
  )
}