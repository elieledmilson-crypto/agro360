import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Trash2 } from 'lucide-react'

import Card from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import { deletePropertyPermanently } from '../services/propertyService'

interface DeletePropertySectionProps {
  propertyId: string
  propertyName: string
}

export default function DeletePropertySection({
  propertyId,
  propertyName,
}: DeletePropertySectionProps) {
  const navigate = useNavigate()
  const [confirmationName, setConfirmationName] = useState('')
  const [password, setPassword] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (confirmationName.trim() !== propertyName.trim()) {
      setError('O nome digitado não corresponde ao nome da fazenda.')
      return
    }
    if (!password) {
      setError('Informe sua senha atual para confirmar sua identidade.')
      return
    }

    setLoading(true)
    try {
      await deletePropertyPermanently(propertyId, propertyName, password)
      navigate('/login', {
        replace: true,
        state: { message: 'A fazenda e todas as contas vinculadas foram excluídas permanentemente.' },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir a fazenda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 border border-red-300 dark:border-red-900">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-red-100 dark:bg-red-950 p-3">
          <AlertTriangle className="w-6 h-6 text-red-700 dark:text-red-300" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">
            Zona de perigo
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Excluir permanentemente esta fazenda e todos os dados e contas associados.
            Esta ação não pode ser desfeita.
          </p>
        </div>
      </div>

      {!expanded ? (
        <Button
          type="button"
          variant="outline"
          className="mt-5 border-red-400 text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950"
          onClick={() => setExpanded(true)}
        >
          <span className="inline-flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Excluir fazenda completamente
          </span>
        </Button>
      ) : (
        <form onSubmit={handleDelete} className="mt-5 space-y-4">
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-200">
            <p className="font-semibold">A exclusão removerá:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Todos os registros, históricos, mapas, localização e configurações da fazenda.</li>
              <li>Todos os cadastros e contas de acesso dos funcionários.</li>
              <li>Sua própria conta de proprietário/administrador e seu perfil.</li>
            </ul>
            <p className="mt-3 font-semibold">
              Depois da confirmação, nenhum usuário poderá recuperar o acesso ou os dados.
            </p>
          </div>

          <Input
            label={`Digite exatamente o nome da fazenda: ${propertyName}`}
            value={confirmationName}
            onChange={event => setConfirmationName(event.target.value)}
            autoComplete="off"
            required
          />

          <Input
            label="Sua senha atual"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            required
          />

          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              disabled={loading || confirmationName.trim() !== propertyName.trim() || !password}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Excluindo tudo...' : 'Confirmar exclusão permanente'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => {
                setExpanded(false)
                setConfirmationName('')
                setPassword('')
                setError('')
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}
