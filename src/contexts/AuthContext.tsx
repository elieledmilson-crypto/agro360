import {
  createContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { User } from '../types'
import * as authService from '../services/authService'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (
    email: string,
    password: string,
    remember: boolean,
  ) => Promise<void>
  logout: () => void
  refreshUser: () => void
}

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType,
)

const STORAGE_KEY = 'agro360_user'

function readStoredCandidate(): unknown {
  const local = localStorage.getItem(STORAGE_KEY)
  if (local) {
    try {
      return JSON.parse(local) as unknown
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const session = sessionStorage.getItem(STORAGE_KEY)
  if (session) {
    try {
      return JSON.parse(session) as unknown
    } catch {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }

  return null
}

function getStoredUser(): User | null {
  const candidate = readStoredCandidate()

  if (candidate === null) return null

  const restored = authService.restoreSessionUser(candidate)

  if (!restored) {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
    return null
  }

  return restored
}

function persistUser(user: User, remember: boolean): void {
  if (remember) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    sessionStorage.removeItem(STORAGE_KEY)
  } else {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [user, setUser] = useState<User | null>(
    () => getStoredUser(),
  )

  const isAuthenticated = !!user

  const login = async (
    email: string,
    password: string,
    remember: boolean,
  ) => {
    const { user: loggedUser } = await authService.login(
      email,
      password,
    )

    persistUser(loggedUser, remember)

    setUser(loggedUser)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)

    setUser(null)
  }

  const refreshUser = useCallback(() => {
    const candidate = readStoredCandidate()

    if (candidate === null) {
      setUser(null)
      return
    }

    const restored = authService.restoreSessionUser(candidate)

    if (!restored) {
      localStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(STORAGE_KEY)
      setUser(null)
      return
    }

    // Atualiza o storage onde a sessão estava
    const inLocal = localStorage.getItem(STORAGE_KEY) !== null
    const inSession = sessionStorage.getItem(STORAGE_KEY) !== null

    if (inLocal) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(restored))
    }

    if (inSession) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(restored))
    }

    setUser(restored)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}