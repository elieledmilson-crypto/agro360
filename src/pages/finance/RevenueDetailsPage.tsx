import { useState, useEffect, useMemo } from 'react'
import {
  useParams,
  useNavigate,
  useLocation,
} from 'react-router-dom'
import {
  getFinancialTransactionById,
  getFinancialCategoryById,
  deleteFinancialTransaction,
} from '../../services/financeService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import { formatCurrencyBRL } from '../../utils/format'
import {
  Pencil,
  Trash2,
  ArrowLeft,
} from 'lucide-react'

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function RevenueDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const [feedback, setFeedback] =
    useState<FeedbackType>(null)

  const transaction = useMemo(
    () =>
      id
        ? getFinancialTransactionById(id)
        : undefined,
    [id],
  )

  const category = useMemo(
    () =>
      transaction
        ? getFinancialCategoryById(
            transaction.categoryId,
          )
        : undefined,
    [transaction],
  )

  useEffect(() => {
    const state =
      location.state as {
        successMessage?: string
      } | null

    if (!state?.successMessage) return

    setFeedback({
      type: 'success',
      message:
        state.successMessage,
    })

    navigate(location.pathname, {
      replace: true,
      state: null,
    })
  }, [
    location.pathname,
    location.state,
    navigate,
  ])

  useEffect(() => {
    if (!feedback) return

    const timer = setTimeout(
      () => setFeedback(null),
      5000,
    )

    return () =>
      clearTimeout(timer)
  }, [feedback])

  if (
    !transaction ||
    transaction.type !==
      'Receita'
  ) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Receita não encontrada
        </p>

        <Button
          className="mt-4"
          onClick={() =>
            navigate(
              '/financeiro/receitas',
            )
          }
        >
          Voltar para receitas
        </Button>
      </div>
    )
  }

  const handleDelete = () => {
    if (
      window.confirm(
        `Excluir a receita ${transaction.description}?`,
      )
    ) {
      try {
        const deleted =
          deleteFinancialTransaction(
            transaction.id,
          )

        if (deleted) {
          navigate(
            '/financeiro/receitas',
            {
              state: {
                successMessage:
                  'Receita excluída com sucesso.',
              },
            },
          )
        } else {
          setFeedback({
            type: 'error',
            message:
              'Receita não encontrada.',
          })
        }
      } catch (error) {
        setFeedback({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao excluir receita.',
        })
      }
    }
  }

  const formatDate = (
    date: string,
  ) =>
    new Date(
      date + 'T00:00:00',
    ).toLocaleDateString(
      'pt-BR',
    )

  return (
    <div className="space-y-6">
      {feedback && (
        <PageFeedback
          type={feedback.type}
          message={feedback.message}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() =>
              navigate(
                '/financeiro/receitas',
              )
            }
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para receitas
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Receita
            </h1>

            <HelpTip
              title="O que encontro nesta página?"
              description="Aqui você consulta os dados desta receita da propriedade."
            />
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            {transaction.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              navigate(
                `/financeiro/receitas/${transaction.id}/editar`,
              )
            }
          >
            <Pencil className="w-4 h-4 mr-2 inline" />
            Editar
          </Button>

          <Button
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2 inline" />
            Excluir
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data
            </p>

            <p className="font-medium">
              {formatDate(
                transaction.date,
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Categoria
            </p>

            <p className="font-medium">
              {category?.name ??
                'Categoria não encontrada'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Valor
            </p>

            <p className="font-medium text-green-600 dark:text-green-400">
              {formatCurrencyBRL(
                transaction.amount,
              )}
            </p>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Descrição
            </p>

            <p className="font-medium">
              {transaction.description}
            </p>
          </div>
        </div>

        {transaction.notes && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Observações
            </p>

            <p className="mt-1">
              {transaction.notes}
            </p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data de cadastro
            </p>

            <p className="font-medium">
              {new Date(
                transaction.createdAt,
              ).toLocaleDateString(
                'pt-BR',
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização
            </p>

            <p className="font-medium">
              {new Date(
                transaction.updatedAt,
              ).toLocaleDateString(
                'pt-BR',
              )}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}