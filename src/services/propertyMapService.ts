import {
  GeographicPoint,
  LandArea,
  LandAreaGeographicBoundary,
  LandAreaMapLayout,
  MapRelativePoint,
  PropertyGeographicBoundary,
  PropertyMapLocation,
  SchematicShapeType,
} from '../types'

const LOCATION_KEY = 'agro360:propertyMap:location'
const LAYOUT_KEY = 'agro360:propertyMap:layouts'
const GEO_PROPERTY_KEY = 'agro360:propertyMap:geoBoundary:property'
const GEO_LANDAREAS_KEY = 'agro360:propertyMap:geoBoundary:landareas'

export const MAP_CANVAS_WIDTH = 1000
export const MAP_CANVAS_HEIGHT = 700

const CANVAS_PADDING = 40
const MIN_LAYOUT_SIZE = 30
const DEFAULT_NEW_LAYOUT_WIDTH = 120
const DEFAULT_NEW_LAYOUT_HEIGHT = 100

const EARTH_RADIUS_M = 6371008.8

// -------------------- Localização da propriedade --------------------

export function getPropertyMapLocation(): PropertyMapLocation | null {
  try {
    const raw = localStorage.getItem(LOCATION_KEY)

    if (!raw) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)

    if (!isValidLocation(parsed)) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function savePropertyMapLocation(
  location: PropertyMapLocation,
): void {
  if (!isValidLocation(location)) {
    throw new Error('Localização inválida.')
  }

  localStorage.setItem(
    LOCATION_KEY,
    JSON.stringify(location),
  )
}

export function clearPropertyMapLocation(): void {
  localStorage.removeItem(LOCATION_KEY)
}

export function isValidLatitude(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= -90 &&
    value <= 90
  )
}

export function isValidLongitude(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180
  )
}

function isValidLocation(
  value: unknown,
): value is PropertyMapLocation {
  if (!value || typeof value !== 'object') {
    return false
  }

  const v = value as Record<string, unknown>

  return (
    isValidLatitude(v.latitude) &&
    isValidLongitude(v.longitude) &&
    typeof v.updatedAt === 'string'
  )
}

// -------------------- Layout esquemático --------------------

const SCHEMATIC_SHAPE_TYPES: SchematicShapeType[] = [
  'rectangle',
  'triangle',
  'trapezoid',
  'l-shape',
  'free',
]

export function isSchematicShapeType(
  value: unknown,
): value is SchematicShapeType {
  return (
    typeof value === 'string' &&
    (SCHEMATIC_SHAPE_TYPES as string[]).includes(value)
  )
}

export function isMapRelativePoint(
  value: unknown,
): value is MapRelativePoint {
  if (!value || typeof value !== 'object') {
    return false
  }

  const v = value as Record<string, unknown>

  return (
    typeof v.x === 'number' &&
    Number.isFinite(v.x) &&
    typeof v.y === 'number' &&
    Number.isFinite(v.y)
  )
}

export const SHAPE_PRESETS: Record<
  Exclude<SchematicShapeType, 'free'>,
  MapRelativePoint[]
