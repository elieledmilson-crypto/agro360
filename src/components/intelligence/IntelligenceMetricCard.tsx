import Card from '../ui/Card'

type Tone = 'neutral' | 'attention' | 'opportunity' | 'information'

const TONE_CLASSES: Record<Tone, string> = {
  neutral:
    'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  attention:
    'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  opportunity:
    'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  information:
    'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
}

interface Props {
  label: string
  value: string | number
  helper?: string
  tone?: Tone
}

export default function IntelligenceMetricCard({
  label,
  value,
  helper,
  tone = 'neutral',
}: Props) {
  return (
    <Card className="p-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {label}
      </p>

      <p
        className={`mt-1 inline-flex items-center px-2 py-1 rounded-lg text-xl font-bold ${TONE_CLASSES[tone]}`}
      >
        {value}
      </p>

      {helper && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {helper}
        </p>
      )}
    </Card>
  )
}