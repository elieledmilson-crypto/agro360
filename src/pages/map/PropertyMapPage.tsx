import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import HelpTip from '../../components/ui/HelpTip'
import PageFeedback from '../../components/ui/PageFeedback'
import PropertyMapCanvas from '../../components/map/PropertyMapCanvas'
import PropertyMapLegend from '../../components/map/PropertyMapLegend'
import PropertyMapDetails from '../../components/map/PropertyMapDetails'
import PropertyWeatherCard from '../../components/map/PropertyWeatherCard'
import SatelliteMap from '../../components/map/SatelliteMap'
import SchematicShapeControls from '../../components/map/SchematicShapeControls'
import { useAuth } from '../../hooks/useAuth'
import { userHasPermission } from '../../services/permissionService'
import { getLandAreas } from '../../services/landService'
import {
  clearPropertyMapLocation,
  generateAutoLayout,
  getLandAreaMapLayouts,
  getPropertyMapLocation,
  reconcileLayouts,
  saveLandAreaMapLayouts,
  savePropertyMapLocation,
} from '../../services/propertyMapService'
import {
  LandArea,
  LandAreaMapLayout,
  LandAreaStatus,
  LandAreaType,
  PropertyMapLocation,
} from '../../types'
import {
  Layers,
  MapPin,
  Move,
  Pencil,
  RotateCcw,
  Satellite,
} from 'lucide-react'

type ViewMode =
  | 'schematic'
  | 'satellite'

interface Filters {
  search: string
  type: LandAreaType | ''
  status: LandAreaStatus | ''
}

type FeedbackType =
  | {
      type:
        | 'success'
        | 'error'
      message: string
    }
  | null

const defaultFilters: Filters = {
  search: '',
  type: '',
  status: '',
}

const typeOptions: LandAreaType[] = [
  'Piquete',
  'Talhão',
  'Pastagem',
  'Reserva/APP',
  'Infraestrutura',
  'Área ociosa',
  'Outro',
]

const statusOptions: LandAreaStatus[] = [
  'Em uso',
  'Em descanso',
  'Em recuperação',
  'Inativa',
]

