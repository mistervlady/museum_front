import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'
import Header from '@/components/layout/Header'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import {
  acceptInvite,
  createMuseum,
  createMuseumInvite,
  getStaffMuseums,
} from '@/api/endpoints'
import type { StaffInvite, StaffMuseum } from '@/types'
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
  const [inviteMuseumId, setInviteMuseumId] = useState<number | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteResult, setInviteResult] = useState<StaffInvite | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [manualInviteCode, setManualInviteCode] = useState('')
  const [manualInviteLoading, setManualInviteLoading] = useState(false)
  const [manualInviteMessage, setManualInviteMessage] = useState<string | null>(null)

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

  const handleGoToAdmin = (museumId: number) => {
    navigate(`/admin?museum=${museumId}`)
  }

  const isSuperAdmin = userRole === STAFF_ROLES.SUPERADMIN
  const canGenerateInvite = userRole === STAFF_ROLES.SUPERADMIN || userRole === STAFF_ROLES.OWNER

  const getRoleDisplayName = (role?: string) => {
    if (!role) return 'Роль не указана'
    const normalized = role.toLowerCase() as StaffRole
    return ROLE_DISPLAY_NAMES[normalized] ?? role
  }

  const inviteUrl =
    inviteResult?.url ??
    (inviteResult?.token
      ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/invite/${inviteResult.token}`
      : null)

  const handleGenerateInvite = async () => {
    const selectedMuseumId = inviteMuseumId ?? museums[0]?.id
    if (!selectedMuseumId) return
    setInviteLoading(true)
    setInviteError(null)
    setInviteResult(null)
    try {
      const invite = await createMuseumInvite(selectedMuseumId)
      setInviteResult(invite)
    } catch (e) {
      setInviteError((e as Error).message)
    } finally {
      setInviteLoading(false)
    }
  }

  const handleAcceptManualInvite = async () => {
    const token = manualInviteCode.trim()
    if (!token) return
    setManualInviteLoading(true)
    setManualInviteMessage(null)
    try {
      await acceptInvite(token)
      setManualInviteMessage('Приглашение успешно применено.')
      setManualInviteCode('')
      await loadMuseums()
    } catch (e) {
      setManualInviteMessage((e as Error).message)
    } finally {
      setManualInviteLoading(false)
    }
  }

  useEffect(() => {
    if (!inviteMuseumId && museums[0]?.id) {
      setInviteMuseumId(museums[0].id)
    }
  }, [inviteMuseumId, museums])

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
                {museums.map((museum) => (
                  <Card
                    key={museum.id}
                    className="flex flex-col gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="text-museum-100 font-semibold">{museum.name}</p>
                        <span className="badge badge-gold text-xs">
                          {getRoleDisplayName(museum.role)}
                        </span>
                      </div>
                      <p className="text-xs text-museum-500">{museum.description ?? 'Описание не указано'}</p>
                    </div>
                    <Card hoverable className="group p-4" onClick={() => handleGoToAdmin(museum.id)}>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-museum-800 border border-museum-600 flex items-center justify-center shrink-0 group-hover:border-gold/60 transition-colors">
                          <Settings className="w-5 h-5 text-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif font-semibold text-museum-50 text-base mb-1 group-hover:text-gold transition-colors">
                            Администрирование
                          </h4>
                          <p className="text-museum-400 text-sm leading-relaxed mb-3">
                            Загрузите новые экспонаты и настройте схему залов выбранного музея.
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {['Загрузка данных', 'Схема залов'].map((tag) => (
                              <span key={tag} className="badge badge-gold text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Card>
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

            {canGenerateInvite && (
              <Card>
                <h3 className="section-title">Сгенерировать приглашение</h3>
                <div className="flex flex-col gap-3">
                  <select
                    className="input"
                    value={inviteMuseumId ?? ''}
                    onChange={(e) => setInviteMuseumId(Number(e.target.value))}
                    disabled={museums.length === 0}
                  >
                    {museums.map((museum) => (
                      <option key={museum.id} value={museum.id}>
                        {museum.name}
                      </option>
                    ))}
                  </select>
                  {museums.length === 0 && (
                    <div className="text-xs text-museum-400 border border-museum-700 rounded-xl px-3 py-2">
                      Нет доступных музеев для генерации приглашения.
                    </div>
                  )}
                  {inviteError && (
                    <div className="text-xs text-red-400 border border-red-700/40 bg-red-950/40 rounded-xl px-3 py-2">
                      {inviteError}
                    </div>
                  )}
                  {inviteResult && (
                    <div className="text-xs text-museum-300 border border-museum-700 rounded-xl px-3 py-2 break-all">
                      <p className="mb-1">Код: {inviteResult.token}</p>
                      {inviteUrl && <p>Ссылка: {inviteUrl}</p>}
                    </div>
                  )}
                  <Button
                    loading={inviteLoading}
                    onClick={handleGenerateInvite}
                    disabled={museums.length === 0}
                  >
                    Сгенерировать приглашение
                  </Button>
                </div>
              </Card>
            )}

            <Card>
              <h3 className="section-title">Принять приглашение</h3>
              <div className="flex flex-col gap-3">
                <input
                  className="input"
                  placeholder="Введите код приглашения"
                  value={manualInviteCode}
                  onChange={(e) => setManualInviteCode(e.target.value)}
                />
                {manualInviteMessage && (
                  <div className="text-xs text-museum-300 border border-museum-700 rounded-xl px-3 py-2">
                    {manualInviteMessage}
                  </div>
                )}
                <Button
                  loading={manualInviteLoading}
                  onClick={handleAcceptManualInvite}
                  disabled={!manualInviteCode.trim()}
                >
                  Применить код
                </Button>
              </div>
            </Card>
          </div>
        </motion.div>
      </PageLayout>
    </>
  )
}
