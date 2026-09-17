import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      hasError: false,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(
    error: Error,
    errorInfo: ErrorInfo,
  ) {
    console.error(
      'Erro capturado pelo ErrorBoundary:',
      error,
      errorInfo,
    )
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Ops! Algo deu errado
            </h1>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Ocorreu um erro inesperado. Tente recarregar a
              página.
            </p>

            <pre className="text-xs text-left bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto mb-4">
              {this.state.error?.message}
            </pre>

            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Recarregar página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}