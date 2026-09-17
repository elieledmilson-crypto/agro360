import {
  GeographicPoint,
  LandArea,
  LandAreaGeographicBoundary,
  LandAreaType,
  PropertyGeographicBoundary,
} from '../../types'
import Card from '../ui/Card'
import Button from '../ui/Button'
import PageFeedback from '../ui/PageFeedback'
import {
  Check,
  Pencil,
  RotateCcw,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'

export type SatelliteVisualizationMode =
  | 'property'
  | 'lands'
  | 'type'
  | 'individual'

type DrawTarget =
  | 'property'
  | string
  | null

type EditTarget =
  | 'property'
  | string
  | null

type PendingAction =
  | {
      kind:
        | 'delete'
        | 'replace'
      target:
        | 'property'
        | string
    }
  | null

type Feedback =
  | {
      type:
        | 'success'
        | 'error'
      message: string
    }
  | null

interface Props {
  areas: LandArea[]
  propertyBoundary: PropertyGeographicBoundary | null
  propertyArea: number
  landAreaBoundaries: LandAreaGeographicBoundary[]

  visualizationMode: SatelliteVisualizationMode
  onVisualizationModeChange: (
    mode: SatelliteVisualizationMode,
  ) => void

  selectedType: LandAreaType | ''
  onSelectedTypeChange: (
    type: LandAreaType | '',
  ) => void

  individualAreaId: string
  onIndividualAreaIdChange: (
    id: string,
  ) => void

  visibleBoundaryCount: number
  visibleAreaHectares: number

  showLengths: boolean
  onToggleLengths: () => void
  onFitView: () => void
  hasVisibleMeasurements: boolean

  selectedAreaForDraw: string
  onSelectedAreaForDrawChange: (
    id: string,
  ) => void

  drawTarget: DrawTarget
  drawPoints: GeographicPoint[]
  draftArea: number

  editTarget: EditTarget
  editPoints: GeographicPoint[]
  editArea: number

  pendingAction: PendingAction
  feedback: Feedback

  onStartDrawProperty: () => void
  onStartDrawLandArea: () => void
  onUndoDrawPoint: () => void
  onFinishDraw: () => void
  onCancelDraw: () => void
  onStartEdit: (
    target:
      | 'property'
      | string,
  ) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onRequestDelete: (
    target:
      | 'property'
      | string,
  ) => void
  onConfirmPending: () => void
  onCancelPending: () => void
}

const LAND_AREA_TYPES: LandAreaType[] = [
  'Piquete',
  'Talhão',
  'Pastagem',
  'Reserva/APP',
  'Infraestrutura',
  'Área ociosa',
  'Outro',
]

function formatHectares(
  value: number,
): string {
  return (
    value.toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits:
          2,
        maximumFractionDigits:
          2,
      },
    ) + ' ha'
  )
}

function formatSquareMeters(
  value: number,
): string {
  return (
    value.toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits:
          2,
        maximumFractionDigits:
          2,
      },
    ) + ' m²'
  )
}

function hectaresToSquareMeters(
  hectares: number,
): number {
  if (
    !Number.isFinite(
      hectares,
    )
  ) {
    return 0
  }

  return Math.max(
    0,
    hectares * 10000,
  )
}

function targetLabel(
  target:
    | 'property'
    | string,
  areas: LandArea[],
): string {
  if (
    target ===
    'property'
  ) {
    return 'propriedade'
  }

  const area =
    areas.find(
      item =>
        item.id ===
        target,
    )

  return area
    ? `${area.code} — ${area.name}`
    : 'área'
}

