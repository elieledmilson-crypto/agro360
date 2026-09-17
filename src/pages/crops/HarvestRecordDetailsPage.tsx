import {
  useState,
  useEffect,
} from 'react'
import {
  useParams,
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom'
import {
  getHarvestRecordById,
  getHarvestProductionKg,
  getHarvestProductivityKgPerHectare,
  getHarvestProductivityInOriginalUnitPerHectare,
} from '../../services/harvestService'
import { getCropCycleById } from '../../services/cropService'
import { getLandAreaById } from '../../services/landService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import {
  Pencil,
  ArrowLeft,
} from 'lucide-react'

export default function HarvestRecordDetailsPage() {
  const { id } = useParams<{
    id: string
  }>()

  const navigate = useNavigate()
  const location = useLocation()

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(null)

  const record = id
    ? getHarvestRecordById(id)
    : undefined

  const cropCycle = record
    ? getCropCycleById(
        record.cropCycleId
      )
    : undefined

  const area = cropCycle
    ? getLandAreaById(
        cropCycle.landAreaId
      )
    : undefined

  useEffect(() => {
    const state = location.state as {
      successMessage?: string
    } | null

    if (!state?.successMessage) {
      return
    }

    setSuccessMessage(
      state.successMessage
    )

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
    if (!successMessage) return

    const timer = setTimeout(
      () => setSuccessMessage(null),
      5000
    )

    return () =>
      clearTimeout(timer)
  }, [successMessage])

  if (!record) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Colheita não encontrada
        </p>

        <Button
          className="mt-4"
          onClick={() =>
            navigate(
              '/cultivos/colheitas'
            )
          }
        >
          Voltar para colheitas
        </Button>
      </div>
    )
  }

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return 'Não informada'
    }

    return new Date(
      date + 'T00:00:00'
    ).toLocaleDateString('pt-BR')
  }

  const formatNumber = (
    value: number
  ) =>
    value.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })

  const productionKg =
    getHarvestProductionKg(record)

  const productivityOriginal =
    getHarvestProductivityInOriginalUnitPerHectare(
      record
    )

  const productivityKgPerHa =
    getHarvestProductivityKgPerHectare(
      record
    )

  return (
    <div className="space-y-6">
      {successMessage && (
        <PageFeedback
          type="success"
          message={successMessage}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() =>
              navigate(
                '/cultivos/colheitas'
              )
            }
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para colheitas
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Registro de colheita
            </h1>

            <HelpTip
              title="O que encontro nesta página?"
              description="Aqui você consulta os dados desta colheita, como talhão, cultivo, área colhida, produção e produtividade."
            />
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            {formatDate(
              record.harvestDate
            )}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() =>
            navigate(
              `/cultivos/colheitas/${record.id}/editar`
            )
          }
        >
          <Pencil className="w-4 h-4 mr-2 inline" />
          Editar
        </Button>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data da colheita
            </p>

            <p className="font-medium">
              {formatDate(
                record.harvestDate
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Talhão
            </p>

            {area ? (
              <Link
                to={`/terras/${area.id}`}
                className="font-medium text-green-600 hover:underline"
              >
                {area.code} —{' '}
                {area.name}
              </Link>
            ) : (
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Área não encontrada
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cultivo
            </p>

            {cropCycle ? (
              <Link
                to={`/cultivos/${cropCycle.id}`}
                className="font-medium text-green-600 hover:underline"
              >
                {cropCycle.crop}
              </Link>
            ) : (
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Cultivo não encontrado
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cultivar
            </p>

            <p className="font-medium">
              {cropCycle?.cultivar ??
                'Não informada'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Safra
            </p>

            <p className="font-medium">
              {cropCycle?.season ??
                'Não informada'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Área colhida
            </p>

            <p className="font-medium">
              {formatNumber(
                record.harvestedAreaHectares
              )}{' '}
              ha
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Produção total
            </p>

            <p className="font-medium">
              {formatNumber(
                record.productionQuantity
              )}{' '}
              {record.productionUnit}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Unidade
            </p>

            <p className="font-medium">
              {record.productionUnit}
            </p>
          </div>

          {record.productionUnit ===
            'sc' &&
            record.sackWeightKg && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Peso da saca
                </p>

                <p className="font-medium">
                  {formatNumber(
                    record.sackWeightKg
                  )}{' '}
                  kg
                </p>
              </div>
            )}

          <div>
            <div className="flex flex-wrap items-center gap-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Produção normalizada
              </p>

              <HelpTip
                title="O que significa produção normalizada?"
                description="É a produção convertida para quilogramas, permitindo comparar registros que foram informados em unidades diferentes."
              />
            </div>

            <p className="font-medium">
              {formatNumber(
                productionKg
              )}{' '}
              kg
            </p>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Produtividade (unidade
                original)
              </p>

              <HelpTip
                title="O que é produtividade?"
                description="É a quantidade produzida em relação à área colhida. Ela ajuda a comparar o resultado de diferentes cultivos e talhões."
              />
            </div>

            <p className="font-medium">
              {formatNumber(
                productivityOriginal
              )}{' '}
              {record.productionUnit}/ha
            </p>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Produtividade normalizada
              </p>

              <HelpTip
                title="O que significa produtividade normalizada?"
                description="É a produtividade convertida para quilogramas por hectare (kg/ha), facilitando a comparação entre colheitas registradas em unidades diferentes."
              />
            </div>

            <p className="font-medium">
              {formatNumber(
                productivityKgPerHa
              )}{' '}
              kg/ha
            </p>
          </div>
        </div>

        {record.notes && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Observações
            </p>

            <p className="mt-1">
              {record.notes}
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
                record.createdAt
              ).toLocaleDateString(
                'pt-BR'
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização
            </p>

            <p className="font-medium">
              {new Date(
                record.updatedAt
              ).toLocaleDateString(
                'pt-BR'
              )}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}