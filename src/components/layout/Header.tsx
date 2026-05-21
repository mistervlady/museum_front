import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Settings, Map, Moon, Sun } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/auth/AuthProvider'

interface HeaderProps {
  title?: string
  showBack?: boolean
  backTo?: string
  showAdmin?: boolean
  className?: string
}

export default function Header({
  title,
  showBack = false,
  backTo,
  showAdmin = false,
  className,
}: HeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, logout } = useAuth()
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = window.localStorage.getItem('theme')
    return stored === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('theme-light', 'theme-dark')
    root.classList.add(`theme-${theme}`)
    window.localStorage.setItem('theme', theme)
  }, [theme])

  const handleBack = () => {
    if (backTo) navigate(backTo)
    else navigate(-1)
  }

  const handleLogout = () => {
    logout()
    if (location.pathname.startsWith('/staff')) {
      navigate('/')
    }
  }

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-50',
        'bg-museum-950/90 backdrop-blur-md border-b border-museum-800',
        className,
      )}
    >
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left */}
        <div className="w-10">
          {showBack && (
            <button
              onClick={handleBack}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-museum-800 text-museum-400 hover:text-museum-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Center */}
        <div className="flex items-center gap-2">
          {!showBack && (
            <div className="w-6 h-6 rounded-md bg-gold flex items-center justify-center">
              <Map className="w-3.5 h-3.5 text-museum-950" />
            </div>
          )}
          <span className="font-serif font-bold text-museum-50 text-sm">
            {title ?? 'Музейный Гид'}
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-museum-800 text-museum-400 hover:text-museum-100 transition-colors"
            title={theme === 'light' ? 'Темная тема' : 'Светлая тема'}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          {isAuthenticated ? (
            <>
              {location.pathname !== '/staff' && (
                <button
                  onClick={() => navigate('/staff')}
                  className="px-3 py-2 text-xs rounded-full border border-museum-600 text-museum-200 hover:border-gold hover:text-gold transition-colors"
                >
                  Кабинет
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-xs rounded-full border border-museum-600 text-museum-200 hover:border-gold hover:text-gold transition-colors"
              >
                Выйти
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/staff/login')}
              className="px-3 py-2 text-xs rounded-full border border-museum-600 text-museum-200 hover:border-gold hover:text-gold transition-colors"
            >
              Войти
            </button>
          )}

          {showAdmin && location.pathname !== '/admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-museum-800 text-museum-400 hover:text-museum-100 transition-colors"
              title="Админ-панель"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
