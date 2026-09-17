import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-green-600 mb-4">
          404
        </h1>

        <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
          Página não encontrada
        </p>

        <Link
          to="/dashboard"
          className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}