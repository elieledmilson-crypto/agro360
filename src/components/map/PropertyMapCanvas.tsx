import { useRef, useState } from 'react'
import { LandArea, LandAreaMapLayout } from '../../types'
import {
  MAP_CANVAS_HEIGHT,
  MAP_CANVAS_WIDTH,
  getLayoutShapePoints,
} from '../../services/propertyMapService'
import { getMapTypeStyle } from './mapTypeStyles'

const MIN_SIZE = 30
const MAX_LABEL_LENGTH = 12
const VERTEX_HANDLE_RADIUS = 6
const VERTEX_HIT_RADIUS = 16

interface Props {
  areas: LandArea[]
  layouts: LandAreaMapLayout[]
  selectedAreaId: string | null
  onSelectArea: (id: string | null) => void
  editMode: boolean
  onLayoutsChange: (layouts: LandAreaMapLayout[]) => void
}

type DragState =
  | {
      kind: 'move'
      areaId: string
      startX: number
      startY: number
      origX: number
      origY: number
      width: number
      height: number
    }
  | {
      kind: 'resize'
      areaId: string
      startX: number
      startY: number
      origX: number
      origY: number
      width: number
      height: number
    }
  | {
      kind: 'vertex'
      areaId: string
      index: number
    }
  | null

export default function PropertyMapCanvas({
  areas,
  layouts,
  selectedAreaId,
  onSelectArea,
  editMode,
  onLayoutsChange,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragState, setDragState] = useState<DragState>(null)

  function clientToSvg(clientX: number, clientY: number) {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }

    const rect = svg.getBoundingClientRect()

    if (rect.width === 0 || rect.height === 0) {
      return { x: 0, y: 0 }
    }

    const x = ((clientX - rect.left) / rect.width) * MAP_CANVAS_WIDTH
    const y = ((clientY - rect.top) / rect.height) * MAP_CANVAS_HEIGHT

    return { x, y }
  }

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
  }

  function capturePointer(pointerId: number) {
    const svg = svgRef.current
    if (!svg) return

    try {
      svg.setPointerCapture(pointerId)
    } catch {
      // silencioso
    }
  }

  function releasePointer(pointerId: number) {
    const svg = svgRef.current
    if (!svg) return

    try {
      svg.releasePointerCapture(pointerId)
    } catch {
      // silencioso
    }
  }

  function startMove(
    event: React.PointerEvent<SVGElement>,
    layout: LandAreaMapLayout,
  ) {
    onSelectArea(layout.landAreaId)

    if (!editMode) return

    event.stopPropagation()
    capturePointer(event.pointerId)

    const pt = clientToSvg(event.clientX, event.clientY)

    setDragState({
      kind: 'move',
      areaId: layout.landAreaId,
      startX: pt.x,
      startY: pt.y,
      origX: layout.x,
      origY: layout.y,
      width: layout.width,
      height: layout.height,
    })
  }

  function startResize(
    event: React.PointerEvent<SVGRectElement>,
    layout: LandAreaMapLayout,
  ) {
    if (!editMode) return

    event.stopPropagation()
    capturePointer(event.pointerId)

    const pt = clientToSvg(event.clientX, event.clientY)

    setDragState({
      kind: 'resize',
      areaId: layout.landAreaId,
      startX: pt.x,
      startY: pt.y,
      origX: layout.x,
      origY: layout.y,
      width: layout.width,
      height: layout.height,
    })
  }

  function startVertexDrag(
    event: React.PointerEvent<SVGCircleElement>,
    layout: LandAreaMapLayout,
    index: number,
  ) {
    if (!editMode) return

    event.stopPropagation()
    capturePointer(event.pointerId)

    setDragState({
      kind: 'vertex',
      areaId: layout.landAreaId,
      index,
    })
  }

  function handlePointerMove(
    event: React.PointerEvent<SVGSVGElement>,
  ) {
    if (!dragState) return

    const pt = clientToSvg(
      event.clientX,
      event.clientY,
    )

    if (dragState.kind === 'vertex') {
      const layout = layouts.find(
        l => l.landAreaId === dragState.areaId,
      )

      if (!layout) return
      if (!layout.points || layout.points.length < 3) return

      const relX = clamp(
        (pt.x - layout.x) / layout.width,
        0,
        1,
      )

      const relY = clamp(
        (pt.y - layout.y) / layout.height,
        0,
        1,
      )

      const newPoints = layout.points.map((p, i) =>
        i === dragState.index
          ? { x: relX, y: relY }
          : p,
      )

      const updated = layouts.map(l =>
        l.landAreaId === dragState.areaId
          ? { ...l, points: newPoints }
          : l,
      )

      onLayoutsChange(updated)

      return
    }

    const dx = pt.x - dragState.startX
    const dy = pt.y - dragState.startY

    const updated = layouts.map(layout => {
      if (layout.landAreaId !== dragState.areaId) {
        return layout
      }

      if (dragState.kind === 'move') {
        const newX = clamp(
          dragState.origX + dx,
          0,
          MAP_CANVAS_WIDTH - dragState.width,
        )

        const newY = clamp(
          dragState.origY + dy,
          0,
          MAP_CANVAS_HEIGHT - dragState.height,
        )

        return {
          ...layout,
          x: newX,
          y: newY,
        }
      }

      const newW = clamp(
        dragState.width + dx,
        MIN_SIZE,
        MAP_CANVAS_WIDTH - dragState.origX,
      )

      const newH = clamp(
        dragState.height + dy,
        MIN_SIZE,
        MAP_CANVAS_HEIGHT - dragState.origY,
      )

      return {
        ...layout,
        width: newW,
        height: newH,
      }
    })

    onLayoutsChange(updated)
  }

  function handlePointerUp(
    event: React.PointerEvent<SVGSVGElement>,
  ) {
    if (!dragState) return

    releasePointer(event.pointerId)
    setDragState(null)
  }

  const layoutsById = new Map(
    layouts.map(layout => [
      layout.landAreaId,
      layout,
    ]),
  )

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_CANVAS_WIDTH} ${MAP_CANVAS_HEIGHT}`}
        className="w-full h-auto"
        style={{
          touchAction: editMode
            ? 'none'
            : 'auto',
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="img"
        aria-label="Mapa esquemático da propriedade"
      >
        <rect
          x={0}
          y={0}
          width={MAP_CANVAS_WIDTH}
          height={MAP_CANVAS_HEIGHT}
          className="fill-transparent"
          onPointerDown={() => {
            if (!editMode) {
              onSelectArea(null)
            }
          }}
        />

        {areas.map(area => {
          const layout = layoutsById.get(area.id)

          if (!layout) {
            return null
          }

          const styles = getMapTypeStyle(area.type)
          const isSelected = selectedAreaId === area.id

          const label =
            area.code.length > MAX_LABEL_LENGTH
              ? `${area.code.slice(0, MAX_LABEL_LENGTH - 1)}…`
              : area.code

          const fontSize = Math.max(
            10,
            Math.min(16, layout.width / 8),
          )

          const relPoints = getLayoutShapePoints(layout)

          const pointsAttr = relPoints
            .map(
              p =>
                `${layout.x + p.x * layout.width},${
                  layout.y + p.y * layout.height
                }`,
            )
            .join(' ')

          const isFreeEditable =
            editMode &&
            isSelected &&
            layout.shapeType === 'free' &&
            layout.points &&
            layout.points.length >= 3

          return (
            <g key={area.id}>
              <polygon
                points={pointsAttr}
                style={{
                  strokeWidth: isSelected ? 4 : 2,
                  cursor: editMode ? 'move' : 'pointer',
                }}
                className={`${styles.rectClass} transition-colors`}
                onPointerDown={event =>
                  startMove(event, layout)
                }
                role="button"
                tabIndex={0}
                aria-label={`Área ${area.code} — ${area.name}`}
                aria-pressed={isSelected}
                onKeyDown={event => {
                  if (
                    event.key === 'Enter' ||
                    event.key === ' '
                  ) {
                    event.preventDefault()
                    onSelectArea(area.id)
                  }
                }}
              />

              <text
                x={layout.x + layout.width / 2}
                y={layout.y + layout.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize }}
                className={`pointer-events-none select-none ${styles.textClass}`}
              >
                {label}
              </text>

              {isFreeEditable &&
                relPoints.map((p, index) => {
                  const cx =
                    layout.x +
                    p.x * layout.width

                  const cy =
                    layout.y +
                    p.y * layout.height

                  return (
                    <g key={index}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={VERTEX_HIT_RADIUS}
                        fill="transparent"
                        style={{
                          cursor: 'grab',
                        }}
                        onPointerDown={event =>
                          startVertexDrag(
                            event,
                            layout,
                            index,
                          )
                        }
                      />

                      <circle
                        cx={cx}
                        cy={cy}
                        r={VERTEX_HANDLE_RADIUS}
                        style={{
                          pointerEvents: 'none',
                        }}
                        className="fill-amber-500 stroke-white dark:fill-amber-400 dark:stroke-gray-900"
                      />
                    </g>
                  )
                })}

              {editMode && (
                <rect
                  x={layout.x + layout.width - 8}
                  y={layout.y + layout.height - 8}
                  width={16}
                  height={16}
                  rx={3}
                  style={{
                    cursor: 'nwse-resize',
                  }}
                  className="fill-white stroke-gray-700 dark:fill-gray-900 dark:stroke-gray-300"
                  onPointerDown={event =>
                    startResize(event, layout)
                  }
                  aria-label={`Redimensionar ${area.code}`}
                />
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}