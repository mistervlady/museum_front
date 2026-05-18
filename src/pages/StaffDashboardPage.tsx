import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import {
  acceptInvite,
  createMuseum,
  createMuseumInvite,
  getMuseumStaff,
  getStaffMuseums,
} from '@/api/endpoints'
import type { StaffInvite, StaffMember, StaffMuseum } from '@/types'
import { useAuth } from '@/auth/AuthProvider'

export default function StaffDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const displayName = user?.name ?? user?.email
  const [museums, setMuseums] = useState<StaffMuseum[]>([])
  const [museumsLoading, setMuseumsLoading] = useState(true)
  const [museumsError, setMuseumsError] = useState<string | null>(null)
  const [selectedMuseumId, setSelectedMuseumId] = useState<number | null>(null)

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffError, setStaffError] = useState<string | null>(null)

  const [museumName, setMuseumName] = useState('')
  const [museumDescription, setMuseumDescription] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createMessage, setCreateMessage] = useState<string | null>(null)

  const [inviteToken, setInviteToken] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteResult, setInviteResult] = useState<StaffInvite | null>(null)
  const [inviteMessage, setInviteMessage] = useState<string | null>(null)

  const [acceptLoading, setAcceptLoading] = useState(false)
  const [acceptMessage, setAcceptMessage] = useState<string | null>(null)

  const loadMuseums = useCallback(async () => {
    setMuseumsLoading(true)
    setMuseumsError(null)
    try {
      const items = await getStaffMuseums()
      setMuseums(items)
      setSelectedMuseumId((current) => {
        if (current && items.some((museum) => museum.id === current)) return current
        return items[0]?.id ?? null
      })
    } catch (e) {
      setMuseumsError((e as Error).message)
    } finally {
      setMuseumsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMuseums()
  }, [loadMuseums])

  const selectedMuseum = useMemo(
    () => museums.find((museum) => museum.id === selectedMuseumId) ?? null,
    [museums, selectedMuseumId],
  )

  useEffect(() => {
    if (!selectedMuseumId) {
      setStaff([])
      return
    }
    setStaffLoading(true)
    setStaffError(null)
    getMuseumStaff(selectedMuseumId)
      .then(setStaff)
      .catch((e) => setStaffError((e as Error).message))
      .finally(() => setStaffLoading(false))
  }, [selectedMuseumId])

  const handleCreateMuseum = async () => {
    if (!museumName.trim()) return
    setCreateLoading(true)
    setCreateMessage(null)
    try {
      const created = await createMuseum({ name: museumName.trim(), description: museumDescription.trim() || undefined })
      setMuseums((prev) => [created, ...prev])
      setMuseumName('')
      setMuseumDescription('')
      setSelectedMuseumId(created.id)
      setCreateMessage('Музей создан и добавлен в список.')
    } catch (e) {
      setCreateMessage((e as Error).message)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleCreateInvite = async () => {
    if (!selectedMuseumId) return
    setInviteLoading(true)
    setInviteMessage(null)
    try {
      const invite = await createMuseumInvite(selectedMuseumId)
      setInviteResult(invite)
      setInviteMessage('Приглашение создано. Передайте код сотруднику.')
    } catch (e) {
      setInviteMessage((e as Error).message)
    } finally {
      setInviteLoading(false)
    }
  }

  const handleAcceptInvite = async () => {
    if (!inviteToken.trim()) return
    setAcceptLoading(true)
    setAcceptMessage(null)
    try {
      await acceptInvite(inviteToken.trim())
      setAcceptMessage('Приглашение принято. Музей появился в списке.')
      setInviteToken('')
      await loadMuseums()
    } catch (e) {
      setAcceptMessage((e as Error).message)
    } finally {
      setAcceptLoading(false)
    }
  }

  const handleGoToAdmin = (museumId?: number) => {
    const id = museumId ?? selectedMuseumId
    if (id) {
      navigate(`/admin?museum=${id}`)
    }
  }

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
            <p className="section-subtitle">
              Управляйте музеями, приглашайте сотрудников и переходите в админку.
            </p>
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
                Пока у вас нет музеев. Создайте новый или примите приглашение.
              </Card>
            ) : (
              <div className="grid gap-3">
                {museums.map((museum) => (
                  <Card
                    key={museum.id}
                    className={`flex items-center justify-between gap-4 ${
                      selectedMuseumId === museum.id ? 'border-gold/60' : ''
                    }`}
                  >
                    <div>
                      <p className="text-museum-100 font-semibold">{museum.name}</p>
                      <p className="text-xs text-museum-500">{museum.description ?? 'Описание не указано'}</p>
                      {museum.role && (
                        <span className="badge badge-gold mt-2">{museum.role}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleGoToAdmin(museum.id)}>
                        Управлять
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="divider" />

          <div className="grid gap-4">
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

            <Card>
              <h3 className="section-title">Принять приглашение</h3>
              <p className="section-subtitle mb-3">
                Введите код, который прислал владелец музея, чтобы получить доступ.
              </p>
              <div className="flex flex-col gap-3">
                <input
                  className="input"
                  placeholder="Код приглашения"
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                />
                {acceptMessage && (
                  <div className="text-xs text-museum-400 border border-museum-700 rounded-xl px-3 py-2">
                    {acceptMessage}
                  </div>
                )}
                <Button loading={acceptLoading} onClick={handleAcceptInvite} disabled={!inviteToken.trim()}>
                  Принять приглашение
                </Button>
              </div>
            </Card>
          </div>

          <div className="divider" />

          <div className="grid gap-4">
            <Card>
              <h3 className="section-title">Управление музеем</h3>
              {!selectedMuseum ? (
                <p className="section-subtitle">Выберите музей, чтобы увидеть сотрудников и приглашения.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-museum-100 font-semibold">{selectedMuseum.name}</p>
                      <p className="text-xs text-museum-500">
                        {selectedMuseum.description ?? 'Описание не указано'}
                      </p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => handleGoToAdmin()}>
                      Перейти в админку
                    </Button>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button loading={inviteLoading} onClick={handleCreateInvite} disabled={!selectedMuseumId}>
                      Сгенерировать приглашение
                    </Button>
                    {inviteMessage && (
                      <div className="text-xs text-museum-400 border border-museum-700 rounded-xl px-3 py-2">
                        {inviteMessage}
                      </div>
                    )}
                    {inviteResult && (
                      <div className="text-xs text-museum-300 border border-museum-700 rounded-xl px-3 py-2">
                        <p>
                          Код:{' '}
                          <span className="text-museum-100 font-semibold">{inviteResult.token || '—'}</span>
                        </p>
                        {inviteResult.url && (
                          <p className="mt-1 break-all">
                            Ссылка: {inviteResult.url}
                          </p>
                        )}
                        {inviteResult.expiresAt && (
                          <p className="mt-1 text-museum-500">
                            Истекает: {inviteResult.expiresAt}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </Card>

            <Card>
              <h3 className="section-title">Сотрудники музея</h3>
              {!selectedMuseum ? (
                <p className="section-subtitle">Выберите музей, чтобы увидеть список сотрудников.</p>
              ) : staffLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : staffError ? (
                <div className="text-xs text-red-400 border border-red-700/40 bg-red-950/40 rounded-xl px-3 py-2">
                  {staffError}
                </div>
              ) : staff.length === 0 ? (
                <p className="section-subtitle">Пока нет добавленных сотрудников.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {staff.map((member) => (
                    <li key={member.id} className="flex items-center justify-between text-sm border-b border-museum-800 pb-2">
                      <span className="text-museum-100">
                        {member.name ?? member.email ?? `ID ${member.id}`}
                      </span>
                      {member.role && <span className="badge badge-gold">{member.role}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </motion.div>
      </PageLayout>
    </>
  )
}
