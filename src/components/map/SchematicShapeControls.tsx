import {
  LandAreaMapLayout,
  SchematicShapeType,
} from '../../types'
import { applyShapeType } from '../../services/propertyMapService'
import Card from '../ui/Card'

interface Props {
  layout: LandAreaMapLayout | null
  areaLabel: string | null
  onLayoutChange: (layout: LandAreaMapLayout) => void
}

const SHAPE_OPTIONS: {
  type: SchematicShapeType
  label: string
}[] = [
  {
    type: 'rectangle',
    label: 'Retangular',
  },
  {
    type: 'l-shape',
    label: 'Em L',
  },
  {
    type: 'triangle',
    label: 'Triangular',
  },
  {
    type: 'trapezoid',
    label: 'Trapezoidal',
  },
  {
    type: 'free',
    label: 'Forma livre',
  },
]

export default function SchematicShapeControls({
  layout,
  areaLabel,
  onLayoutChange,
}: Props) {
  if (!layout) {
    return null
  }

  const currentType:
    SchematicShapeType =
    layout.shapeType ??
    'rectangle'

  const isFree =
    currentType === 'free'

  const pointsCount =
    layout.points?.length ??
    0

  function handleAddVertex() {
    if (!layout) {
      return
    }

    const pts =
      layout.points ?? []

    if (
      pts.length < 2
    ) {
      return
    }

    const last =
      pts[
        pts.length - 1
      ]

    const first =
      pts[0]

    const mid = {
      x:
        (
          last.x +
          first.x
        ) /
        2,

      y:
        (
          last.y +
          first.y
        ) /
        2,
    }

    onLayoutChange({
      ...layout,
      points: [
        ...pts,
        mid,
      ],
    })
  }

  function handleRemoveVertex() {
    if (!layout) {
      return
    }

    const pts =
      layout.points ?? []

    if (
      pts.length <= 3
    ) {
      return
    }

    onLayoutChange({
      ...layout,
      points:
        pts.slice(
          0,
          -1,
        ),
    })
  }

  return (
    <Card className="p-4 space-y-3">
      <div>
        <p className="text-sm font-medium">
          Forma da área
        </p>

        {areaLabel && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {areaLabel}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {SHAPE_OPTIONS.map(option => (
          <button
            key={option.type}
            type="button"
            onClick={() =>
              onLayoutChange(
                applyShapeType(
                  layout,
                  option.type,
                ),
              )
            }
            className={`px-3 py-1.5 rounded-lg text-sm border transition ${
              currentType === option.type
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isFree && (
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Arraste os vértices no mapa para ajustar a forma. Use os
            botões abaixo para adicionar ou remover vértices.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAddVertex}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Adicionar vértice
            </button>

            <button
              type="button"
              onClick={handleRemoveVertex}
              disabled={pointsCount <= 3}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remover último vértice
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {pointsCount} vértices
          </p>
        </div>
      )}
    </Card>
  )
}