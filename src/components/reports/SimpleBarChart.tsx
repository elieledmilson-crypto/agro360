import Card from '../ui/Card'

interface BarItem {
  label: string
  value: number
}

interface Props {
  title: string
  data: BarItem[]
  valueFormatter?: (value: number) => string
  emptyMessage?: string
}

export default function SimpleBarChart({
  title,
  data,
  valueFormatter,
  emptyMessage,
}: Props) {
  const format = valueFormatter ?? ((v: number) => String(v))

  const maxValue = data.reduce((max, item) => {
    if (Number.isFinite(item.value) && item.value > max) {
      return item.value
    }

    return max
  }, 0)

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        {title}
      </h3>

      {data.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {emptyMessage ?? 'Sem dados.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {data.map(item => {
            const value = Number.isFinite(item.value)
              ? item.value
              : 0

            const pct =
              maxValue > 0
                ? (value / maxValue) * 100
                : 0

            return (
              <li key={item.label}>
                <div className="flex items-center justify-between text-xs mb-1 gap-2">
                  <span className="text-gray-700 dark:text-gray-300 truncate">
                    {item.label}
                  </span>

                  <span className="text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap">
                    {format(value)}
                  </span>
                </div>

                <div className="h-2 rounded bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded bg-green-500 dark:bg-green-600 transition-all"
                    style={{
                      width: `${pct}%`,
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}