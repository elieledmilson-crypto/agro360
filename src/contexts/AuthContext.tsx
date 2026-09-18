import {
  createContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react'
import { User } from '../types'
import * as authService from '../services/authService'
import { supabase } from '../lib/supabase'
import { resetStorageBackend } from '../services/storage'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (
    email: string,
    password: string,
  ) => Promise<User>
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<authService.RegisterResponse>
  logout: () => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType,
)

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const currentUser = await authService.getCurrentUser()
    setUser(currentUser)
  }, [])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          resetStorageBackend()
          setUser(null)
        }
      },
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let active = true

    const restore = async () => {
      try {
        const currentUser = await authService.getCurrentUser()

        if (active) {
          setUser(currentUser)
        }
      } catch {
        if (active) {
          setUser(null)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void restore()

    return () => {
      active = false
    }
  }, [])

  const login = async (
    email: string,
    password: string,
  ): Promise<User> => {
    resetStorageBackend()
    const loggedUser = await authService.login(email, password)
    setUser(loggedUser)
    return loggedUser
  }

  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<authService.RegisterResponse> => {
    const result = await authService.register(
      name,
      email,
      password,
    )

    if (result.user) {
      setUser(result.user)
    }

    return result
  }

  const logout = () => {
    resetStorageBackend()
    setUser(null)

    void authService.logout().catch(() => {
      // A sessão local já foi limpa da interface.
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}