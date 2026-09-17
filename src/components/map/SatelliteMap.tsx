import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  GeographicPoint,
  LandArea,
  LandAreaGeographicBoundary,
  LandAreaType,
  PropertyGeographicBoundary,
  PropertyMapLocation,
} from '../../types'
import {
  calculateGeographicAreaHectares,
  calculateGeographicDistanceMeters,
  clearPropertyGeographicBoundary,
  deleteLandAreaGeographicBoundary,
  getLandAreaGeographicBoundaries,
  getPropertyGeographicBoundary,
  saveLandAreaGeographicBoundary,
  savePropertyGeographicBoundary,
} from '../../services/propertyMapService'
import SatelliteBoundaryPanel, {
  SatelliteVisualizationMode,
} from './SatelliteBoundaryPanel'
import PageFeedback from '../ui/PageFeedback'
import Button from '../ui/Button'
import { Crosshair } from 'lucide-react'

// ---------------------------------------------------------------------------
// Configuração da camada externa de imagens de satélite.
// Provedor: Esri World Imagery.
// O zoom é limitado para evitar níveis nos quais a fonte pode retornar
// blocos "Map data not yet available".
// ---------------------------------------------------------------------------

const SATELLITE_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

const SATELLITE_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'

const DEFAULT_ZOOM = 15
const MAX_SATELLITE_ZOOM = 18

const PROPERTY_MARKER_ICON = L.divIcon({
  className: 'agro360-property-marker',
  html:
    '<div style="width:20px;height:20px;border-radius:50%;background:#16a34a;border:3px solid #fff;box-shadow:0 0 0 2px #16a34a;"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const VERTEX_ICON = L.divIcon({
  className: 'agro360-vertex',
  html:
    '<div style="width:10px;height:10px;border-radius:50%;background:#f59e0b;border:2px solid #fff;"></div>',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
})

const VERTEX_DRAGGABLE_ICON = L.divIcon({
  className: 'agro360-vertex-draggable',
  html:
    '<div style="width:14px;height:14px;border-radius:50%;background:#f59e0b;border:2px solid #fff;box-shadow:0 0 0 1px #f59e0b;cursor:grab;"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

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
  location: PropertyMapLocation
  areas: LandArea[]
  selectedAreaId: string | null
  onSelectArea: (
    id:
      | string
      | null,
  ) => void
  onBoundaryChange: () => void
}

function formatDistanceMeters(
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
    ) + ' m'
  )
}

function getSegmentMidpoint(
  start: GeographicPoint,
  end: GeographicPoint,
): L.LatLngTuple {
  let lon1 =
    start.longitude

  let lon2 =
    end.longitude

  const rawDifference =
    lon2 - lon1

  if (
    rawDifference > 180
  ) {
    lon1 += 360
  } else if (
    rawDifference < -180
  ) {
    lon2 += 360
  }

  let longitude =
    (lon1 + lon2) / 2

  while (
    longitude > 180
  ) {
    longitude -= 360
  }

  while (
    longitude < -180
  ) {
    longitude += 360
  }

  return [
    (
      start.latitude +
      end.latitude
    ) / 2,
    longitude,
  ]
}

