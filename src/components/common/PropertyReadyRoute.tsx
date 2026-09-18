import {
  useEffect,
  useState,
} from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  initializeStorageBackend,
  isStorageBackendReady,
} from '../../services/storage'

type LoadState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'error'

export function PropertyReadyRoute() {
  const { user, isLoading } = useAuth()
  const [loadState, setLoadState] =
    useState<LoadState>(
      isStorageBackendReady()
        ? 'ready'
        : 'idle',
    )
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.propertyId) {
      return
    }

    let active = true

    setLoadState('loading')
    setError('')

    void initializeStorageBackend(
      user.propertyId,
      user.id,
    )
      .then(() => {
        if (active) {
          setLoadState('ready')
        }
      })
      .catch(err => {
        if (!active) {
          return
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar os dados da propriedade.',
        )
        setLoadState('error')
      })

    return () => {
      active = false
    }
  }, [user?.id, user?.propertyId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600 dark:text-gray-300">
        Carregando propriedade...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!user.propertyId) {
    return (
      <Navigate
        to="/configuracao-inicial"
        replace
      />
    )
  }

  if (
    loadState === 'idle' ||
    loadState === 'loading'
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600 dark:text-gray-300">
        Carregando dados da propriedade...
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-xl border border-red-200 dark:border-red-900 bg-white dark:bg-gray-900 p-6">
          <h1 className="text-lg font-semibold mb-2">
            Falha ao carregar a propriedade
          </h1>

          <p className="text-sm text-red-600 dark:text-red-300 mb-4">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return <Outlet />
}
