import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?:
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
}

export default function Badge({
  children,
  variant = 'info',
}: BadgeProps) {
  const variants = {
    success:
      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',

    warning:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',

    danger:
      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',

    info:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  }

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${variants[variant]}`}
    >
      {children}
    </span>
  )
}