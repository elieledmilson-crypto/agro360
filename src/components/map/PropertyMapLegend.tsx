import { MAP_TYPE_ORDER, getMapTypeStyle } from './mapTypeStyles'

export default function PropertyMapLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {MAP_TYPE_ORDER.map(type => {
        const styles = getMapTypeStyle(type)

        return (
          <div key={type} className="flex items-center gap-2">
            <span
              className={`inline-block w-4 h-4 rounded border ${styles.swatchClass}`}
              aria-hidden="true"
            />
            <span className="text-gray-700 dark:text-gray-300">
              {type}
            </span>
          </div>
        )
      })}
    </div>
  )
}