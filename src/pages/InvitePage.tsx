import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { useAuth } from '@/auth/AuthProvider'
import { acceptInvite } from '@/api/endpoints'

export default function InvitePage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated, login } = useAuth()
  const [loading, setLoading] = useState(!isAuthenticated)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showForm, setShowForm] = useState(!isAuthenticated)
  const [applyLoading, setApplyLoading] = useState(false)

  // If already authenticated, apply invite immediately
  useEffect(() => {
    if (isAuthenticated && code && !applyLoading) {
      applyInviteCode()
    }
  }, [isAuthenticated, code])

  const applyInviteCode = async () => {
    if (!code) return
    setApplyLoading(true)
    setError(null)
    try {
      await acceptInvite(code)
      navigate('/staff')
    } catch (e) {
      setError((e as Error).message)
      setApplyLoading(false)
    }
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login({ email, password })
      setShowForm(false)
      // Will auto-apply via useEffect
    } catch (e) {
      setError((e as Error).message)
      setLoading(false)
    }
  }

  if (!code) {
    return (
      <>
        <Header title="Ошибка" showBack backTo="/staff/login" />
        <PageLayout>
          <Card className="text-center text-red-400 border-red-700/40 bg-red-950/40">
            Неверная ссылка приглашения
          </Card>
        </PageLayout>
      </>
    )
  }

  if (isAuthenticated && applyLoading) {
    return (
      <>
        <Header title="Применение приглашения" />
        <PageLayout>
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        </PageLayout>
      </>
    )
  }

  if (!isAuthenticated || showForm) {
    return (
      <>
        <Header title="Вход для приглашённого сотрудника" showBack backTo="/" />
        <PageLayout>
          <motion.div
            className="flex flex-col gap-6 py-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <h2 className="text-lg font-semibold text-museum-100 mb-4">
                Введите учётные данные
              </h2>
              <p className="text-sm text-museum-400 mb-6">
                После входа приглашение будет применено автоматически.
              </p>

              <form className="flex flex-col gap-4" onSubmit={handleLogin}>
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
                  Войти и применить приглашение
                </Button>
              </form>
            </Card>
          </motion.div>
        </PageLayout>
      </>
    )
  }

  return (
    <>
      <Header title="Приглашение" showBack backTo="/staff" />
      <PageLayout>
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </PageLayout>
    </>
  )
}