> = {
  rectangle: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ],

  triangle: [
    { x: 0.5, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ],

  trapezoid: [
    { x: 0.25, y: 0 },
    { x: 0.75, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ],

  'l-shape': [
    { x: 0, y: 0 },
    { x: 0.55, y: 0 },
    { x: 0.55, y: 0.45 },
    { x: 1, y: 0.45 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ],
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  if (value < 0) {
    return 0
  }

  if (value > 1) {
    return 1
  }

  return value
}

function extractValidRelativePoints(
  value: unknown,
): MapRelativePoint[] {
  if (!Array.isArray(value)) {
    return []
  }

  const result: MapRelativePoint[] = []

  for (const item of value) {
    if (isMapRelativePoint(item)) {
      result.push({
        x: clamp01(item.x),
        y: clamp01(item.y),
      })
    }
  }

  return result
}

export function getLayoutShapePoints(
  layout: LandAreaMapLayout,
): MapRelativePoint[] {
  const rawShapeType = (
    layout as {
      shapeType?: unknown
    }
  ).shapeType

  const shapeType: SchematicShapeType =
    isSchematicShapeType(rawShapeType)
      ? rawShapeType
      : 'rectangle'

  if (shapeType === 'free') {
    const rawPoints = (
      layout as {
        points?: unknown
      }
    ).points

    const validPoints =
      extractValidRelativePoints(rawPoints)

    if (validPoints.length >= 3) {
      return validPoints
    }

    return SHAPE_PRESETS.rectangle
  }

  return (
    SHAPE_PRESETS[shapeType] ??
    SHAPE_PRESETS.rectangle
  )
}

export function applyShapeType(
  layout: LandAreaMapLayout,
  shapeType: SchematicShapeType,
): LandAreaMapLayout {
  if (shapeType === 'free') {
    const rawShapeType = (
      layout as {
        shapeType?: unknown
      }
    ).shapeType

    const currentShape =
      isSchematicShapeType(rawShapeType)
        ? rawShapeType
        : 'rectangle'

    const source =
      currentShape === 'free'
        ? extractValidRelativePoints(
            (
              layout as {
                points?: unknown
              }
            ).points,
          )
        : getLayoutShapePoints(layout)

    const safePoints =
      source.length >= 3
        ? source
        : SHAPE_PRESETS.rectangle

    return {
      ...layout,
      shapeType: 'free',
      points: safePoints.map(point => ({
        ...point,
      })),
    }
  }

  return {
    ...layout,
    shapeType,
    points: undefined,
  }
}

function normalizeLayout(
  layout: LandAreaMapLayout,
): LandAreaMapLayout {
  const rawShapeType = (
    layout as {
      shapeType?: unknown
    }
  ).shapeType

  const shapeType: SchematicShapeType =
    isSchematicShapeType(rawShapeType)
      ? rawShapeType
      : 'rectangle'

  if (shapeType === 'free') {
    const rawPoints = (
      layout as {
        points?: unknown
      }
    ).points

    const validPoints =
      extractValidRelativePoints(rawPoints)

    if (validPoints.length < 3) {
      return {
        ...layout,
        shapeType: 'rectangle',
        points: undefined,
      }
    }

    return {
      ...layout,
      shapeType: 'free',
      points: validPoints,
    }
  }

  return {
    ...layout,
    shapeType,
    points: undefined,
  }
}

export function getLandAreaMapLayouts(): LandAreaMapLayout[] {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)

    if (!raw) {
      return []
    }

    const parsed: unknown = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter(isValidLayout)
      .map(layout =>
        normalizeLayout(layout),
      )
  } catch {
    return []
  }
}

export function saveLandAreaMapLayouts(
  layouts: LandAreaMapLayout[],
): void {
  const valid = layouts
    .filter(isValidLayout)
    .map(layout =>
      clampLayout(
        normalizeLayout(layout),
      ),
    )

  localStorage.setItem(
    LAYOUT_KEY,
    JSON.stringify(valid),
  )
}

function isValidLayout(
  value: unknown,
): value is LandAreaMapLayout {
  if (!value || typeof value !== 'object') {
    return false
  }

  const v = value as Record<string, unknown>

  return (
    typeof v.landAreaId === 'string' &&
    v.landAreaId.length > 0 &&
    typeof v.x === 'number' &&
    Number.isFinite(v.x) &&
    typeof v.y === 'number' &&
    Number.isFinite(v.y) &&
    typeof v.width === 'number' &&
    Number.isFinite(v.width) &&
    v.width > 0 &&
    typeof v.height === 'number' &&
    Number.isFinite(v.height) &&
    v.height > 0
  )
}

function clampNumber(
  value: number,
  min: number,
  max: number,
): number {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.min(
    Math.max(value, min),
    max,
  )
}

export function clampLayout(
  layout: LandAreaMapLayout,
): LandAreaMapLayout {
  const width = clampNumber(
    layout.width,
    MIN_LAYOUT_SIZE,
    MAP_CANVAS_WIDTH,
  )

  const height = clampNumber(
    layout.height,
    MIN_LAYOUT_SIZE,
    MAP_CANVAS_HEIGHT,
  )

  const x = clampNumber(
    layout.x,
    0,
    MAP_CANVAS_WIDTH - width,
  )

  const y = clampNumber(
    layout.y,
    0,
    MAP_CANVAS_HEIGHT - height,
  )

  return {
    ...layout,
    x,
    y,
    width,
    height,
  }
}

function rectsOverlap(
  a: {
    x: number
    y: number
    width: number
    height: number
  },
  b: {
    x: number
    y: number
    width: number
    height: number
  },
): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  )
}

