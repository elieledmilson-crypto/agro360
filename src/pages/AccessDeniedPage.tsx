import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function AccessDeniedPage() {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center py-16">
      <Card className="p-8 max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-bold mb-2">
          Acesso não autorizado
        </h1>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Você não possui permissão para acessar este módulo.
        </p>

        <Button
          onClick={() => navigate('/dashboard')}
          className="w-full"
        >
          Voltar ao Dashboard
        </Button>
      </Card>
    </div>
  )
}