export default function SatelliteBoundaryPanel({
  areas,
  propertyBoundary,
  propertyArea,
  landAreaBoundaries,

  visualizationMode,
  onVisualizationModeChange,

  selectedType,
  onSelectedTypeChange,

  individualAreaId,
  onIndividualAreaIdChange,

  visibleBoundaryCount,
  visibleAreaHectares,

  showLengths,
  onToggleLengths,
  onFitView,
  hasVisibleMeasurements,

  selectedAreaForDraw,
  onSelectedAreaForDrawChange,

  drawTarget,
  drawPoints,
  draftArea,

  editTarget,
  editPoints,
  editArea,

  pendingAction,
  feedback,

  onStartDrawProperty,
  onStartDrawLandArea,
  onUndoDrawPoint,
  onFinishDraw,
  onCancelDraw,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRequestDelete,
  onConfirmPending,
  onCancelPending,
}: Props) {
  const isDrawing =
    drawTarget !== null

  const isEditing =
    editTarget !== null

  const isPending =
    pendingAction !== null

  const demarcatedAreaIds =
    new Set(
      landAreaBoundaries.map(
        boundary =>
          boundary.landAreaId,
      ),
    )

  const individualAreas =
    areas.filter(
      area =>
        demarcatedAreaIds.has(
          area.id,
        ),
    )

  const visibleAreaM2 =
    hectaresToSquareMeters(
      visibleAreaHectares,
    )

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">
            Visualização do mapa
          </h2>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Escolha quais demarcações deseja visualizar no satélite.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              onVisualizationModeChange(
                'property',
              )
            }
            className={`px-3 py-2 rounded-lg border text-sm transition ${
              visualizationMode ===
              'property'
                ? 'bg-green-600 border-green-600 text-white'
                : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Área total
          </button>

          <button
            type="button"
            onClick={() =>
              onVisualizationModeChange(
                'lands',
              )
            }
            className={`px-3 py-2 rounded-lg border text-sm transition ${
              visualizationMode ===
              'lands'
                ? 'bg-green-600 border-green-600 text-white'
                : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Terras
          </button>

          <button
            type="button"
            onClick={() =>
              onVisualizationModeChange(
                'type',
              )
            }
            className={`px-3 py-2 rounded-lg border text-sm transition ${
              visualizationMode ===
              'type'
                ? 'bg-green-600 border-green-600 text-white'
                : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Por tipo
          </button>

          <button
            type="button"
            onClick={() =>
              onVisualizationModeChange(
                'individual',
              )
            }
            className={`px-3 py-2 rounded-lg border text-sm transition ${
              visualizationMode ===
              'individual'
                ? 'bg-green-600 border-green-600 text-white'
                : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Área individual
          </button>
        </div>

        {visualizationMode ===
          'type' && (
          <label className="block text-sm">
            <span className="block mb-1 text-xs text-gray-600 dark:text-gray-400">
              Tipo de terra
            </span>

            <select
              value={
                selectedType
              }
              onChange={event =>
                onSelectedTypeChange(
                  event.target
                    .value as
                    | LandAreaType
                    | '',
                )
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">
                Selecione um tipo
              </option>

              {LAND_AREA_TYPES.map(
                type => (
                  <option
                    key={
                      type
                    }
                    value={
                      type
                    }
                  >
                    {type}
                  </option>
                ),
              )}
            </select>
          </label>
        )}

        {visualizationMode ===
          'individual' && (
          <label className="block text-sm">
            <span className="block mb-1 text-xs text-gray-600 dark:text-gray-400">
              Área demarcada
            </span>

            <select
              value={
                individualAreaId
              }
              onChange={event =>
                onIndividualAreaIdChange(
                  event.target
                    .value,
                )
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">
                Selecione uma área
              </option>

              {individualAreas.map(
                area => (
                  <option
                    key={
                      area.id
                    }
                    value={
                      area.id
                    }
                  >
                    {
                      area.code
                    }{' '}
                    —{' '}
                    {
                      area.name
                    }
                  </option>
                ),
              )}
            </select>

            {individualAreas.length ===
              0 && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Nenhuma área possui demarcação no satélite.
              </p>
            )}
          </label>
        )}

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Demarcações visíveis
          </p>

          <p className="text-sm font-medium">
            {visibleBoundaryCount}
          </p>

          {hasVisibleMeasurements && (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                Área da visualização
              </p>

              <p className="text-sm font-medium">
                {formatHectares(
                  visibleAreaHectares,
                )}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatSquareMeters(
                  visibleAreaM2,
                )}
              </p>

              {visualizationMode !==
                'property' &&
                visualizationMode !==
                  'individual' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                    Este valor é a soma das áreas demarcadas atualmente visíveis e não representa necessariamente a área total da propriedade.
                  </p>
                )}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={
              onFitView
            }
            disabled={
              !hasVisibleMeasurements
            }
          >
            Enquadrar seleção
          </Button>

          <Button
            variant="outline"
            onClick={
              onToggleLengths
            }
            disabled={
              !hasVisibleMeasurements
            }
          >
            {showLengths
              ? 'Ocultar comprimentos'
              : 'Ver comprimentos'}
          </Button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Quando os comprimentos estiverem ativados, o mapa exibirá a
          distância aproximada entre cada vértice consecutivo da
          demarcação.
        </p>
      </Card>

      <Card className="p-4 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">
            Demarcação
          </h2>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Desenhe os limites da propriedade e das áreas sobre a imagem
            de satélite.
          </p>
        </div>

        {feedback && (
          <PageFeedback
            type={
              feedback.type
            }
            message={
              feedback.message
            }
          />
        )}

        {isPending &&
          pendingAction && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 space-y-2">
              <p className="text-sm">
                {pendingAction.kind ===
                'delete'
                  ? `Tem certeza que deseja excluir esta demarcação de ${targetLabel(
                      pendingAction.target,
                      areas,
                    )}?`
                  : `Já existe uma demarcação de ${targetLabel(
                      pendingAction.target,
                      areas,
                    )}. Deseja substituí-la?`}
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={
                    onCancelPending
                  }
                >
                  Cancelar
                </Button>

                <Button
                  onClick={
                    onConfirmPending
                  }
                  className={
                    pendingAction.kind ===
                    'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : ''
                  }
                >
                  {pendingAction.kind ===
                  'delete'
                    ? 'Excluir'
                    : 'Substituir demarcação'}
                </Button>
              </div>
            </div>
          )}

        {!isPending &&
          isDrawing && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-sm space-y-1">
                <p className="font-medium">
                  Desenhando:{' '}
                  {targetLabel(
                    drawTarget,
                    areas,
                  )}
                </p>

                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Clique no mapa para adicionar vértices.
                </p>

                <p className="text-xs">
                  Pontos:{' '}
                  {
                    drawPoints.length
                  }
                </p>

                {drawPoints.length >=
                  3 && (
                  <>
                    <p className="text-xs">
                      Área provisória:{' '}
                      {formatHectares(
                        draftArea,
                      )}
                    </p>

                    <p className="text-xs">
                      {formatSquareMeters(
                        hectaresToSquareMeters(
                          draftArea,
                        ),
                      )}
                    </p>
                  </>
                )}
              </div>

              {drawPoints.length <
                3 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Adicione pelo menos 3 pontos para finalizar a demarcação.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={
                    onUndoDrawPoint
                  }
                  disabled={
                    drawPoints.length ===
                    0
                  }
                >
                  <Undo2 className="w-4 h-4 mr-2 inline" />
                  Desfazer último ponto
                </Button>

                <Button
                  onClick={
                    onFinishDraw
                  }
                  disabled={
                    drawPoints.length <
                    3
                  }
                >
                  <Check className="w-4 h-4 mr-2 inline" />
                  Finalizar demarcação
                </Button>

                <Button
                  variant="outline"
                  onClick={
                    onCancelDraw
                  }
                >
                  <X className="w-4 h-4 mr-2 inline" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

        {!isPending &&
          !isDrawing &&
          isEditing && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-sm space-y-1">
                <p className="font-medium">
                  Editando:{' '}
                  {targetLabel(
                    editTarget,
                    areas,
                  )}
                </p>

                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Arraste os marcadores para ajustar os vértices.
                </p>

                <p className="text-xs">
                  Pontos:{' '}
                  {
                    editPoints.length
                  }
                </p>

                <p className="text-xs">
                  Área atual:{' '}
                  {formatHectares(
                    editArea,
                  )}
                </p>

                <p className="text-xs">
                  {formatSquareMeters(
                    hectaresToSquareMeters(
                      editArea,
                    ),
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={
                    onSaveEdit
                  }
                >
                  Salvar alterações
                </Button>

                <Button
                  variant="outline"
                  onClick={
                    onCancelEdit
                  }
                >
                  Cancelar edição
                </Button>
              </div>
            </div>
          )}

        {!isPending &&
          !isDrawing &&
          !isEditing && (
            <div className="space-y-4">
              <section className="space-y-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Propriedade
                </p>

                {propertyBoundary ? (
                  <>
                    <div>
                      <p className="text-sm">
                        Área demarcada da propriedade
                      </p>

                      <p className="font-medium">
                        {formatHectares(
                          propertyArea,
                        )}
                      </p>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatSquareMeters(
                          hectaresToSquareMeters(
                            propertyArea,
                          ),
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          onStartEdit(
                            'property',
                          )
                        }
                      >
                        <Pencil className="w-4 h-4 mr-2 inline" />
                        Editar demarcação
                      </Button>

                      <Button
                        variant="outline"
                        onClick={
                          onStartDrawProperty
                        }
                      >
                        <RotateCcw className="w-4 h-4 mr-2 inline" />
                        Refazer demarcação
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() =>
                          onRequestDelete(
                            'property',
                          )
                        }
                        className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="w-4 h-4 mr-2 inline" />
                        Excluir demarcação
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    onClick={
                      onStartDrawProperty
                    }
                  >
                    Demarcar propriedade
                  </Button>
                )}
              </section>

              <section className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Áreas
                </p>

                {areas.length ===
                0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma área cadastrada.
                  </p>
                ) : (
                  <>
                    <select
                      value={
                        selectedAreaForDraw
                      }
                      onChange={event =>
                        onSelectedAreaForDrawChange(
                          event.target
                            .value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">
                        Selecione uma área
                      </option>

                      {areas.map(
                        area => (
                          <option
                            key={
                              area.id
                            }
                            value={
                              area.id
                            }
                          >
                            {
                              area.code
                            }{' '}
                            —{' '}
                            {
                              area.name
                            }
                          </option>
                        ),
                      )}
                    </select>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {
                        landAreaBoundaries.length
                      }{' '}
                      demarcação(ões) salva(s)
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={
                          onStartDrawLandArea
                        }
                        disabled={
                          !selectedAreaForDraw
                        }
                      >
                        Demarcar área
                      </Button>

                      {selectedAreaForDraw &&
                        landAreaBoundaries.some(
                          boundary =>
                            boundary.landAreaId ===
                            selectedAreaForDraw,
                        ) && (
                          <>
                            <Button
                              variant="outline"
                              onClick={() =>
                                onStartEdit(
                                  selectedAreaForDraw,
                                )
                              }
                            >
                              <Pencil className="w-4 h-4 mr-2 inline" />
                              Editar demarcação
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() =>
                                onRequestDelete(
                                  selectedAreaForDraw,
                                )
                              }
                              className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
                            >
                              <Trash2 className="w-4 h-4 mr-2 inline" />
                              Excluir demarcação
                            </Button>
                          </>
                        )}
                    </div>
                  </>
                )}
              </section>
            </div>
          )}

        <p className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-3">
          A área calculada pelo mapa é uma estimativa baseada na
          demarcação realizada sobre a imagem de satélite. Ela não
          substitui levantamento topográfico, georreferenciamento
          certificado ou medição profissional.
        </p>
      </Card>
    </div>
  )
}