import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import {
  createMuseum,
  getStaffMuseums,
} from '@/api/endpoints'
import type { StaffMuseum } from '@/types'
import { useAuth } from '@/auth/AuthProvider'
import { STAFF_ROLES } from '@/auth/constants'

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
                    className="flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-museum-100 font-semibold">{museum.name}</p>
                      <p className="text-xs text-museum-500">{museum.description ?? 'Описание не указано'}</p>
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
          </div>
        </motion.div>
      </PageLayout>
    </>
  )
}
