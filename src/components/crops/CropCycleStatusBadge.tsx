import { CropCycleStatus } from '../../types'
import Badge from '../ui/Badge'

interface Props {
  status: CropCycleStatus
}

export default function CropCycleStatusBadge({
  status,
}: Props) {
  switch (status) {
    case 'Planejado':
      return (
        <Badge variant="info">
          Planejado
        </Badge>
      )

    case 'Em andamento':
      return (
        <Badge variant="success">
          Em andamento
        </Badge>
      )

    case 'Concluído':
      return (
        <Badge variant="warning">
          Concluído
        </Badge>
      )

    case 'Cancelado':
      return (
        <Badge variant="danger">
          Cancelado
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