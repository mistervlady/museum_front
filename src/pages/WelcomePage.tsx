import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Map, Sparkles, ArrowRight } from 'lucide-react'
import Header from '@/components/layout/Header'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import { getMuseums } from '@/api/endpoints'
import type { Museum } from '@/types'

const FALLBACK_MUSEUMS: Museum[] = [
  {
    id: 1,
    name: 'Красноярский художественный музей',
    description: 'Классическое и современное искусство Сибири',
    accent: 'от XVIII века до современности',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function WelcomePage() {
  const navigate = useNavigate()
  const [museums, setMuseums] = useState<Museum[]>(FALLBACK_MUSEUMS)

  useEffect(() => {
    getMuseums()
      .then((items) => {
        if (items.length > 0) {
          setMuseums(
            items.map((item, index) => ({
              ...item,
              description: item.description ?? 'Интерактивные экскурсии и AI-гид',
              accent: item.accent ?? (index % 2 === 0 ? 'Уникальная коллекция' : 'Экспонаты разных эпох'),
            })),
          )
        }
      })
      .catch(() => {})
  }, [])

  const handleMuseum = (id: number) => {
    navigate(`/excursion-type?museum=${id}`)
  }

  return (
    <>
      <Header />
      <PageLayout>
        <motion.div
          className="flex flex-col gap-8 py-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero */}
          <motion.div variants={itemVariants} className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gold/20 border border-gold/30 flex items-center justify-center mx-auto mb-5">
              <Map className="w-8 h-8 text-gold" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-museum-50 mb-3">
              Добро пожаловать!
            </h1>
            <p className="text-museum-400 text-sm leading-relaxed max-w-sm mx-auto">
              Это умный музейный гид с персонализированными маршрутами и AI-описаниями экспонатов.
              Выберите музей, чтобы начать.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-2">
            {['🎨 Персональные маршруты', '🎧 Аудиогид', '🤖 AI-гид', '♾️ Бесконечная экскурсия'].map(
              (f) => (
                <span key={f} className="badge-gold text-xs px-3 py-1.5 rounded-full">
                  {f}
                </span>
              ),
            )}
          </motion.div>

          {/* Museums */}
          <motion.div variants={itemVariants} className="flex flex-col gap-3">
            <p className="text-museum-400 text-xs uppercase tracking-widest font-medium">
              Выберите музей
            </p>
            {museums.map((museum) => (
              <button
                key={museum.id}
                onClick={() => handleMuseum(museum.id)}
                className="card-hover flex items-start justify-between gap-4 text-left group"
              >
                <div className="flex-1">
                  <h3 className="font-serif font-semibold text-museum-100 group-hover:text-gold transition-colors mb-1">
                    {museum.name}
                  </h3>
                  <p className="text-museum-500 text-sm">{museum.description}</p>
                  <span className="inline-block mt-2 text-xs text-museum-600 italic">
                    {museum.accent}
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-museum-600 group-hover:text-gold group-hover:translate-x-1 transition-all shrink-0 mt-0.5" />
              </button>
            ))}
          </motion.div>

          {/* Sparkles accent */}
          <motion.div variants={itemVariants} className="text-center">
            <Sparkles className="w-5 h-5 text-museum-700 mx-auto" />
          </motion.div>
        </motion.div>
      </PageLayout>
    </>
  )
}
