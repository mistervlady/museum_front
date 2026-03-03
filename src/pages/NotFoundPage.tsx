import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Map } from 'lucide-react'
import Button from '@/components/ui/Button'
import PageLayout from '@/components/layout/PageLayout'
import Header from '@/components/layout/Header'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <>
      <Header />
      <PageLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center flex-1 text-center gap-6 py-16"
        >
          <div className="w-20 h-20 rounded-2xl bg-museum-900 border border-museum-700 flex items-center justify-center">
            <Map className="w-10 h-10 text-museum-600" />
          </div>
          <div>
            <h1 className="text-5xl font-serif font-bold text-museum-700 mb-2">404</h1>
            <h2 className="text-xl font-serif text-museum-300 mb-2">Страница не найдена</h2>
            <p className="text-museum-500 text-sm">Кажется, вы зашли не туда…</p>
          </div>
          <Button onClick={() => navigate('/')}>На главную</Button>
        </motion.div>
      </PageLayout>
    </>
  )
}
