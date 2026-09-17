import { ReactNode } from 'react'

export default function ErrorMessage({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
      {children}
    </div>
  )
}