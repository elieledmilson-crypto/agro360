import { Treatment, Animal } from '../../types'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

interface Props {
  treatment: Treatment
  animal?: Animal
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function TreatmentCard({
  treatment,
  animal,
  onEdit,
  onDelete,
}: Props) {
  const statusBadge = () => {
    switch (treatment.status) {
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
            {treatment.status}
          </Badge>
        )
    }
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-sm">
            {treatment.reason}
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
          Início:{' '}
          {new Date(
            treatment.startDate +
              'T00:00:00',
          ).toLocaleDateString('pt-BR')}
        </p>

        {treatment.endDate && (
          <p>
            Término:{' '}
            {new Date(
              treatment.endDate +
                'T00:00:00',
            ).toLocaleDateString(
              'pt-BR',
            )}
          </p>
        )}

        {treatment.medication && (
          <p>
            Medicamento:{' '}
            {treatment.medication}
          </p>
        )}

        {treatment.responsible && (
          <p>
            Responsável:{' '}
            {treatment.responsible}
          </p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          onClick={() =>
            onEdit(treatment.id)
          }
          className="text-xs px-2 py-1"
        >
          Editar
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            onDelete(treatment.id)
          }
          className="text-xs px-2 py-1 text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
        >
          Excluir
        </Button>
      </div>
    </Card>
  )
}