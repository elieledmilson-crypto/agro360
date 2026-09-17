import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export default function Card({
  children,
  className = '',
}: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 ${className}`}
    >
      {children}
    </div>
  )
}