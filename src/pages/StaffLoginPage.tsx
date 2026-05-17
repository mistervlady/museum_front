import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useAuth } from '@/auth/AuthProvider'

type Mode = 'login' | 'register'

export default function StaffLoginPage() {
  const navigate = useNavigate()
  const { login, register, isAuthenticated } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/staff')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'login') {
        await login({ email, password })
      } else {
        await register({ name: name || undefined, email, password })
      }
      navigate('/staff')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header title="Вход для сотрудников" showBack backTo="/" />
      <PageLayout>
        <motion.div
          className="flex flex-col gap-6 py-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setMode('login')}
                className={`px-3 py-2 rounded-full text-xs ${
                  mode === 'login'
                    ? 'bg-gold/20 text-gold border border-gold/40'
                    : 'border border-museum-700 text-museum-400'
                }`}
              >
                Войти
              </button>
              <button
                onClick={() => setMode('register')}
                className={`px-3 py-2 rounded-full text-xs ${
                  mode === 'register'
                    ? 'bg-gold/20 text-gold border border-gold/40'
                    : 'border border-museum-700 text-museum-400'
                }`}
              >
                Регистрация
              </button>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <div>
                  <label className="text-xs text-museum-400">Имя</label>
                  <input
                    className="input mt-1"
                    placeholder="Мария"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-museum-400">Email</label>
                <input
                  className="input mt-1"
                  type="email"
                  placeholder="you@museum.ru"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-museum-400">Пароль</label>
                <input
                  className="input mt-1"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="text-xs text-red-400 border border-red-700/40 bg-red-950/40 rounded-xl px-3 py-2">
                  {error}
                </div>
              )}
              <Button type="submit" loading={loading} fullWidth>
                {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
              </Button>
            </form>
          </Card>
        </motion.div>
      </PageLayout>
    </>
  )
}
