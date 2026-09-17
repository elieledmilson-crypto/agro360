import { CropManagementType } from '../../types'
import Badge from '../ui/Badge'

interface Props {
  type: CropManagementType
}

const typeVariantMap: Record<
  CropManagementType,
  'info' | 'success' | 'warning' | 'danger'
> = {
  Adubação: 'success',
  Irrigação: 'info',
  Pulverização: 'warning',
  Capina: 'info',
  'Controle de plantas daninhas': 'danger',
  'Controle de pragas': 'danger',
  'Controle de doenças': 'danger',
  'Manejo cultural': 'info',
  Outro: 'info',
}

export default function CropManagementTypeBadge({ type }: Props) {
  return (
    <Badge variant={typeVariantMap[type] ?? 'info'}>
      {type}
    </Badge>
  )
}