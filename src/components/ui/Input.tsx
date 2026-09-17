import { InputHTMLAttributes } from 'react'

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export default function Input({
  label,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId =
    id ||
    label
      ?.toLowerCase()
      .replace(/\s+/g, '-')

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium mb-1"
        >
          {label}
        </label>
      )}

      <input
        id={inputId}
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 ${className}`}
        {...props}
      />
    </div>
  )
}