export default function PropertyMapPage() {
  const { user } = useAuth()

  const canSeeLandDetails =
    userHasPermission(
      user,
      'land',
    )

  const canSeeCrops =
    userHasPermission(
      user,
      'crops',
    )

  const [
    viewMode,
    setViewMode,
  ] =
    useState<ViewMode>(
      'schematic',
    )

  const [
    areas,
    setAreas,
  ] =
    useState<
      LandArea[]
    >([])

  const [
    persistedLayouts,
    setPersistedLayouts,
  ] =
    useState<
      LandAreaMapLayout[]
    >([])

  const [
    draftLayouts,
    setDraftLayouts,
  ] =
    useState<
      LandAreaMapLayout[] | null
    >(null)

  const [
    editMode,
    setEditMode,
  ] =
    useState(false)

  const [
    selectedAreaId,
    setSelectedAreaId,
  ] =
    useState<
      string | null
    >(null)

  const [
    filters,
    setFilters,
  ] =
    useState<Filters>(
      defaultFilters,
    )

  const [
    location,
    setLocation,
  ] =
    useState<PropertyMapLocation | null>(
      null,
    )

  const [
    locationDraft,
    setLocationDraft,
  ] =
    useState({
      latitude: '',
      longitude: '',
    })

  const [
    locationFormOpen,
    setLocationFormOpen,
  ] =
    useState(false)

  const [
    locationFeedback,
    setLocationFeedback,
  ] =
    useState<FeedbackType>(
      null,
    )

  const [
    pageFeedback,
    setPageFeedback,
  ] =
    useState<FeedbackType>(
      null,
    )

  const [
    boundariesRevision,
    setBoundariesRevision,
  ] =
    useState(0)

  useEffect(() => {
    const loadedAreas =
      getLandAreas()

    setAreas(
      loadedAreas,
    )

    const stored =
      getLandAreaMapLayouts()

    const reconciled =
      reconcileLayouts(
        loadedAreas,
        stored,
      )

    const needsPersist =
      reconciled.length !==
        stored.length ||
      reconciled.some(
        (
          layout,
          index,
        ) =>
          layout.landAreaId !==
          stored[index]
            ?.landAreaId,
      )

    if (
      needsPersist
    ) {
      saveLandAreaMapLayouts(
        reconciled,
      )
    }

    setPersistedLayouts(
      reconciled,
    )

    const loadedLocation =
      getPropertyMapLocation()

    setLocation(
      loadedLocation,
    )

    if (
      loadedLocation
    ) {
      setLocationDraft({
        latitude:
          String(
            loadedLocation.latitude,
          ),
        longitude:
          String(
            loadedLocation.longitude,
          ),
      })
    }
  }, [])

  const filteredAreas =
    useMemo(() => {
      const searchTerm =
        filters.search
          .trim()
          .toLowerCase()

      return areas.filter(
        area => {
          const matchesSearch =
            !searchTerm ||
            area.code
              .toLowerCase()
              .includes(
                searchTerm,
              ) ||
            area.name
              .toLowerCase()
              .includes(
                searchTerm,
              ) ||
            (
              area.purpose
                ?.toLowerCase()
                .includes(
                  searchTerm,
                ) ??
              false
            )

          const matchesType =
            !filters.type ||
            area.type ===
              filters.type

          const matchesStatus =
            !filters.status ||
            area.status ===
              filters.status

          return (
            matchesSearch &&
            matchesType &&
            matchesStatus
          )
        },
      )
    }, [
      areas,
      filters,
    ])

  useEffect(() => {
    if (
      viewMode !==
      'schematic'
    ) {
      return
    }

    if (
      selectedAreaId &&
      !filteredAreas.some(
        area =>
          area.id ===
          selectedAreaId,
      )
    ) {
      setSelectedAreaId(
        null,
      )
    }
  }, [
    filteredAreas,
    selectedAreaId,
    viewMode,
  ])

  const activeLayouts =
    editMode &&
    draftLayouts
      ? draftLayouts
      : persistedLayouts

  const selectedArea =
    selectedAreaId
      ? areas.find(
          area =>
            area.id ===
            selectedAreaId,
        ) ?? null
      : null

  const selectedLayout =
    selectedAreaId
      ? activeLayouts.find(
          layout =>
            layout.landAreaId ===
            selectedAreaId,
        ) ?? null
      : null

  const selectedAreaLabel =
    selectedArea
      ? `${selectedArea.code} — ${selectedArea.name}`
      : null

  function handleEnterEditMode() {
    setDraftLayouts(
      persistedLayouts.map(
        layout => ({
          ...layout,
        }),
      ),
    )

    setEditMode(true)
    setPageFeedback(null)
  }

  function handleCancelEditMode() {
    setDraftLayouts(null)
    setEditMode(false)
    setPageFeedback(null)
  }

  function handleSaveLayout() {
    if (
      !draftLayouts
    ) {
      return
    }

    try {
      saveLandAreaMapLayouts(
        draftLayouts,
      )

      setPersistedLayouts(
        draftLayouts,
      )

      setDraftLayouts(null)
      setEditMode(false)

      setPageFeedback({
        type: 'success',
        message:
          'Organização do mapa salva com sucesso.',
      })
    } catch {
      setPageFeedback({
        type: 'error',
        message:
          'Não foi possível salvar a organização do mapa.',
      })
    }
  }

  function handleRestoreAutoLayout() {
    const auto =
      generateAutoLayout(
        areas,
      )

    setDraftLayouts(auto)
    setPageFeedback(null)
  }

  function handleLayoutsChange(
    next:
      LandAreaMapLayout[],
  ) {
    if (!editMode) {
      return
    }

    setDraftLayouts(
      next,
    )
  }

  function handleSelectedLayoutChange(
    next:
      LandAreaMapLayout,
  ) {
    if (!editMode) {
      return
    }

    if (
      !draftLayouts
    ) {
      return
    }

    const updated =
      draftLayouts.map(
        layout =>
          layout.landAreaId ===
          next.landAreaId
            ? next
            : layout,
      )

    setDraftLayouts(
      updated,
    )
  }

  function handleBoundaryChange() {
    setBoundariesRevision(
      prev =>
        prev + 1,
    )
  }

  function handleOpenLocationForm() {
    setLocationFormOpen(
      open => !open,
    )

    setLocationFeedback(
      null,
    )
  }

  function handleSaveLocation() {
    const latRaw =
      locationDraft.latitude.trim()

    const lonRaw =
      locationDraft.longitude.trim()

    if (!latRaw) {
      setLocationFeedback({
        type: 'error',
        message:
          'Latitude é obrigatória.',
      })

      return
    }

    const lat =
      Number(
        latRaw.replace(
          ',',
          '.',
        ),
      )

    if (
      !Number.isFinite(
        lat,
      ) ||
      lat < -90 ||
      lat > 90
    ) {
      setLocationFeedback({
        type: 'error',
        message:
          'Latitude deve estar entre -90 e 90.',
      })

      return
    }

    if (!lonRaw) {
      setLocationFeedback({
        type: 'error',
        message:
          'Longitude é obrigatória.',
      })

      return
    }

    const lon =
      Number(
        lonRaw.replace(
          ',',
          '.',
        ),
      )

    if (
      !Number.isFinite(
        lon,
      ) ||
      lon < -180 ||
      lon > 180
    ) {
      setLocationFeedback({
        type: 'error',
        message:
          'Longitude deve estar entre -180 e 180.',
      })

      return
    }

    const newLocation:
      PropertyMapLocation =
      {
        latitude: lat,
        longitude: lon,
        updatedAt:
          new Date().toISOString(),
      }

    try {
      savePropertyMapLocation(
        newLocation,
      )

      setLocation(
        newLocation,
      )

      setLocationFeedback(
        null,
      )

      setLocationFormOpen(
        false,
      )

      setPageFeedback({
        type: 'success',
        message:
          'Localização salva com sucesso.',
      })
    } catch {
      setLocationFeedback({
        type: 'error',
        message:
          'Não foi possível salvar a localização.',
      })
    }
  }

  function handleClearLocation() {
    clearPropertyMapLocation()

    setLocation(
      null,
    )

    setLocationDraft({
      latitude: '',
      longitude: '',
    })

    setLocationFeedback(
      null,
    )

    setLocationFormOpen(
      false,
    )

    setPageFeedback({
      type: 'success',
      message:
        'Localização removida com sucesso.',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">
          Mapa da propriedade
        </h1>

        <HelpTip
          title="Para que serve o Mapa?"
          description="O Mapa permite visualizar de forma integrada as áreas da propriedade, consultar informações territoriais e, quando houver conexão com a internet, acompanhar a localização da propriedade por satélite e as condições meteorológicas da região."
        />
      </div>

      {pageFeedback && (
        <PageFeedback
          type={
            pageFeedback.type
          }
          message={
            pageFeedback.message
          }
        />
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            setViewMode(
              'schematic',
            )
          }
          className={`inline-flex items-center px-3 py-2 rounded-lg text-sm border transition ${
            viewMode ===
            'schematic'
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Layers className="w-4 h-4 mr-2" />
          Esquemático
        </button>

        <button
          type="button"
          onClick={() =>
            setViewMode(
              'satellite',
            )
          }
          className={`inline-flex items-center px-3 py-2 rounded-lg text-sm border transition ${
            viewMode ===
            'satellite'
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Satellite className="w-4 h-4 mr-2" />
          Satélite
        </button>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />

              <h2 className="text-sm font-semibold">
                Localização da propriedade
              </h2>
            </div>

            {location ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Latitude{' '}
                {location.latitude.toFixed(
                  4,
                )}{' '}
                · Longitude{' '}
                {location.longitude.toFixed(
                  4,
                )}
              </p>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Localização não configurada.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={
              handleOpenLocationForm
            }
            className="inline-flex items-center px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <Pencil className="w-4 h-4 mr-2" />

            {locationFormOpen
              ? 'Fechar'
              : location
                ? 'Editar localização'
                : 'Configurar localização'}
          </button>
        </div>

        {locationFormOpen && (
          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col text-sm">
                <span className="text-gray-700 dark:text-gray-300 mb-1">
                  Latitude (-90 a 90)
                </span>

                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    locationDraft.latitude
                  }
                  onChange={event =>
                    setLocationDraft(
                      prev => ({
                        ...prev,
                        latitude:
                          event.target.value,
                      }),
                    )
                  }
                  className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </label>

              <label className="flex flex-col text-sm">
                <span className="text-gray-700 dark:text-gray-300 mb-1">
                  Longitude (-180 a 180)
                </span>

                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    locationDraft.longitude
                  }
                  onChange={event =>
                    setLocationDraft(
                      prev => ({
                        ...prev,
                        longitude:
                          event.target.value,
                      }),
                    )
                  }
                  className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </label>
            </div>

            {locationFeedback && (
              <PageFeedback
                type={
                  locationFeedback.type
                }
                message={
                  locationFeedback.message
                }
              />
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={
                  handleSaveLocation
                }
              >
                Salvar localização
              </Button>

              {location && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    handleClearLocation
                  }
                >
                  Remover localização
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {viewMode ===
        'schematic' && (
        <>
          <Card className="p-3 text-xs text-gray-600 dark:text-gray-400">
            Esta é uma representação esquemática da propriedade e não
            corresponde a limites ou coordenadas geográficas reais. O
            tamanho visual dos blocos não representa escala geográfica
            verdadeira.
          </Card>

          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Pesquisar código, nome ou finalidade..."
                value={
                  filters.search
                }
                onChange={event =>
                  setFilters(
                    prev => ({
                      ...prev,
                      search:
                        event.target.value,
                    }),
                  )
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              <select
                value={
                  filters.type
                }
                onChange={event =>
                  setFilters(
                    prev => ({
                      ...prev,
                      type:
                        event.target
                          .value as
                          | LandAreaType
                          | '',
                    }),
                  )
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">
                  Tipo: todos
                </option>

                {typeOptions.map(
                  option => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  ),
                )}
              </select>

              <select
                value={
                  filters.status
                }
                onChange={event =>
                  setFilters(
                    prev => ({
                      ...prev,
                      status:
                        event.target
                          .value as
                          | LandAreaStatus
                          | '',
                    }),
                  )
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">
                  Situação: todas
                </option>

                {statusOptions.map(
                  option => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  ),
                )}
              </select>

              <button
                type="button"
                onClick={() =>
                  setFilters(
                    defaultFilters,
                  )
                }
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline self-center"
              >
                Limpar filtros
              </button>
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            {!editMode ? (
              <Button
                type="button"
                onClick={
                  handleEnterEditMode
                }
                disabled={
                  areas.length === 0
                }
              >
                <Move className="w-4 h-4 mr-2 inline" />
                Organizar mapa
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={
                    handleSaveLayout
                  }
                >
                  Salvar organização
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    handleCancelEditMode
                  }
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    handleRestoreAutoLayout
                  }
                >
                  <RotateCcw className="w-4 h-4 mr-2 inline" />
                  Restaurar organização automática
                </Button>
              </>
            )}
          </div>

          {areas.length ===
          0 ? (
            <Card className="p-6 text-sm text-gray-600 dark:text-gray-400">
              Nenhuma área cadastrada. Cadastre áreas no módulo de Terras
              para visualizá-las aqui.
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-3">
                <PropertyMapCanvas
                  areas={
                    filteredAreas
                  }
                  layouts={
                    activeLayouts
                  }
                  selectedAreaId={
                    selectedAreaId
                  }
                  onSelectArea={
                    setSelectedAreaId
                  }
                  editMode={
                    editMode
                  }
                  onLayoutsChange={
                    handleLayoutsChange
                  }
                />

                {filteredAreas.length ===
                  0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma área corresponde aos filtros selecionados.
                  </p>
                )}

                <PropertyMapLegend />
              </div>

              <div className="lg:col-span-1 space-y-3">
                {editMode && (
                  <SchematicShapeControls
                    layout={
                      selectedLayout
                    }
                    areaLabel={
                      selectedAreaLabel
                    }
                    onLayoutChange={
                      handleSelectedLayoutChange
                    }
                  />
                )}

                <PropertyMapDetails
                  key={`schematic-${boundariesRevision}`}
                  area={
                    selectedArea
                  }
                  canSeeLandDetails={
                    canSeeLandDetails
                  }
                  canSeeCrops={
                    canSeeCrops
                  }
                  canSeeAnimals={
                    userHasPermission(
                      user,
                      'animals',
                    )
                  }
                  canSeeMachines={
                    userHasPermission(
                      user,
                      'machines',
                    )
                  }
                  onClose={() =>
                    setSelectedAreaId(
                      null,
                    )
                  }
                />
              </div>
            </div>
          )}
        </>
      )}

      {viewMode ===
        'satellite' && (
        <>
          {location ? (
            <SatelliteMap
              location={
                location
              }
              areas={
                areas
              }
              selectedAreaId={
                selectedAreaId
              }
              onSelectArea={
                setSelectedAreaId
              }
              onBoundaryChange={
                handleBoundaryChange
              }
            />
          ) : (
            <Card className="p-6 text-sm text-gray-600 dark:text-gray-400">
              Configure a localização da propriedade antes de realizar uma
              demarcação.
            </Card>
          )}

          {selectedArea && (
            <PropertyMapDetails
              key={`satellite-${selectedArea.id}-${boundariesRevision}`}
              area={
                selectedArea
              }
              canSeeLandDetails={
                canSeeLandDetails
              }
              canSeeCrops={
                canSeeCrops
              }
              canSeeAnimals={
                userHasPermission(
                  user,
                  'animals',
                )
              }
              canSeeMachines={
                userHasPermission(
                  user,
                  'machines',
                )
              }
              onClose={() =>
                setSelectedAreaId(
                  null,
                )
              }
            />
          )}
        </>
      )}

      <PropertyWeatherCard
        latitude={
          location?.latitude ??
          null
        }
        longitude={
          location?.longitude ??
          null
        }
      />
    </div>
  )
}