// -------------------- Geração automática --------------------

export function generateAutoLayout(
  areas: LandArea[],
): LandAreaMapLayout[] {
  if (areas.length === 0) {
    return []
  }

  const sorted = [...areas].sort(
    (a, b) =>
      a.code.localeCompare(
        b.code,
        'pt-BR',
      ),
  )

  const cols = Math.max(
    1,
    Math.ceil(
      Math.sqrt(sorted.length),
    ),
  )

  const rows = Math.max(
    1,
    Math.ceil(
      sorted.length / cols,
    ),
  )

  const usableW =
    MAP_CANVAS_WIDTH -
    CANVAS_PADDING * 2

  const usableH =
    MAP_CANVAS_HEIGHT -
    CANVAS_PADDING * 2

  const cellW =
    usableW / cols

  const cellH =
    usableH / rows

  const cellPadding = 8

  const maxArea = Math.max(
    0.01,
    ...sorted.map(area =>
      Math.max(
        0.01,
        area.areaHectares,
      ),
    ),
  )

  return sorted.map(
    (area, index) => {
      const col =
        index % cols

      const row =
        Math.floor(
          index / cols,
        )

      const cellX =
        CANVAS_PADDING +
        col * cellW

      const cellY =
        CANVAS_PADDING +
        row * cellH

      const innerMaxW =
        Math.max(
          20,
          cellW -
            cellPadding * 2,
        )

      const innerMaxH =
        Math.max(
          20,
          cellH -
            cellPadding * 2,
        )

      const innerMinW =
        innerMaxW * 0.5

      const innerMinH =
        innerMaxH * 0.5

      const ratio =
        Math.sqrt(
          Math.max(
            0.01,
            area.areaHectares,
          ) / maxArea,
        )

      const boxW =
        innerMinW +
        (
          innerMaxW -
          innerMinW
        ) *
          ratio

      const boxH =
        innerMinH +
        (
          innerMaxH -
          innerMinH
        ) *
          ratio

      const x =
        cellX +
        (
          cellW -
          boxW
        ) /
          2

      const y =
        cellY +
        (
          cellH -
          boxH
        ) /
          2

      return {
        landAreaId:
          area.id,

        x:
          Math.round(
            x * 100,
          ) / 100,

        y:
          Math.round(
            y * 100,
          ) / 100,

        width:
          Math.round(
            boxW * 100,
          ) / 100,

        height:
          Math.round(
            boxH * 100,
          ) / 100,

        shapeType:
          'rectangle' as const,
      }
    },
  )
}

function findFreePosition(
  existing: LandAreaMapLayout[],
  width: number,
  height: number,
): {
  x: number
  y: number
} {
  const step = 20

  const maxX =
    MAP_CANVAS_WIDTH -
    width -
    CANVAS_PADDING

  const maxY =
    MAP_CANVAS_HEIGHT -
    height -
    CANVAS_PADDING

  for (
    let y = CANVAS_PADDING;
    y <= maxY;
    y += step
  ) {
    for (
      let x = CANVAS_PADDING;
      x <= maxX;
      x += step
    ) {
      const candidate = {
        x,
        y,
        width,
        height,
      }

      const overlaps =
        existing.some(layout =>
          rectsOverlap(
            candidate,
            layout,
          ),
        )

      if (!overlaps) {
        return {
          x,
          y,
        }
      }
    }
  }

  return {
    x: CANVAS_PADDING,
    y: CANVAS_PADDING,
  }
}

