import { LandAreaStatus } from '../../types'
import Badge from '../ui/Badge'

interface Props {
  status: LandAreaStatus
}

export default function LandAreaStatusBadge({
  status,
}: Props) {
  switch (status) {
    case 'Em uso':
      return (
        <Badge variant="success">
          Em uso
        </Badge>
      )

    case 'Em descanso':
      return (
        <Badge variant="info">
          Em descanso
        </Badge>
      )

    case 'Em recuperação':
      return (
        <Badge variant="warning">
          Em recuperação
        </Badge>
      )

    case 'Inativa':
      return (
        <Badge variant="danger">
          Inativa
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