export default function SatelliteMap({
  location,
  areas,
  selectedAreaId,
  onSelectArea,
  onBoundaryChange,
}: Props) {
  const containerRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const mapRef =
    useRef<L.Map | null>(
      null,
    )

  const initialLocationRef =
    useRef(location)

  const propertyMarkerRef =
    useRef<L.Marker | null>(
      null,
    )

  const propertyPolygonRef =
    useRef<L.Polygon | null>(
      null,
    )

  const landAreaPolygonsRef =
    useRef<
      Map<
        string,
        L.Polygon
      >
    >(
      new Map(),
    )

  const draftPolylineRef =
    useRef<L.Polyline | null>(
      null,
    )

  const draftPolygonRef =
    useRef<L.Polygon | null>(
      null,
    )

  const draftMarkersRef =
    useRef<L.Marker[]>(
      [],
    )

  const editPolygonRef =
    useRef<L.Polygon | null>(
      null,
    )

  const editMarkersRef =
    useRef<L.Marker[]>(
      [],
    )

  const lengthLabelsRef =
    useRef<L.Tooltip[]>(
      [],
    )

  const [
    propertyBoundary,
    setPropertyBoundary,
  ] =
    useState<PropertyGeographicBoundary | null>(
      null,
    )

  const [
    landAreaBoundaries,
    setLandAreaBoundaries,
  ] =
    useState<
      LandAreaGeographicBoundary[]
    >([])

  const [
    visualizationMode,
    setVisualizationMode,
  ] =
    useState<SatelliteVisualizationMode>(
      'property',
    )

  const [
    selectedType,
    setSelectedType,
  ] =
    useState<
      LandAreaType | ''
    >('')

  const [
    individualAreaId,
    setIndividualAreaId,
  ] =
    useState('')

  const [
    showLengths,
    setShowLengths,
  ] =
    useState(false)

  const [
    drawTarget,
    setDrawTarget,
  ] =
    useState<DrawTarget>(
      null,
    )

  const [
    drawPoints,
    setDrawPoints,
  ] =
    useState<
      GeographicPoint[]
    >([])

  const [
    editTarget,
    setEditTarget,
  ] =
    useState<EditTarget>(
      null,
    )

  const [
    editPoints,
    setEditPoints,
  ] =
    useState<
      GeographicPoint[]
    >([])

  const [
    pendingAction,
    setPendingAction,
  ] =
    useState<PendingAction>(
      null,
    )

  const [
    feedback,
    setFeedback,
  ] =
    useState<Feedback>(
      null,
    )

  const [
    selectedAreaForDraw,
    setSelectedAreaForDraw,
  ] =
    useState('')

  const [
    tileError,
    setTileError,
  ] =
    useState(false)

  const drawTargetRef =
    useRef<DrawTarget>(
      drawTarget,
    )

  const editTargetRef =
    useRef<EditTarget>(
      editTarget,
    )

  const editPointsRef =
    useRef<
      GeographicPoint[]
    >(
      editPoints,
    )

  useEffect(() => {
    drawTargetRef.current =
      drawTarget
  }, [drawTarget])

  useEffect(() => {
    editTargetRef.current =
      editTarget
  }, [editTarget])

  useEffect(() => {
    editPointsRef.current =
      editPoints
  }, [editPoints])

  // -------------------- Carregamento inicial --------------------

  useEffect(() => {
    setPropertyBoundary(
      getPropertyGeographicBoundary(),
    )

    setLandAreaBoundaries(
      getLandAreaGeographicBoundaries(),
    )
  }, [])

  // -------------------- Demarcações visíveis --------------------

  const visibleLandAreaBoundaries =
    useMemo(() => {
      if (
        visualizationMode ===
        'property'
      ) {
        return []
      }

      if (
        visualizationMode ===
        'lands'
      ) {
        return landAreaBoundaries.filter(
          boundary =>
            areas.some(
              area =>
                area.id ===
                boundary.landAreaId,
            ),
        )
      }

      if (
        visualizationMode ===
        'type'
      ) {
        if (
          !selectedType
        ) {
          return []
        }

        return landAreaBoundaries.filter(
          boundary => {
            const area =
              areas.find(
                item =>
                  item.id ===
                  boundary.landAreaId,
              )

            return (
              area?.type ===
              selectedType
            )
          },
        )
      }

      if (
        !individualAreaId
      ) {
        return []
      }

      const individualBoundary =
        landAreaBoundaries.find(
          boundary =>
            boundary.landAreaId ===
            individualAreaId,
        )

      return individualBoundary
        ? [
            individualBoundary,
          ]
        : []
    }, [
      visualizationMode,
      landAreaBoundaries,
      areas,
      selectedType,
      individualAreaId,
    ])

  const propertyArea =
    useMemo(
      () =>
        propertyBoundary
          ? calculateGeographicAreaHectares(
              propertyBoundary.points,
            )
          : 0,
      [propertyBoundary],
    )

  const visibleAreaHectares =
    useMemo(() => {
      if (
        visualizationMode ===
        'property'
      ) {
        return propertyArea
      }

      return visibleLandAreaBoundaries.reduce(
        (
          total,
          boundary,
        ) =>
          total +
          calculateGeographicAreaHectares(
            boundary.points,
          ),
        0,
      )
    }, [
      visualizationMode,
      propertyArea,
      visibleLandAreaBoundaries,
    ])

  const visibleBoundaryCount =
    visualizationMode ===
    'property'
      ? propertyBoundary
        ? 1
        : 0
      : visibleLandAreaBoundaries.length

  const fitPoints =
    useMemo(() => {
      if (
        visualizationMode ===
        'property'
      ) {
        return (
          propertyBoundary?.points ??
          []
        )
      }

      return visibleLandAreaBoundaries.flatMap(
        boundary =>
          boundary.points,
      )
    }, [
      visualizationMode,
      propertyBoundary,
      visibleLandAreaBoundaries,
    ])

  const hasVisibleMeasurements =
    fitPoints.length >= 3

  useEffect(() => {
    if (
      individualAreaId &&
      !landAreaBoundaries.some(
        boundary =>
          boundary.landAreaId ===
          individualAreaId,
      )
    ) {
      setIndividualAreaId('')
      setShowLengths(false)
    }
  }, [
    individualAreaId,
    landAreaBoundaries,
  ])

  // -------------------- Inicialização do Leaflet --------------------

  useEffect(() => {
    const container =
      containerRef.current

    if (!container) {
      return
    }

    const initial =
      initialLocationRef.current

    const landAreaPolygons =
      landAreaPolygonsRef.current

    const map = L.map(
      container,
      {
        center: [
          initial.latitude,
          initial.longitude,
        ],
        zoom:
          DEFAULT_ZOOM,
        minZoom: 3,
        maxZoom:
          MAX_SATELLITE_ZOOM,
        attributionControl:
          true,
      },
    )

    const tiles =
      L.tileLayer(
        SATELLITE_TILE_URL,
        {
          attribution:
            SATELLITE_ATTRIBUTION,
          maxNativeZoom:
            MAX_SATELLITE_ZOOM,
          maxZoom:
            MAX_SATELLITE_ZOOM,
        },
      )

    tiles.on(
      'tileerror',
      () =>
        setTileError(
          true,
        ),
    )

    tiles.on(
      'tileload',
      () =>
        setTileError(
          false,
        ),
    )

    tiles.addTo(map)

    const marker =
      L.marker(
        [
          initial.latitude,
          initial.longitude,
        ],
        {
          icon:
            PROPERTY_MARKER_ICON,
          title:
            'Localização de referência da propriedade',
        },
      ).addTo(map)

    propertyMarkerRef.current =
      marker

    map.on(
      'click',
      (
        event:
          L.LeafletMouseEvent,
      ) => {
        if (
          !drawTargetRef.current
        ) {
          return
        }

        setDrawPoints(
          previous => [
            ...previous,
            {
              latitude:
                event.latlng.lat,
              longitude:
                event.latlng.lng,
            },
          ],
        )
      },
    )

    mapRef.current =
      map

    return () => {
      map.remove()

      mapRef.current =
        null

      propertyMarkerRef.current =
        null

      propertyPolygonRef.current =
        null

      landAreaPolygons.clear()

      draftPolylineRef.current =
        null

      draftPolygonRef.current =
        null

      draftMarkersRef.current =
        []

      editPolygonRef.current =
        null

      editMarkersRef.current =
        []

      lengthLabelsRef.current =
        []
    }
  }, [])

  useEffect(() => {
    const map =
      mapRef.current

    const marker =
      propertyMarkerRef.current

    if (!map) {
      return
    }

    map.setView([
      location.latitude,
      location.longitude,
    ])

    if (marker) {
      marker.setLatLng([
        location.latitude,
        location.longitude,
      ])
    }
  }, [
    location.latitude,
    location.longitude,
  ])

  // -------------------- Polígono da propriedade --------------------

  useEffect(() => {
    const map =
      mapRef.current

    if (!map) {
      return
    }

    if (
      propertyPolygonRef.current
    ) {
      map.removeLayer(
        propertyPolygonRef.current,
      )

      propertyPolygonRef.current =
        null
    }

    if (
      visualizationMode !==
        'property' ||
      !propertyBoundary ||
      propertyBoundary.points.length <
        3
    ) {
      return
    }

    const polygon =
      L.polygon(
        propertyBoundary.points.map(
          point =>
            [
              point.latitude,
              point.longitude,
            ] as L.LatLngTuple,
        ),
        {
          color:
            '#2563eb',
          weight:
            3,
          fillColor:
            '#3b82f6',
          fillOpacity:
            0.15,
        },
      )

    polygon.bindTooltip(
      'Propriedade',
    )

    polygon.addTo(map)

    propertyPolygonRef.current =
      polygon
  }, [
    propertyBoundary,
    visualizationMode,
  ])

  // -------------------- Polígonos das LandAreas --------------------

  useEffect(() => {
    const map =
      mapRef.current

    if (!map) {
      return
    }

    landAreaPolygonsRef.current.forEach(
      polygon =>
        map.removeLayer(
          polygon,
        ),
    )

    landAreaPolygonsRef.current.clear()

    for (
      const boundary of
      visibleLandAreaBoundaries
    ) {
      if (
        boundary.points.length <
        3
      ) {
        continue
      }

      const area =
        areas.find(
          item =>
            item.id ===
            boundary.landAreaId,
        )

      if (!area) {
        continue
      }

      const isSelected =
        area.id ===
        selectedAreaId

      const polygon =
        L.polygon(
          boundary.points.map(
            point =>
              [
                point.latitude,
                point.longitude,
              ] as L.LatLngTuple,
          ),
          {
            color:
              isSelected
                ? '#15803d'
                : '#16a34a',
            weight:
              isSelected
                ? 4
                : 2,
            fillColor:
              '#22c55e',
            fillOpacity:
              isSelected
                ? 0.25
                : 0.12,
          },
        )

      polygon.bindTooltip(
        `${area.code} — ${area.name}`,
      )

      polygon.on(
        'click',
        () => {
          if (
            drawTargetRef.current ||
            editTargetRef.current
          ) {
            return
          }

          onSelectArea(
            area.id,
          )
        },
      )

      polygon.addTo(map)

      landAreaPolygonsRef.current.set(
        boundary.landAreaId,
        polygon,
      )
    }
  }, [
    visibleLandAreaBoundaries,
    areas,
    selectedAreaId,
    onSelectArea,
  ])

  // -------------------- Comprimentos dos lados --------------------

  useEffect(() => {
    const map =
      mapRef.current

    if (!map) {
      return
    }

    lengthLabelsRef.current.forEach(
      label =>
        map.removeLayer(
          label,
        ),
    )

    lengthLabelsRef.current =
      []

    if (!showLengths) {
      return
    }

    const groups: GeographicPoint[][] =
      visualizationMode ===
      'property'
        ? propertyBoundary
          ? [
              propertyBoundary.points,
            ]
          : []
        : visibleLandAreaBoundaries.map(
            boundary =>
              boundary.points,
          )

    const createdLabels:
      L.Tooltip[] = []

    for (
      const points of groups
    ) {
      if (
        points.length <
        2
      ) {
        continue
      }

      for (
        let index = 0;
        index < points.length;
        index += 1
      ) {
        const start =
          points[index]

        const end =
          points[
            (index + 1) %
              points.length
          ]

        const distance =
          calculateGeographicDistanceMeters(
            start,
            end,
          )

        const midpoint =
          getSegmentMidpoint(
            start,
            end,
          )

        const tooltip =
          L.tooltip({
            permanent:
              true,
            direction:
              'center',
            interactive:
              false,
            opacity:
              0.92,
            className:
              'agro360-length-label',
          })
            .setLatLng(
              midpoint,
            )
            .setContent(
              formatDistanceMeters(
                distance,
              ),
            )
            .addTo(map)

        createdLabels.push(
          tooltip,
        )
      }
    }

    lengthLabelsRef.current =
      createdLabels
  }, [
    showLengths,
    visualizationMode,
    propertyBoundary,
    visibleLandAreaBoundaries,
  ])

  // -------------------- Enquadramento da visualização --------------------

  const fitVisibleSelection =
    useCallback(() => {
      const map =
        mapRef.current

      if (
        !map ||
        fitPoints.length <
          3
      ) {
        return
      }

      const bounds =
        L.latLngBounds(
          fitPoints.map(
            point =>
              [
                point.latitude,
                point.longitude,
              ] as L.LatLngTuple,
          ),
        )

      map.fitBounds(
        bounds,
        {
          padding: [
            30,
            30,
          ],
          maxZoom:
            MAX_SATELLITE_ZOOM,
        },
      )
    }, [fitPoints])

  useEffect(() => {
    fitVisibleSelection()
  }, [
    fitVisibleSelection,
  ])

  // -------------------- Desenho em andamento --------------------

  useEffect(() => {
    const map =
      mapRef.current

    if (!map) {
      return
    }

    if (
      draftPolylineRef.current
    ) {
      map.removeLayer(
        draftPolylineRef.current,
      )

      draftPolylineRef.current =
        null
    }

    if (
      draftPolygonRef.current
    ) {
      map.removeLayer(
        draftPolygonRef.current,
      )

      draftPolygonRef.current =
        null
    }

    draftMarkersRef.current.forEach(
      marker =>
        map.removeLayer(
          marker,
        ),
    )

    draftMarkersRef.current =
      []

    if (!drawTarget) {
      return
    }

    if (
      drawPoints.length ===
      0
    ) {
      return
    }

    const latlngs =
      drawPoints.map(
        point =>
          [
            point.latitude,
            point.longitude,
          ] as L.LatLngTuple,
      )

    if (
      drawPoints.length >=
      3
    ) {
      const polygon =
        L.polygon(
          latlngs,
          {
            color:
              '#f59e0b',
            weight:
              2,
            fillColor:
              '#f59e0b',
            fillOpacity:
              0.18,
            dashArray:
              '6,4',
          },
        ).addTo(map)

      draftPolygonRef.current =
        polygon
    } else {
      const polyline =
        L.polyline(
          latlngs,
          {
            color:
              '#f59e0b',
            weight:
              2,
            dashArray:
              '6,4',
          },
        ).addTo(map)

      draftPolylineRef.current =
        polyline
    }

    drawPoints.forEach(
      point => {
        const marker =
          L.marker(
            [
              point.latitude,
              point.longitude,
            ],
            {
              icon:
                VERTEX_ICON,
              interactive:
                false,
            },
          ).addTo(map)

        draftMarkersRef.current.push(
          marker,
        )
      },
    )
  }, [
    drawTarget,
    drawPoints,
  ])

  // -------------------- Edição: polígono --------------------

  useEffect(() => {
    const map =
      mapRef.current

    if (!map) {
      return
    }

    if (
      editPolygonRef.current
    ) {
      map.removeLayer(
        editPolygonRef.current,
      )

      editPolygonRef.current =
        null
    }

    if (!editTarget) {
      return
    }

    if (
      editPoints.length <
      3
    ) {
      return
    }

    const polygon =
      L.polygon(
        editPoints.map(
          point =>
            [
              point.latitude,
              point.longitude,
            ] as L.LatLngTuple,
        ),
        {
          color:
            '#f59e0b',
          weight:
            3,
          fillColor:
            '#f59e0b',
          fillOpacity:
            0.2,
        },
      ).addTo(map)

    editPolygonRef.current =
      polygon
  }, [
    editTarget,
    editPoints,
  ])

  // -------------------- Edição: marcadores --------------------

  useEffect(() => {
    const map =
      mapRef.current

    if (!map) {
      return
    }

    editMarkersRef.current.forEach(
      marker =>
        map.removeLayer(
          marker,
        ),
    )

    editMarkersRef.current =
      []

    if (!editTarget) {
      return
    }

    const points =
      editPointsRef.current

    points.forEach(
      (
        point,
        index,
      ) => {
        const marker =
          L.marker(
            [
              point.latitude,
              point.longitude,
            ],
            {
              icon:
                VERTEX_DRAGGABLE_ICON,
              draggable:
                true,
            },
          ).addTo(map)

        marker.on(
          'drag',
          () => {
            const latLng =
              marker.getLatLng()

            setEditPoints(
              previous =>
                previous.map(
                  (
                    currentPoint,
                    currentIndex,
                  ) =>
                    currentIndex ===
                    index
                      ? {
                          latitude:
                            latLng.lat,
                          longitude:
                            latLng.lng,
                        }
                      : currentPoint,
                ),
            )
          },
        )

        editMarkersRef.current.push(
          marker,
        )
      },
    )
  }, [editTarget])

  // -------------------- Cálculos derivados --------------------

  const draftArea =
    useMemo(
      () =>
        calculateGeographicAreaHectares(
          drawPoints,
        ),
      [drawPoints],
    )

  const editArea =
    useMemo(
      () =>
        calculateGeographicAreaHectares(
          editPoints,
        ),
      [editPoints],
    )

  // -------------------- Visualização --------------------

  const handleVisualizationModeChange =
    useCallback(
      (
        mode:
          SatelliteVisualizationMode,
      ) => {
        setVisualizationMode(
          mode,
        )

        setShowLengths(
          false,
        )

        if (
          mode ===
          'type' &&
          !selectedType
        ) {
          const firstBoundary =
            landAreaBoundaries.find(
              boundary =>
                areas.some(
                  area =>
                    area.id ===
                    boundary.landAreaId,
                ),
            )

          if (
            firstBoundary
          ) {
            const firstArea =
              areas.find(
                area =>
                  area.id ===
                  firstBoundary.landAreaId,
              )

            if (
              firstArea
            ) {
              setSelectedType(
                firstArea.type,
              )
            }
          }
        }

        if (
          mode ===
          'individual'
        ) {
          const selectedHasBoundary =
            selectedAreaId &&
            landAreaBoundaries.some(
              boundary =>
                boundary.landAreaId ===
                selectedAreaId,
            )

          const currentHasBoundary =
            individualAreaId &&
            landAreaBoundaries.some(
              boundary =>
                boundary.landAreaId ===
                individualAreaId,
            )

          const targetId =
            selectedHasBoundary
              ? selectedAreaId
              : currentHasBoundary
                ? individualAreaId
                : landAreaBoundaries[0]
                    ?.landAreaId ??
                  ''

          setIndividualAreaId(
            targetId,
          )

          if (
            targetId
          ) {
            onSelectArea(
              targetId,
            )
          }
        }
      },
      [
        selectedType,
        landAreaBoundaries,
        areas,
        selectedAreaId,
        individualAreaId,
        onSelectArea,
      ],
    )

  const handleSelectedTypeChange =
    useCallback(
      (
        type:
          | LandAreaType
          | '',
      ) => {
        setSelectedType(
          type,
        )

        setShowLengths(
          false,
        )
      },
      [],
    )

  const handleIndividualAreaIdChange =
    useCallback(
      (
        id: string,
      ) => {
        setIndividualAreaId(
          id,
        )

        setShowLengths(
          false,
        )

        onSelectArea(
          id || null,
        )
      },
      [onSelectArea],
    )

  const handleToggleLengths =
    useCallback(
      () => {
        setShowLengths(
          previous =>
            !previous,
        )
      },
      [],
    )

  // -------------------- Handlers de demarcação --------------------

  const handleStartDrawProperty =
    useCallback(
      () => {
        setVisualizationMode(
          'property',
        )

        setShowLengths(
          false,
        )

        if (
          propertyBoundary
        ) {
          setPendingAction({
            kind:
              'replace',
            target:
              'property',
          })

          return
        }

        setDrawTarget(
          'property',
        )

        setDrawPoints(
          [],
        )

        setFeedback(
          null,
        )
      },
      [propertyBoundary],
    )

  const handleStartDrawLandArea =
    useCallback(
      () => {
        if (
          !selectedAreaForDraw
        ) {
          return
        }

        setVisualizationMode(
          'individual',
        )

        setIndividualAreaId(
          selectedAreaForDraw,
        )

        setShowLengths(
          false,
        )

        onSelectArea(
          selectedAreaForDraw,
        )

        const existing =
          landAreaBoundaries.find(
            boundary =>
              boundary.landAreaId ===
              selectedAreaForDraw,
          )

        if (existing) {
          setPendingAction({
            kind:
              'replace',
            target:
              selectedAreaForDraw,
          })

          return
        }

        setDrawTarget(
          selectedAreaForDraw,
        )

        setDrawPoints(
          [],
        )

        setFeedback(
          null,
        )
      },
      [
        selectedAreaForDraw,
        landAreaBoundaries,
        onSelectArea,
      ],
    )

  const handleSelectedAreaForDrawChange =
    useCallback(
      (
        id: string,
      ) => {
        setSelectedAreaForDraw(
          id,
        )

        if (id) {
          onSelectArea(
            id,
          )
        }
      },
      [onSelectArea],
    )

  const handleUndoDrawPoint =
    useCallback(
      () => {
        setDrawPoints(
          previous =>
            previous.slice(
              0,
              -1,
            ),
        )
      },
      [],
    )

  const handleFinishDraw =
    useCallback(
      () => {
        if (!drawTarget) {
          return
        }

        if (
          drawPoints.length <
          3
        ) {
          setFeedback({
            type:
              'error',
            message:
              'Adicione pelo menos 3 pontos para finalizar a demarcação.',
          })

          return
        }

        const now =
          new Date().toISOString()

        try {
          if (
            drawTarget ===
            'property'
          ) {
            const boundary:
              PropertyGeographicBoundary =
              {
                points: [
                  ...drawPoints,
                ],
                updatedAt:
                  now,
              }

            savePropertyGeographicBoundary(
              boundary,
            )

            setPropertyBoundary(
              boundary,
            )

            setVisualizationMode(
              'property',
            )

            setFeedback({
              type:
                'success',
              message:
                'Demarcação da propriedade salva com sucesso.',
            })
          } else {
            const boundary:
              LandAreaGeographicBoundary =
              {
                landAreaId:
                  drawTarget,
                points: [
                  ...drawPoints,
                ],
                updatedAt:
                  now,
              }

            saveLandAreaGeographicBoundary(
              boundary,
            )

            setLandAreaBoundaries(
              getLandAreaGeographicBoundaries(),
            )

            setVisualizationMode(
              'individual',
            )

            setIndividualAreaId(
              drawTarget,
            )

            onSelectArea(
              drawTarget,
            )

            setFeedback({
              type:
                'success',
              message:
                'Demarcação da área salva com sucesso.',
            })
          }
        } catch {
          setFeedback({
            type:
              'error',
            message:
              'Não foi possível salvar a demarcação no momento.',
          })

          return
        }

        setDrawTarget(
          null,
        )

        setDrawPoints(
          [],
        )

        onBoundaryChange()
      },
      [
        drawTarget,
        drawPoints,
        onBoundaryChange,
        onSelectArea,
      ],
    )

  const handleCancelDraw =
    useCallback(
      () => {
        setDrawTarget(
          null,
        )

        setDrawPoints(
          [],
        )

        setFeedback(
          null,
        )
      },
      [],
    )

  const handleStartEdit =
    useCallback(
      (
        target:
          | 'property'
          | string,
      ) => {
        setShowLengths(
          false,
        )

        if (
          target ===
          'property'
        ) {
          if (
            !propertyBoundary
          ) {
            return
          }

          setVisualizationMode(
            'property',
          )

          setEditTarget(
            'property',
          )

          setEditPoints(
            propertyBoundary.points.map(
              point => ({
                ...point,
              }),
            ),
          )
        } else {
          const boundary =
            landAreaBoundaries.find(
              item =>
                item.landAreaId ===
                target,
            )

          if (!boundary) {
            return
          }

          setVisualizationMode(
            'individual',
          )

          setIndividualAreaId(
            target,
          )

          onSelectArea(
            target,
          )

          setEditTarget(
            target,
          )

          setEditPoints(
            boundary.points.map(
              point => ({
                ...point,
              }),
            ),
          )
        }

        setFeedback(
          null,
        )
      },
      [
        propertyBoundary,
        landAreaBoundaries,
        onSelectArea,
      ],
    )

  const handleSaveEdit =
    useCallback(
      () => {
        if (!editTarget) {
          return
        }

        if (
          editPoints.length <
          3
        ) {
          setFeedback({
            type:
              'error',
            message:
              'Adicione pelo menos 3 pontos para finalizar a demarcação.',
          })

          return
        }

        const now =
          new Date().toISOString()

        try {
          if (
            editTarget ===
            'property'
          ) {
            const boundary:
              PropertyGeographicBoundary =
              {
                points: [
                  ...editPoints,
                ],
                updatedAt:
                  now,
              }

            savePropertyGeographicBoundary(
              boundary,
            )

            setPropertyBoundary(
              boundary,
            )
          } else {
            const boundary:
              LandAreaGeographicBoundary =
              {
                landAreaId:
                  editTarget,
                points: [
                  ...editPoints,
                ],
                updatedAt:
                  now,
              }

            saveLandAreaGeographicBoundary(
              boundary,
            )

            setLandAreaBoundaries(
              getLandAreaGeographicBoundaries(),
            )
          }
        } catch {
          setFeedback({
            type:
              'error',
            message:
              'Não foi possível salvar as alterações da demarcação.',
          })

          return
        }

        setEditTarget(
          null,
        )

        setEditPoints(
          [],
        )

        setFeedback({
          type:
            'success',
          message:
            'Alterações na demarcação salvas com sucesso.',
        })

        onBoundaryChange()
      },
      [
        editTarget,
        editPoints,
        onBoundaryChange,
      ],
    )

  const handleCancelEdit =
    useCallback(
      () => {
        setEditTarget(
          null,
        )

        setEditPoints(
          [],
        )

        setFeedback(
          null,
        )
      },
      [],
    )

  const handleRequestDelete =
    useCallback(
      (
        target:
          | 'property'
          | string,
      ) => {
        setPendingAction({
          kind:
            'delete',
          target,
        })
      },
      [],
    )

  const handleConfirmPending =
    useCallback(
      () => {
        if (
          !pendingAction
        ) {
          return
        }

        if (
          pendingAction.kind ===
          'delete'
        ) {
          try {
            if (
              pendingAction.target ===
              'property'
            ) {
              clearPropertyGeographicBoundary()

              setPropertyBoundary(
                null,
              )
            } else {
              deleteLandAreaGeographicBoundary(
                pendingAction.target,
              )

              setLandAreaBoundaries(
                getLandAreaGeographicBoundaries(),
              )
            }
          } catch {
            setFeedback({
              type:
                'error',
              message:
                'Não foi possível excluir a demarcação no momento.',
            })

            setPendingAction(
              null,
            )

            return
          }

          setShowLengths(
            false,
          )

          setFeedback({
            type:
              'success',
            message:
              'Demarcação excluída com sucesso.',
          })

          setPendingAction(
            null,
          )

          onBoundaryChange()

          return
        }

        if (
          pendingAction.kind ===
          'replace'
        ) {
          if (
            pendingAction.target ===
            'property'
          ) {
            setVisualizationMode(
              'property',
            )
          } else {
            setVisualizationMode(
              'individual',
            )

            setIndividualAreaId(
              pendingAction.target,
            )

            onSelectArea(
              pendingAction.target,
            )
          }

          setShowLengths(
            false,
          )

          setDrawTarget(
            pendingAction.target,
          )

          setDrawPoints(
            [],
          )

          setFeedback(
            null,
          )

          setPendingAction(
            null,
          )
        }
      },
      [
        pendingAction,
        onBoundaryChange,
        onSelectArea,
      ],
    )

  const handleCancelPending =
    useCallback(
      () => {
        setPendingAction(
          null,
        )
      },
      [],
    )

  const handleRecenter =
    useCallback(
      () => {
        const map =
          mapRef.current

        if (!map) {
          return
        }

        map.setView(
          [
            location.latitude,
            location.longitude,
          ],
          DEFAULT_ZOOM,
        )
      },
      [
        location.latitude,
        location.longitude,
      ],
    )

  // -------------------- Render --------------------

  return (
    <div className="space-y-5">
      {/* Mapa ocupando toda a largura */}
      <div className="space-y-3">
        <div className="relative z-0 w-full">
          <div
            ref={containerRef}
            className="w-full h-[420px] md:h-[520px] xl:h-[600px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800"
            aria-label="Mapa de satélite da propriedade"
          />
        </div>

        {tileError && (
          <PageFeedback
            type="warning"
            message="Não foi possível carregar as imagens de satélite. Verifique sua conexão com a internet."
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-3xl">
            O marcador representa apenas a localização de referência da
            propriedade. Áreas e comprimentos calculados no mapa são
            estimativas e não substituem georreferenciamento ou medição
            profissional.
          </p>

          <Button
            variant="outline"
            onClick={
              handleRecenter
            }
          >
            <Crosshair className="w-4 h-4 mr-2 inline" />
            Recentralizar
          </Button>
        </div>
      </div>

      {/* Visualização e demarcação abaixo do mapa */}
      <div className="w-full">
        <SatelliteBoundaryPanel
          areas={areas}
          propertyBoundary={propertyBoundary}
          propertyArea={propertyArea}
          landAreaBoundaries={landAreaBoundaries}

          visualizationMode={visualizationMode}
          onVisualizationModeChange={handleVisualizationModeChange}

          selectedType={selectedType}
          onSelectedTypeChange={handleSelectedTypeChange}

          individualAreaId={individualAreaId}
          onIndividualAreaIdChange={handleIndividualAreaIdChange}

          visibleBoundaryCount={visibleBoundaryCount}
          visibleAreaHectares={visibleAreaHectares}

          showLengths={showLengths}
          onToggleLengths={handleToggleLengths}
          onFitView={fitVisibleSelection}
          hasVisibleMeasurements={hasVisibleMeasurements}

          selectedAreaForDraw={selectedAreaForDraw}
          onSelectedAreaForDrawChange={handleSelectedAreaForDrawChange}

          drawTarget={drawTarget}
          drawPoints={drawPoints}
          draftArea={draftArea}

          editTarget={editTarget}
          editPoints={editPoints}
          editArea={editArea}

          pendingAction={pendingAction}
          feedback={feedback}

          onStartDrawProperty={handleStartDrawProperty}
          onStartDrawLandArea={handleStartDrawLandArea}
          onUndoDrawPoint={handleUndoDrawPoint}
          onFinishDraw={handleFinishDraw}
          onCancelDraw={handleCancelDraw}
          onStartEdit={handleStartEdit}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onRequestDelete={handleRequestDelete}
          onConfirmPending={handleConfirmPending}
          onCancelPending={handleCancelPending}
        />
      </div>
    </div>
  )
}