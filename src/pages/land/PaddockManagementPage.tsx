import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  getPaddockCount,
  getOccupiedPaddockCount,
  getAvailablePaddockCount,
  getCurrentLotsInPaddocksCount,
  getCurrentAnimalsInPaddocksCount,
  getActivePaddockOccupations,
  getPaddockOccupations,
  finishPaddockOccupation,
  getCurrentOccupationDays,
  getDaysBetween,
  getAnimalsInPaddockOccupation,
} from '../../services/paddockOccupationService'
import { getLandAreas } from '../../services/landService'
import { getLots } from '../../services/lotService'
import {
  PaddockOccupation,
  LandArea,
  Lot,
} from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FinishOccupationDialog from '../../components/land/FinishOccupationDialog'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import {
  Plus,
  Users,
  Grid3X3,
} from 'lucide-react'

export default function PaddockManagementPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [, setRefreshTrigger] =
    useState(0)

  const [finishTarget, setFinishTarget] =
    useState<PaddockOccupation | null>(
      null
    )

  const [finishError, setFinishError] =
    useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(null)

  const forceRefresh = () =>
    setRefreshTrigger(prev => prev + 1)

  const paddockCount =
    getPaddockCount()

  const occupiedCount =
    getOccupiedPaddockCount()

  const availableCount =
    getAvailablePaddockCount()

  const lotsInPaddocks =
    getCurrentLotsInPaddocksCount()

  const animalsInPaddocks =
    getCurrentAnimalsInPaddocksCount()

  const activeOccupations =
    getActivePaddockOccupations()

  const historyOccupations =
    getPaddockOccupations()
      .filter(occ => occ.exitDate)
      .sort((a, b) =>
        (
          b.exitDate ?? b.entryDate
        ).localeCompare(
          a.exitDate ?? a.entryDate
        )
      )

  const landAreas = getLandAreas()
  const lots = getLots()

  const getArea = (
    id: string
  ): LandArea | undefined =>
    landAreas.find(a => a.id === id)

  const getLot = (
    id: string
  ): Lot | undefined =>
    lots.find(l => l.id === id)

  useEffect(() => {
    const state = location.state as {
      successMessage?: string
    } | null

    if (!state?.successMessage) return

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

    return () => clearTimeout(timer)
  }, [successMessage])

  const handleFinishConfirm = (
    exitDate: string
  ) => {
    if (!finishTarget) return

    try {
      finishPaddockOccupation(
        finishTarget.id,
        exitDate
      )

      setFinishTarget(null)
      setFinishError('')
      setSuccessMessage(
        'Ocupação encerrada com sucesso.'
      )

      forceRefresh()
    } catch (error) {
      setFinishError(
        error instanceof Error
          ? error.message
          : 'Erro ao encerrar ocupação.'
      )
    }
  }

  const summaryCards = [
    {
      label: 'Total de piquetes',
      value: paddockCount.toString(),
      icon: Grid3X3,
      color:
        'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Piquetes ocupados',
      value: occupiedCount.toString(),
      icon: Grid3X3,
      color:
        'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    },
    {
      label: 'Piquetes disponíveis',
      value: availableCount.toString(),
      icon: Grid3X3,
      color:
        'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    },
    {
      label: 'Lotes em piquetes',
      value:
        lotsInPaddocks.toString(),
      icon: Users,
      color:
        'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    },
    {
      label: 'Animais em piquetes',
      value:
        animalsInPaddocks.toString(),
      icon: Users,
      color:
        'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Manejo de Piquetes
            </h1>

            <HelpTip
              title="Para que serve o manejo de piquetes?"
              description="Aqui você acompanha quais lotes estão ocupando cada piquete, o período de permanência e o histórico de movimentações."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Aloque lotes em piquetes e acompanhe o
            histórico de ocupação.
          </p>
        </div>

        <Button
          onClick={() =>
            navigate('/terras/manejo/nova')
          }
        >
          <Plus className="w-4 h-4 mr-2 inline" />
          Alocar lote em piquete
        </Button>
      </div>

      {successMessage && (
        <PageFeedback
          type="success"
          message={successMessage}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryCards.map(card => {
          const Icon = card.icon

          return (
            <Card
              key={card.label}
              className="p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {card.label}
                  </p>

                  <p className="text-2xl font-bold mt-1">
                    {card.value}
                  </p>
                </div>

                <div
                  className={`p-2 rounded-lg ${card.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">
          Ocupações atuais
        </h2>

        {activeOccupations.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhuma ocupação ativa no momento.
          </p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-4 py-3">
                      Piquete
                    </th>
                    <th className="px-4 py-3">
                      Lote
                    </th>
                    <th className="px-4 py-3">
                      Animais
                    </th>
                    <th className="px-4 py-3">
                      Entrada
                    </th>
                    <th className="px-4 py-3">
                      Dias
                    </th>
                    <th className="px-4 py-3">
                      Observações
                    </th>
                    <th className="px-4 py-3">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {activeOccupations.map(
                    occ => {
                      const area =
                        getArea(
                          occ.landAreaId
                        )

                      const lot =
                        getLot(occ.lotId)

                      const animalsCount =
                        getAnimalsInPaddockOccupation(
                          occ
                        ).length

                      return (
                        <tr
                          key={occ.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="px-4 py-3 font-medium">
                            {area?.code} —{' '}
                            {area?.name}
                          </td>

                          <td className="px-4 py-3">
                            {lot?.name ??
                              '—'}
                          </td>

                          <td className="px-4 py-3">
                            {animalsCount}
                          </td>

                          <td className="px-4 py-3">
                            {new Date(
                              occ.entryDate +
                                'T00:00:00'
                            ).toLocaleDateString(
                              'pt-BR'
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {getCurrentOccupationDays(
                              occ
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {occ.notes ??
                              '—'}
                          </td>

                          <td className="px-4 py-3">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setFinishTarget(
                                  occ
                                )
                                setFinishError(
                                  ''
                                )
                              }}
                              className="text-xs"
                            >
                              Encerrar
                              ocupação
                            </Button>
                          </td>
                        </tr>
                      )
                    }
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden grid grid-cols-1 gap-4">
              {activeOccupations.map(
                occ => {
                  const area =
                    getArea(
                      occ.landAreaId
                    )

                  const lot =
                    getLot(occ.lotId)

                  const animalsCount =
                    getAnimalsInPaddockOccupation(
                      occ
                    ).length

                  return (
                    <Card
                      key={occ.id}
                      className="p-4"
                    >
                      <p className="font-medium">
                        {area?.code} —{' '}
                        {area?.name}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Lote:{' '}
                        {lot?.name ?? '—'}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Animais:{' '}
                        {animalsCount}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Entrada:{' '}
                        {new Date(
                          occ.entryDate +
                            'T00:00:00'
                        ).toLocaleDateString(
                          'pt-BR'
                        )}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Dias:{' '}
                        {getCurrentOccupationDays(
                          occ
                        )}
                      </p>

                      {occ.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Obs: {occ.notes}
                        </p>
                      )}

                      <div className="mt-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setFinishTarget(
                              occ
                            )
                            setFinishError(
                              ''
                            )
                          }}
                          className="text-xs"
                        >
                          Encerrar
                          ocupação
                        </Button>
                      </div>
                    </Card>
                  )
                }
              )}
            </div>
          </>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">
          Histórico de ocupações
        </h2>

        {historyOccupations.length ===
        0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhuma ocupação encerrada ainda.
          </p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-4 py-3">
                      Piquete
                    </th>
                    <th className="px-4 py-3">
                      Lote
                    </th>
                    <th className="px-4 py-3">
                      Entrada
                    </th>
                    <th className="px-4 py-3">
                      Saída
                    </th>
                    <th className="px-4 py-3">
                      Duração
                    </th>
                    <th className="px-4 py-3">
                      Observações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {historyOccupations.map(
                    occ => {
                      const area =
                        getArea(
                          occ.landAreaId
                        )

                      const lot =
                        getLot(occ.lotId)

                      return (
                        <tr
                          key={occ.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="px-4 py-3 font-medium">
                            {area?.code} —{' '}
                            {area?.name}
                          </td>

                          <td className="px-4 py-3">
                            {lot?.name ??
                              '—'}
                          </td>

                          <td className="px-4 py-3">
                            {new Date(
                              occ.entryDate +
                                'T00:00:00'
                            ).toLocaleDateString(
                              'pt-BR'
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {occ.exitDate
                              ? new Date(
                                  occ.exitDate +
                                    'T00:00:00'
                                ).toLocaleDateString(
                                  'pt-BR'
                                )
                              : '—'}
                          </td>

                          <td className="px-4 py-3">
                            {occ.exitDate
                              ? getDaysBetween(
                                  occ.entryDate,
                                  occ.exitDate
                                )
                              : '—'}
                          </td>

                          <td className="px-4 py-3">
                            {occ.notes ??
                              '—'}
                          </td>
                        </tr>
                      )
                    }
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden grid grid-cols-1 gap-4">
              {historyOccupations.map(
                occ => {
                  const area =
                    getArea(
                      occ.landAreaId
                    )

                  const lot =
                    getLot(occ.lotId)

                  return (
                    <Card
                      key={occ.id}
                      className="p-4"
                    >
                      <p className="font-medium">
                        {area?.code} —{' '}
                        {area?.name}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Lote:{' '}
                        {lot?.name ?? '—'}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Entrada:{' '}
                        {new Date(
                          occ.entryDate +
                            'T00:00:00'
                        ).toLocaleDateString(
                          'pt-BR'
                        )}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Saída:{' '}
                        {occ.exitDate
                          ? new Date(
                              occ.exitDate +
                                'T00:00:00'
                            ).toLocaleDateString(
                              'pt-BR'
                            )
                          : '—'}
                      </p>

                      {occ.exitDate && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Duração:{' '}
                          {getDaysBetween(
                            occ.entryDate,
                            occ.exitDate
                          )}{' '}
                          dias
                        </p>
                      )}

                      {occ.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Obs: {occ.notes}
                        </p>
                      )}
                    </Card>
                  )
                }
              )}
            </div>
          </>
        )}
      </Card>

      <FinishOccupationDialog
        open={!!finishTarget}
        onClose={() => {
          setFinishTarget(null)
          setFinishError('')
        }}
        onConfirm={handleFinishConfirm}
        occupationInfo={
          finishTarget
            ? {
                paddockCode:
                  getArea(
                    finishTarget.landAreaId
                  )?.code ?? '—',

                paddockName:
                  getArea(
                    finishTarget.landAreaId
                  )?.name ?? '—',

                lotName:
                  getLot(
                    finishTarget.lotId
                  )?.name ?? '—',

                entryDate:
                  finishTarget.entryDate,
              }
            : null
        }
        submitError={finishError}
        onClearSubmitError={() =>
          setFinishError('')
        }
      />
    </div>
  )
}