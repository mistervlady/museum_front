import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useAuth } from '@/auth/AuthProvider'
import { ROLE_DISPLAY_NAMES } from '@/auth/constants'
import { isMockEnabled, MOCK_ROLE_ACCOUNTS, MOCK_ROLE_INVITE_LINKS } from '@/api/mock'

export default function StaffLoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mockMode = isMockEnabled()
  const roleOrder = ['superadmin', 'owner', 'editor', 'viewer'] as const

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
      await login({ email, password })
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
            <h2 className="text-xl font-semibold text-museum-100 mb-6">Вход</h2>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
                Войти
              </Button>
            </form>

            <p className="text-xs text-museum-400 mt-6">
              Нет аккаунта? Получите приглашение от владельца музея.
            </p>
          </Card>

          {mockMode && (
            <Card>
              <h3 className="text-lg font-semibold text-museum-100 mb-4">Мок-аккаунты по ролям</h3>
              <div className="flex flex-col gap-3">
                {roleOrder.map((role) => (
                  <div key={role} className="border border-museum-700 rounded-xl p-3">
                    <p className="text-sm font-medium text-museum-100">{ROLE_DISPLAY_NAMES[role]}</p>
                    <p className="text-xs text-museum-400 mt-1">Логин: {MOCK_ROLE_ACCOUNTS[role].email}</p>
                    <p className="text-xs text-museum-400">Пароль: {MOCK_ROLE_ACCOUNTS[role].password}</p>
                    <p className="text-xs text-museum-400 break-all mt-1">
                      Ссылка приглашения: {MOCK_ROLE_INVITE_LINKS[role]}
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-2"
                      onClick={() => {
                        setEmail(MOCK_ROLE_ACCOUNTS[role].email)
                        setPassword(MOCK_ROLE_ACCOUNTS[role].password)
                      }}
                    >
                      Подставить данные
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </motion.div>
      </PageLayout>
    </>
  )
}
