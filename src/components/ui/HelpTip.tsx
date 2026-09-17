import { useState, useRef, useEffect, useLayoutEffect, useId } from 'react'
import { HelpCircle } from 'lucide-react'

interface HelpTipProps {
  title: string
  description: string
  className?: string
}

const VIEWPORT_MARGIN = 16

export default function HelpTip({
  title,
  description,
  className = '',
}: HelpTipProps) {
  const [open, setOpen] = useState(false)
  const [panelLeft, setPanelLeft] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const container = containerRef.current
      const button = buttonRef.current
      const panel = panelRef.current

      if (!container || !button || !panel) return

      const containerRect = container.getBoundingClientRect()
      const buttonRect = button.getBoundingClientRect()
      const panelWidth = panel.offsetWidth

      const buttonCenter = buttonRect.left + buttonRect.width / 2
      let desiredLeftViewport = buttonCenter - panelWidth / 2

      const minLeftViewport = VIEWPORT_MARGIN
      const maxLeftViewport = Math.max(
        VIEWPORT_MARGIN,
        window.innerWidth - panelWidth - VIEWPORT_MARGIN
      )

      if (desiredLeftViewport < minLeftViewport) {
        desiredLeftViewport = minLeftViewport
      }

      if (desiredLeftViewport > maxLeftViewport) {
        desiredLeftViewport = maxLeftViewport
      }

      setPanelLeft(desiredLeftViewport - containerRect.left)
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('resize', updatePosition)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className={`relative inline-flex ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Ajuda: ${title}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-describedby={open ? panelId : undefined}
        onClick={() => setOpen(prev => !prev)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <HelpCircle className="w-4 h-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="tooltip"
          style={{ left: panelLeft }}
          className="absolute top-full mt-2 w-72 max-w-[calc(100vw-2rem)] z-50 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg text-sm"
        >
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {title}
          </p>

          <p className="text-gray-600 dark:text-gray-300 leading-snug">
            {description}
          </p>
        </div>
      )}
    </div>
  )
}