export function reconcileLayouts(
  areas: LandArea[],
  existingLayouts: LandAreaMapLayout[],
): LandAreaMapLayout[] {
  if (areas.length === 0) {
    return []
  }

  const areaIds =
    new Set(
      areas.map(
        area => area.id,
      ),
    )

  const existingByArea =
    new Map<
      string,
      LandAreaMapLayout
    >()

  for (const layout of existingLayouts) {
    if (
      areaIds.has(
        layout.landAreaId,
      )
    ) {
      existingByArea.set(
        layout.landAreaId,
        layout,
      )
    }
  }

  if (existingByArea.size === 0) {
    return generateAutoLayout(
      areas,
    )
  }

  const result: LandAreaMapLayout[] = []
  const working: LandAreaMapLayout[] = []

  for (const area of areas) {
    const existing =
      existingByArea.get(
        area.id,
      )

    if (existing) {
      result.push(existing)
      working.push(existing)
    }
  }

  for (const area of areas) {
    if (
      existingByArea.has(
        area.id,
      )
    ) {
      continue
    }

    const pos =
      findFreePosition(
        working,
        DEFAULT_NEW_LAYOUT_WIDTH,
        DEFAULT_NEW_LAYOUT_HEIGHT,
      )

    const newLayout: LandAreaMapLayout = {
      landAreaId: area.id,
      x: pos.x,
      y: pos.y,
      width:
        DEFAULT_NEW_LAYOUT_WIDTH,
      height:
        DEFAULT_NEW_LAYOUT_HEIGHT,
      shapeType: 'rectangle',
    }

    result.push(newLayout)
    working.push(newLayout)
  }

  return result
}

// -------------------- Geografia --------------------

export function isValidGeoPoint(
  value: unknown,
): value is GeographicPoint {
  if (!value || typeof value !== 'object') {
    return false
  }

  const v = value as Record<string, unknown>

  return (
    typeof v.latitude === 'number' &&
    Number.isFinite(v.latitude) &&
    v.latitude >= -90 &&
    v.latitude <= 90 &&
    typeof v.longitude === 'number' &&
    Number.isFinite(v.longitude) &&
    v.longitude >= -180 &&
    v.longitude <= 180
  )
}

function isValidGeoPolygon(
  points: unknown,
): points is GeographicPoint[] {
  if (!Array.isArray(points)) {
    return false
  }

  if (points.length < 3) {
    return false
  }

  return points.every(
    isValidGeoPoint,
  )
}

export function getPropertyGeographicBoundary():
  | PropertyGeographicBoundary
  | null {
  try {
    const raw =
      localStorage.getItem(
        GEO_PROPERTY_KEY,
      )

    if (!raw) {
      return null
    }

    const parsed: unknown =
      JSON.parse(raw)

    if (
      !parsed ||
      typeof parsed !== 'object'
    ) {
      return null
    }

    const v =
      parsed as Record<
        string,
        unknown
      >

    if (
      !isValidGeoPolygon(
        v.points,
      )
    ) {
      return null
    }

    if (
      typeof v.updatedAt !==
      'string'
    ) {
      return null
    }

    return {
      points: v.points,
      updatedAt:
        v.updatedAt,
    }
  } catch {
    return null
  }
}

export function savePropertyGeographicBoundary(
  boundary:
    PropertyGeographicBoundary,
): void {
  if (
    !isValidGeoPolygon(
      boundary.points,
    )
  ) {
    throw new Error(
      'Polígono da propriedade inválido.',
    )
  }

  localStorage.setItem(
    GEO_PROPERTY_KEY,
    JSON.stringify(
      boundary,
    ),
  )
}

export function clearPropertyGeographicBoundary(): void {
  localStorage.removeItem(
    GEO_PROPERTY_KEY,
  )
}

export function getLandAreaGeographicBoundaries():
  LandAreaGeographicBoundary[] {
  try {
    const raw =
      localStorage.getItem(
        GEO_LANDAREAS_KEY,
      )

    if (!raw) {
      return []
    }

    const parsed: unknown =
      JSON.parse(raw)

    if (
      !Array.isArray(parsed)
    ) {
      return []
    }

    return parsed.filter(
      (
        item,
      ): item is LandAreaGeographicBoundary => {
        if (
          !item ||
          typeof item !==
            'object'
        ) {
          return false
        }

        const v =
          item as Record<
            string,
            unknown
          >

        return (
          typeof v.landAreaId ===
            'string' &&
          v.landAreaId.length > 0 &&
          isValidGeoPolygon(
            v.points,
          ) &&
          typeof v.updatedAt ===
            'string'
        )
      },
    )
  } catch {
    return []
  }
}

export function getLandAreaGeographicBoundary(
  landAreaId: string,
): LandAreaGeographicBoundary | null {
  return (
    getLandAreaGeographicBoundaries().find(
      boundary =>
        boundary.landAreaId ===
        landAreaId,
    ) ?? null
  )
}

