import { Vaccination, Animal } from '../../types'
import {
  getVaccinationStatus,
} from '../../services/healthService'
import Badge from '../ui/Badge'
import {
  Pencil,
  Trash2,
} from 'lucide-react'

interface Props {
  vaccinations: Vaccination[]
  animals: Animal[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function VaccinationTable({
  vaccinations,
  animals,
  onEdit,
  onDelete,
}: Props) {
  const getAnimal = (animalId: string) =>
    animals.find(
      animal =>
        animal.id === animalId,
    )

  const statusBadge = (
    status: string,
  ) => {
    switch (status) {
      case 'Em dia':
        return (
          <Badge variant="success">
            Em dia
          </Badge>
        )

      case 'Próxima':
        return (
          <Badge variant="warning">
            Próxima
          </Badge>
        )

      case 'Vencida':
        return (
          <Badge variant="danger">
            Vencida
          </Badge>
        )

      default:
        return (
          <Badge variant="info">
            Sem próxima dose
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
              Identificação
            </th>
            <th className="px-4 py-3">
              Vacina
            </th>
            <th className="px-4 py-3">
              Aplicação
            </th>
            <th className="px-4 py-3">
              Próxima dose
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
          {vaccinations.map(
            vaccination => {
              const animal =
                getAnimal(
                  vaccination.animalId,
                )

              return (
                <tr
                  key={vaccination.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <td className="px-4 py-3">
                    {animal?.name ?? '—'}
                  </td>

                  <td className="px-4 py-3 font-medium">
                    {animal?.identification ??
                      '—'}
                  </td>

                  <td className="px-4 py-3">
                    {vaccination.vaccineName}
                  </td>

                  <td className="px-4 py-3">
                    {new Date(
                      vaccination.applicationDate +
                        'T00:00:00',
                    ).toLocaleDateString(
                      'pt-BR',
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {vaccination.nextDoseDate
                      ? new Date(
                          vaccination.nextDoseDate +
                            'T00:00:00',
                        ).toLocaleDateString(
                          'pt-BR',
                        )
                      : '—'}
                  </td>

                  <td className="px-4 py-3">
                    {statusBadge(
                      getVaccinationStatus(
                        vaccination,
                      ),
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {vaccination.responsible ??
                      '—'}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          onEdit(
                            vaccination.id,
                          )
                        }
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="Editar vacinação"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          onDelete(
                            vaccination.id,
                          )
                        }
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                        aria-label="Excluir vacinação"
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