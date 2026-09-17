import { MachineStatus } from '../../types'
import Badge from '../ui/Badge'

interface Props {
  status: MachineStatus
}

export default function MachineStatusBadge({
  status,
}: Props) {
  switch (status) {
    case 'Operacional':
      return <Badge variant="success">Operacional</Badge>

    case 'Em manutenção':
      return <Badge variant="warning">Em manutenção</Badge>

    case 'Inativa':
      return <Badge variant="info">Inativa</Badge>

    default:
      return <Badge variant="info">{status}</Badge>
  }
}