import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Settings, Trash2, Users } from 'lucide-react'
import Header from '@/components/layout/Header'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import {
  addMuseumStaffMember,
  getMuseumStaff,
  getStaffMuseums,
  removeMuseumStaffMember,
  updateMuseumStaffRole,
} from '@/api/endpoints'
import { useAuth } from '@/auth/AuthProvider'
import { ROLE_DISPLAY_NAMES, STAFF_ROLES, type StaffRole } from '@/auth/constants'
import type { StaffMember, StaffMuseum } from '@/types'

const TEAM_ROLE_OPTIONS = [STAFF_ROLES.EDITOR, STAFF_ROLES.VIEWER] as const

export default function MuseumDetailPage() {
  const navigate = useNavigate()
  const { id, section } = useParams<{ id: string; section?: string }>()
  const museumId = Number(id)
  const isTeamView = section === 'team'
  const { user } = useAuth()

  const [museums, setMuseums] = useState<StaffMuseum[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showAddForm, setShowAddForm] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!museumId) return
    setLoading(true)
    setError(null)
    Promise.all([getStaffMuseums(), getMuseumStaff(museumId)])
      .then(([museumsData, staffData]) => {
        setMuseums(museumsData)
        setStaff(staffData)
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [museumId])

  const museum = useMemo(() => museums.find((item) => item.id === museumId), [museums, museumId])

  const museumRole = (museum?.role?.toLowerCase() ?? '') as StaffRole | ''
  const canManageTeam = museumRole === STAFF_ROLES.OWNER || user?.role === STAFF_ROLES.SUPERADMIN
  const canOpenAdmin = museumRole !== STAFF_ROLES.VIEWER

  const roleName = (value?: string) => {
    const normalized = (value?.toLowerCase() ?? '') as StaffRole
    return ROLE_DISPLAY_NAMES[normalized] ?? (value || 'Роль не указана')
  }

  const refreshStaff = async () => {
    if (!museumId) return
    const staffData = await getMuseumStaff(museumId)
    setStaff(staffData)
  }

  const handleRoleChange = async (memberId: number, nextRole: 'editor' | 'viewer') => {
    setActionLoading(true)
    setMessage(null)
    try {
      await updateMuseumStaffRole(museumId, memberId, { role: nextRole })
      await refreshStaff()
    } catch (e) {
      setMessage((e as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemove = async (member: StaffMember) => {
    if (!window.confirm(`Удалить сотрудника ${member.name || member.email || '#'}?`)) return
    setActionLoading(true)
    setMessage(null)
    try {
      await removeMuseumStaffMember(museumId, member.id)
      await refreshStaff()
    } catch (e) {
      setMessage((e as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!email.trim()) return
    setActionLoading(true)
    setMessage(null)
    try {
      const result = await addMuseumStaffMember(museumId, { email: email.trim(), role })
      await refreshStaff()
      setEmail('')
      setRole('editor')
      setShowAddForm(false)
      setMessage(
        result.tempPassword
          ? `Сотрудник добавлен. Временный пароль для входа: ${result.tempPassword}`
          : 'Сотрудник добавлен.',
      )
    } catch (e) {
      setMessage((e as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  if (!museumId) {
    return (
      <>
        <Header title="Музей" showBack backTo="/staff" />
        <PageLayout>
          <Card className="text-red-400 border-red-700/40 bg-red-950/40 mt-6">Некорректный id музея.</Card>
        </PageLayout>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <Header title="Музей" showBack backTo="/staff" />
        <PageLayout>
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        </PageLayout>
      </>
    )
  }

  if (error || !museum) {
    return (
      <>
        <Header title="Музей" showBack backTo="/staff" />
        <PageLayout>
          <Card className="text-red-400 border-red-700/40 bg-red-950/40 mt-6">
            {error ?? 'Музей не найден или недоступен.'}
          </Card>
        </PageLayout>
      </>
    )
  }

  return (
    <>
      <Header title={museum.name} showBack backTo="/staff" />
      <PageLayout>
        <motion.div
          className="flex flex-col gap-6 py-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <p className="text-museum-300 text-sm leading-relaxed">{museum.description ?? 'Описание не указано'}</p>
            <div className="mt-3">
              <span className="badge badge-gold text-xs">{roleName(museum.role)}</span>
            </div>
          </Card>

          {canOpenAdmin && (
            <Card hoverable className="group" onClick={() => navigate(`/admin?museum=${museumId}`)}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-museum-800 border border-museum-600 flex items-center justify-center shrink-0 group-hover:border-gold/60 transition-colors">
                  <Settings className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-semibold text-museum-50 text-lg mb-1 group-hover:text-gold transition-colors">
                    Администрирование
                  </h3>
                  <p className="text-museum-400 text-sm leading-relaxed mb-3">
                    Загрузите новые экспонаты и настройте схему залов.
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
          )}

          <Card hoverable className="group" onClick={() => navigate(`/staff/museum/${museumId}/team`)}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-museum-800 border border-museum-600 flex items-center justify-center shrink-0 group-hover:border-gold/60 transition-colors">
                <Users className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif font-semibold text-museum-50 text-lg mb-1 group-hover:text-gold transition-colors">
                  Команда
                </h3>
                <p className="text-museum-400 text-sm leading-relaxed mb-3">
                  Управляйте сотрудниками музея и их ролями.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Сотрудники', 'Роли'].map((tag) => (
                    <span key={tag} className="badge badge-gold text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {isTeamView && (
            <Card id="museum-team">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="section-title !mb-0">Команда</h3>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/staff/museum/${museumId}`)}>
                    К музею
                  </Button>
                  {canManageTeam && (
                    <Button size="sm" variant="secondary" onClick={() => setShowAddForm((prev) => !prev)}>
                      + Добавить сотрудника
                    </Button>
                  )}
                </div>
              </div>

              {showAddForm && canManageTeam && (
                <div className="border border-museum-700 rounded-xl p-3 mb-4 flex flex-col gap-3">
                  <input
                    className="input"
                    type="email"
                    placeholder="Email Сотрудника"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <select className="input" value={role} onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}>
                    {TEAM_ROLE_OPTIONS.map((roleOption) => (
                      <option key={roleOption} value={roleOption}>
                        {ROLE_DISPLAY_NAMES[roleOption]}
                      </option>
                    ))}
                  </select>
                  <Button onClick={handleAdd} loading={actionLoading} disabled={!email.trim()}>
                    Добавить
                  </Button>
                </div>
              )}

              {message && (
                <div className="text-xs text-museum-300 border border-museum-700 rounded-xl px-3 py-2 mb-4">
                  {message}
                </div>
              )}

              <div className="flex flex-col gap-2">
                {staff.map((member) => {
                  const isSelf = member.id === user?.id
                  const canEditMember = canManageTeam && !isSelf && member.role !== STAFF_ROLES.OWNER
                  return (
                    <div
                      key={`${member.id}-${member.email}`}
                      className="border border-museum-700 rounded-xl px-3 py-3 flex flex-col md:flex-row md:items-center gap-3 md:justify-between"
                    >
                      <div>
                        <p className="text-museum-100 font-medium">{member.name ?? 'Без имени'}</p>
                        <p className="text-museum-500 text-sm">{member.email ?? 'Email не указан'}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge badge-gold text-xs">{roleName(member.role)}</span>

                        {canEditMember ? (
                          <select
                            className="input !w-auto !py-2 !px-3 !text-sm"
                            value={member.role === STAFF_ROLES.VIEWER ? STAFF_ROLES.VIEWER : STAFF_ROLES.EDITOR}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as 'editor' | 'viewer')}
                            disabled={actionLoading}
                          >
                            <option value={STAFF_ROLES.EDITOR}>{ROLE_DISPLAY_NAMES.editor}</option>
                            <option value={STAFF_ROLES.VIEWER}>{ROLE_DISPLAY_NAMES.viewer}</option>
                          </select>
                        ) : null}

                        {canEditMember ? (
                          <button
                            className="btn-ghost !px-2 !py-2 text-red-400 hover:text-red-300"
                            title="Удалить сотрудника"
                            onClick={() => handleRemove(member)}
                            disabled={actionLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </motion.div>
      </PageLayout>
    </>
  )
}
