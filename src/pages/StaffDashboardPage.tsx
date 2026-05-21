import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, MapPinned } from 'lucide-react'
import Header from '@/components/layout/Header'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { changeStaffPassword, createMuseum, getStaffMuseums } from '@/api/endpoints'
import type { StaffMuseum } from '@/types'
import { useAuth } from '@/auth/AuthProvider'
import { ROLE_DISPLAY_NAMES, STAFF_ROLES, type StaffRole } from '@/auth/constants'

export default function StaffDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const displayName = user?.name ?? user?.email
  const userRole = user?.role ?? ''
  const [museums, setMuseums] = useState<StaffMuseum[]>([])
  const [museumsLoading, setMuseumsLoading] = useState(true)
  const [museumsError, setMuseumsError] = useState<string | null>(null)

  const [museumName, setMuseumName] = useState('')
  const [museumDescription, setMuseumDescription] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createMessage, setCreateMessage] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)

  const loadMuseums = useCallback(async () => {
    setMuseumsLoading(true)
    setMuseumsError(null)
    try {
      const items = await getStaffMuseums()
      setMuseums(items)
    } catch (e) {
      setMuseumsError((e as Error).message)
    } finally {
      setMuseumsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMuseums()
  }, [loadMuseums])

  const handleCreateMuseum = async () => {
    if (!museumName.trim()) return
    setCreateLoading(true)
    setCreateMessage(null)
    try {
      const created = await createMuseum({ name: museumName.trim(), description: museumDescription.trim() || undefined })
      setMuseums((prev) => [created, ...prev])
      setMuseumName('')
      setMuseumDescription('')
      setCreateMessage('Музей создан и добавлен в список.')
    } catch (e) {
      setCreateMessage((e as Error).message)
    } finally {
      setCreateLoading(false)
    }
  }

  const getRoleDisplayName = (role?: string) => {
    if (!role) return 'Роль не указана'
    const normalized = role.toLowerCase() as StaffRole
    return ROLE_DISPLAY_NAMES[normalized] ?? role
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Новый пароль и подтверждение не совпадают.')
      return
    }
    setPasswordLoading(true)
    setPasswordMessage(null)
    try {
      await changeStaffPassword({ currentPassword, newPassword })
      setPasswordMessage('Пароль успешно обновлён.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e) {
      setPasswordMessage((e as Error).message)
    } finally {
      setPasswordLoading(false)
    }
  }

  const isSuperAdmin = userRole === STAFF_ROLES.SUPERADMIN

  return (
    <>
      <Header title="Кабинет сотрудника" showBack backTo="/" />
      <PageLayout>
        <motion.div
          className="flex flex-col gap-6 py-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h2 className="section-title">
              {displayName ? `Здравствуйте, ${displayName}` : 'Здравствуйте'}
            </h2>
          </div>

          <div className="divider" />

          <div>
            <h3 className="section-title">Мои музеи</h3>
            {museumsLoading ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : museumsError ? (
              <Card className="text-sm text-red-400 border-red-700/40 bg-red-950/40">
                {museumsError}
              </Card>
            ) : museums.length === 0 ? (
              <Card className="text-sm text-museum-400">
                Пока у вас нет музеев. Создайте новый музей или обратитесь к администратору.
              </Card>
            ) : (
              <div className="grid gap-3">
                {museums.map((museum, index) => (
                  <button
                    key={museum.id}
                    onClick={() => navigate(`/staff/museum/${museum.id}`)}
                    className="card-hover flex items-start justify-between gap-4 text-left group"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPinned className="w-5 h-5 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-serif font-semibold text-museum-100 group-hover:text-gold transition-colors">
                            {museum.name}
                          </h3>
                          <span className="badge badge-gold text-xs shrink-0">
                            {getRoleDisplayName(museum.role)}
                          </span>
                        </div>
                        <p className="text-museum-500 text-sm">{museum.description ?? 'Описание не указано'}</p>
                        <span className="inline-block mt-2 text-xs text-museum-600 italic">
                          {museum.accent ?? (index % 2 === 0 ? 'Уникальная коллекция' : 'Экспонаты разных эпох')}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-museum-600 group-hover:text-gold group-hover:translate-x-1 transition-all shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="divider" />

          <div className="grid gap-4">
            {isSuperAdmin && (
              <Card>
                <h3 className="section-title">Создать музей</h3>
                <div className="flex flex-col gap-3">
                  <input
                    className="input"
                    placeholder="Название музея"
                    value={museumName}
                    onChange={(e) => setMuseumName(e.target.value)}
                  />
                  <textarea
                    className="textarea"
                    rows={3}
                    placeholder="Короткое описание (необязательно)"
                    value={museumDescription}
                    onChange={(e) => setMuseumDescription(e.target.value)}
                  />
                  {createMessage && (
                    <div className="text-xs text-museum-400 border border-museum-700 rounded-xl px-3 py-2">
                      {createMessage}
                    </div>
                  )}
                  <Button loading={createLoading} onClick={handleCreateMuseum} disabled={!museumName.trim()}>
                    Создать музей
                  </Button>
                </div>
              </Card>
            )}

            <Card>
              <h3 className="section-title">Профиль</h3>
              <div className="flex flex-col gap-3">
                <input
                  className="input"
                  type="password"
                  placeholder="Текущий пароль"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <input
                  className="input"
                  type="password"
                  placeholder="Новый пароль"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <input
                  className="input"
                  type="password"
                  placeholder="Подтверждение нового пароля"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {passwordMessage && (
                  <div className="text-xs text-museum-300 border border-museum-700 rounded-xl px-3 py-2">
                    {passwordMessage}
                  </div>
                )}
                <Button
                  loading={passwordLoading}
                  onClick={handleChangePassword}
                  disabled={!currentPassword || !newPassword || !confirmPassword}
                >
                  Сменить пароль
                </Button>
              </div>
            </Card>
          </div>
        </motion.div>
      </PageLayout>
    </>
  )
}
