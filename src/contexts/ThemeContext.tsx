import {
  createContext,
  useState,
  ReactNode,
  useEffect,
} from 'react'

interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextType>(
  {} as ThemeContextType,
)

const STORAGE_KEY = 'agro360_theme'

export function ThemeProvider({
  children,
}: {
  children: ReactNode
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (stored === 'dark' || stored === 'light') {
      return stored
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      theme === 'dark',
    )

    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev =>
      prev === 'light' ? 'dark' : 'light',
    )
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}