import { useEffect, useRef } from 'react'

type PageFeedbackType = 'success' | 'error' | 'warning' | 'info'

interface PageFeedbackProps {
  type: PageFeedbackType
  message: string
  className?: string
}

const pageFeedbackStyles: Record<PageFeedbackType, string> = {
  success: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  error: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  warning: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  info: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
}

const pageFeedbackRoles: Record<PageFeedbackType, 'alert' | 'status'> = {
  success: 'status',
  error: 'alert',
  warning: 'alert',
  info: 'status',
}

export default function PageFeedback({
  type,
  message,
  className = '',
}: PageFeedbackProps) {
  const feedbackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!message) return

    const frame = requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [message])

  return (
    <div
      ref={feedbackRef}
      role={pageFeedbackRoles[type]}
      aria-live={type === 'error' || type === 'warning' ? 'assertive' : 'polite'}
      className={`scroll-mt-20 p-4 rounded-lg ${pageFeedbackStyles[type]} ${className}`}
    >
      {message}
    </div>
  )
}