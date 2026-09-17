import { HealthOccurrence, Animal } from '../../types'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

interface Props {
  occurrence: HealthOccurrence
  animal?: Animal
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function HealthOccurrenceCard({
  occurrence,
  animal,
  onEdit,
  onDelete,
}: Props) {
  const severityBadge = () => {
    switch (occurrence.severity) {
      case 'Baixa':
        return <Badge variant="info">Baixa</Badge>
      case 'Média':
        return <Badge variant="warning">Média</Badge>
      case 'Alta':
        return <Badge variant="danger">Alta</Badge>
      default:
        return <Badge variant="info">{occurrence.severity}</Badge>
    }
  }

  const statusBadge = () => {
    switch (occurrence.status) {
      case 'Aberta':
        return <Badge variant="warning">Aberta</Badge>
      case 'Resolvida':
        return <Badge variant="success">Resolvida</Badge>
      default:
        return <Badge variant="info">{occurrence.status}</Badge>
    }
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-sm">
            {occurrence.title}
          </p>

          {animal && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {animal.identification}{' '}
              {animal.name ? `— ${animal.name}` : ''}
            </p>
          )}
        </div>

        {statusBadge()}
      </div>

      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
        <p>
          Data:{' '}
          {new Date(
            occurrence.date + 'T00:00:00',
          ).toLocaleDateString('pt-BR')}
        </p>

        <p>Tipo: {occurrence.type}</p>

        <div className="mt-1">
          {severityBadge()}
        </div>

        {occurrence.description && (
          <p className="mt-1">
            {occurrence.description}
          </p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          onClick={() => onEdit(occurrence.id)}
          className="text-xs px-2 py-1"
        >
          Editar
        </Button>

        <Button
          variant="outline"
          onClick={() => onDelete(occurrence.id)}
          className="text-xs px-2 py-1 text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
        >
          Excluir
        </Button>
      </div>
    </Card>
  )
}