export function saveLandAreaGeographicBoundary(
  boundary:
    LandAreaGeographicBoundary,
): void {
  if (
    !isValidGeoPolygon(
      boundary.points,
    )
  ) {
    throw new Error(
      'Polígono da área inválido.',
    )
  }

  const all =
    getLandAreaGeographicBoundaries().filter(
      item =>
        item.landAreaId !==
        boundary.landAreaId,
    )

  all.push(boundary)

  localStorage.setItem(
    GEO_LANDAREAS_KEY,
    JSON.stringify(all),
  )
}

export function deleteLandAreaGeographicBoundary(
  landAreaId: string,
): void {
  const all =
    getLandAreaGeographicBoundaries().filter(
      boundary =>
        boundary.landAreaId !==
        landAreaId,
    )

  if (all.length === 0) {
    localStorage.removeItem(
      GEO_LANDAREAS_KEY,
    )
  } else {
    localStorage.setItem(
      GEO_LANDAREAS_KEY,
      JSON.stringify(all),
    )
  }
}

// -------------------- Medições geográficas --------------------

function degreesToRadians(
  value: number,
): number {
  return (
    value *
    Math.PI /
    180
  )
}

function normalizeLongitudeDeltaRadians(
  value: number,
): number {
  let normalized = value

  while (
    normalized >
    Math.PI
  ) {
    normalized -=
      2 * Math.PI
  }

  while (
    normalized <
    -Math.PI
  ) {
    normalized +=
      2 * Math.PI
  }

  return normalized
}

export function hectaresToSquareMeters(
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

export function calculateGeographicDistanceMeters(
  start: GeographicPoint,
  end: GeographicPoint,
): number {
  if (
    !isValidGeoPoint(start) ||
    !isValidGeoPoint(end)
  ) {
    return 0
  }

  const lat1 =
    degreesToRadians(
      start.latitude,
    )

  const lat2 =
    degreesToRadians(
      end.latitude,
    )

  const dLat =
    lat2 - lat1

  const dLon =
    normalizeLongitudeDeltaRadians(
      degreesToRadians(
        end.longitude,
      ) -
        degreesToRadians(
          start.longitude,
        ),
    )

  const sinHalfLat =
    Math.sin(
      dLat / 2,
    )

  const sinHalfLon =
    Math.sin(
      dLon / 2,
    )

  const rawHaversine =
    sinHalfLat *
      sinHalfLat +
    Math.cos(lat1) *
      Math.cos(lat2) *
      sinHalfLon *
      sinHalfLon

  const haversine =
    Math.min(
      1,
      Math.max(
        0,
        rawHaversine,
      ),
    )

  const centralAngle =
    2 *
    Math.atan2(
      Math.sqrt(
        haversine,
      ),
      Math.sqrt(
        1 -
          haversine,
      ),
    )

  const distance =
    EARTH_RADIUS_M *
    centralAngle

  if (
    !Number.isFinite(
      distance,
    )
  ) {
    return 0
  }

  return Math.max(
    0,
    distance,
  )
}

// -------------------- Cálculo de área geográfica --------------------

export function calculateGeographicAreaHectares(
  points:
    GeographicPoint[],
): number {
  if (
    !Array.isArray(
      points,
    ) ||
    points.length < 3
  ) {
    return 0
  }

  for (
    const point of points
  ) {
    if (
      !isValidGeoPoint(
        point,
      )
    ) {
      return 0
    }
  }

  let sum = 0

  for (
    let i = 0;
    i < points.length;
    i += 1
  ) {
    const p1 =
      points[i]

    const p2 =
      points[
        (i + 1) %
          points.length
      ]

    const lat1 =
      degreesToRadians(
        p1.latitude,
      )

    const lat2 =
      degreesToRadians(
        p2.latitude,
      )

    const lon1 =
      degreesToRadians(
        p1.longitude,
      )

    const lon2 =
      degreesToRadians(
        p2.longitude,
      )

    const dLon =
      normalizeLongitudeDeltaRadians(
        lon2 - lon1,
      )

    sum +=
      dLon *
      (
        2 +
        Math.sin(lat1) +
        Math.sin(lat2)
      )
  }

  const areaM2 =
    Math.abs(
      (
        sum *
        EARTH_RADIUS_M *
        EARTH_RADIUS_M
      ) /
        2,
    )

  if (
    !Number.isFinite(
      areaM2,
    )
  ) {
    return 0
  }

  return (
    areaM2 / 10000
  )
}