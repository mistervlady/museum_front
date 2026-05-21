import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getCurrentUser, loginStaff, registerStaff } from '@/api/endpoints'
import type { AuthSession, LoginPayload, RegisterPayload, StaffUser } from '@/types'
import { clearStoredToken, getStoredToken, setStoredToken } from './token'

interface AuthContextValue {
  user: StaffUser | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<StaffUser>
  register: (payload: RegisterPayload) => Promise<StaffUser>
  refresh: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null)
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    const stored = getStoredToken()
    if (!stored) {
      setUser(null)
      setToken(null)
      return
    }
    setToken(stored)
    try {
      const freshUser = await getCurrentUser()
      setUser(freshUser)
    } catch {
      logout()
    }
  }, [logout])

  useEffect(() => {
    const stored = getStoredToken()
    if (!stored) {
      setLoading(false)
      return
    }
    setToken(stored)
    getCurrentUser()
      .then((profile) => setUser(profile))
      .catch(() => logout())
      .finally(() => setLoading(false))
  }, [logout])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleLogout = () => logout()
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [logout])

  const applySession = useCallback(
    async (session: AuthSession) => {
      if (!session.token && !session.user) {
        throw new Error('Не удалось получить данные авторизации')
      }
      if (session.token) {
        setStoredToken(session.token)
        setToken(session.token)
      }
      if (session.user) {
        setUser(session.user)
        return session.user
      }
      const freshUser = await getCurrentUser()
      setUser(freshUser)
      return freshUser
    },
    [],
  )

  const login = useCallback(
    async (payload: LoginPayload) => {
      const session = await loginStaff(payload)
      return applySession(session)
    },
    [applySession],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const session = await registerStaff(payload)
      return applySession(session)
    },
    [applySession],
  )

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      refresh,
      logout,
    }),
    [user, token, loading, login, register, refresh, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
