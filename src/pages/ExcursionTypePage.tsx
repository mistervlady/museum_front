import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Infinity, Palette, BookOpen, Settings } from 'lucide-react'
import Header from '@/components/layout/Header'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import { useAuth } from '@/auth/AuthProvider'

const TYPES = [
  {
    id: 'personal',
    icon: Palette,
    label: 'Персональная',
    emoji: '🎨',
    description:
      'Маршрут создаётся специально для Вас. Выберите стиль рассказчика, темы и количество экспонатов.',
    tags: ['AI-описания', 'Карта маршрута', 'Аудио'],
  },
  {
    id: 'infinity',
    icon: Infinity,
    label: 'Бесконечная',
    emoji: '♾️',
    description:
      'Живой чат с AI-гидом. Исследуй музей свободно — задавай вопросы, переходи к экспонатам, общайся с экспертом.',
    tags: ['Живой чат', 'Эксперт', 'Аудио'],
  },
  {
    id: 'ready',
    icon: BookOpen,
    label: 'Готовая',
    emoji: '📋',
    description:
      'Проверенный маршрут по самым значимым экспонатам. Просто следуй по номерам.',
    tags: ['Фиксированный маршрут', 'Аудио'],
  },
] as const

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function ExcursionTypePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const museumId = params.get('museum') ?? 'default'
  const { user } = useAuth()
  const isStaff = !!user?.role

  const handleType = (type: string) => {
    navigate(`/excursion/${type}?museum=${museumId}`)
  }

  const handleAdmin = () => {
    navigate(`/admin?museum=${museumId}`)
  }

  return (
    <>
      <Header title="Тип экскурсии" showBack backTo="/" />
      <PageLayout>
        <motion.div
          className="flex flex-col gap-5 py-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <h2 className="section-title">Выберите тип экскурсии</h2>
            <p className="section-subtitle">
              У каждого типа свой формат взаимодействия с гидом.
            </p>
          </motion.div>

          {TYPES.map((type) => (
            <motion.div key={type.id} variants={itemVariants}>
              <Card
                hoverable
                className="group"
                onClick={() => handleType(type.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-museum-800 border border-museum-600 flex items-center justify-center text-xl shrink-0 group-hover:border-gold/60 transition-colors">
                    {type.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-semibold text-museum-50 text-lg mb-1 group-hover:text-gold transition-colors">
                      {type.label}
                    </h3>
                    <p className="text-museum-400 text-sm leading-relaxed mb-3">
                      {type.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {type.tags.map((tag) => (
                        <span key={tag} className="badge badge-gold text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}

          {isStaff && (
            <motion.div variants={itemVariants}>
              <Card hoverable className="group" onClick={handleAdmin}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-museum-800 border border-museum-600 flex items-center justify-center text-xl shrink-0 group-hover:border-gold/60 transition-colors">
                    <Settings className="w-5 h-5 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-semibold text-museum-50 text-lg mb-1 group-hover:text-gold transition-colors">
                      Администрирование
                    </h3>
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
            </motion.div>
          )}
        </motion.div>
      </PageLayout>
    </>
  )
}
