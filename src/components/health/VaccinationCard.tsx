import { Vaccination, Animal } from '../../types'
import {
  getVaccinationStatus,
} from '../../services/healthService'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

interface Props {
  vaccination: Vaccination
  animal?: Animal
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function VaccinationCard({
  vaccination,
  animal,
  onEdit,
  onDelete,
}: Props) {
  const status =
    getVaccinationStatus(vaccination)

  const statusBadge = () => {
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
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-sm">
            {vaccination.vaccineName}
          </p>

          {animal && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {animal.identification}{' '}
              {animal.name
                ? `— ${animal.name}`
                : ''}
            </p>
          )}
        </div>

        {statusBadge()}
      </div>

      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
        <p>
          Aplicação:{' '}
          {new Date(
            vaccination.applicationDate +
              'T00:00:00',
          ).toLocaleDateString('pt-BR')}
        </p>

        {vaccination.nextDoseDate && (
          <p>
            Próxima dose:{' '}
            {new Date(
              vaccination.nextDoseDate +
                'T00:00:00',
            ).toLocaleDateString(
              'pt-BR',
            )}
          </p>
        )}

        {vaccination.responsible && (
          <p>
            Responsável:{' '}
            {vaccination.responsible}
          </p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          onClick={() =>
            onEdit(vaccination.id)
          }
          className="text-xs px-2 py-1"
        >
          Editar
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            onDelete(vaccination.id)
          }
          className="text-xs px-2 py-1 text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
        >
          Excluir
        </Button>
      </div>
    </Card>
  )
}