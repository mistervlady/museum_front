import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, FileText, ChevronRight, CheckCircle2 } from 'lucide-react'
import Header from '@/components/layout/Header'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import AudioPlayer from '@/components/ui/AudioPlayer'
import MarkdownContent from '@/components/ui/MarkdownContent'
import { startReadyExcursion, getReadyExhibit } from '@/api/endpoints'
import type { ExcursionFormat, ExhibitDescription } from '@/types'

type Step = 'format' | 'ready' | 'exhibit' | 'finish'

const TOTAL_EXHIBITS = 5 // фиксируется на стороне сервера

export default function ReadyExcursionPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const museumId = params.get('museum') ?? 'default'

  const [step, setStep] = useState<Step>('format')
  const [format, setFormat] = useState<ExcursionFormat>('with_images')
  const [sessionId, setSessionId] = useState<string>('')
  const [exhibitIndex, setExhibitIndex] = useState(1)
  const [exhibit, setExhibit] = useState<ExhibitDescription | null>(null)
  const [loading, setLoading] = useState(false)

  // ── Format selection ───────────────────────────────────────────────────────
  const handleFormatConfirm = async () => {
    setLoading(true)
    try {
      const session = await startReadyExcursion(museumId, format)
      setSessionId(session.sessionId)
      setStep('ready')
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // ── Start excursion ────────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getReadyExhibit(sessionId, 1)
      setExhibit(data)
      setExhibitIndex(1)
      setStep('exhibit')
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  // ── Next exhibit ───────────────────────────────────────────────────────────
  const handleNext = useCallback(async () => {
    if (exhibitIndex >= TOTAL_EXHIBITS) {
      setStep('finish')
      return
    }
    setLoading(true)
    setExhibit(null)
    const next = exhibitIndex + 1
    try {
      const data = await getReadyExhibit(sessionId, next)
      setExhibit(data)
      setExhibitIndex(next)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [exhibitIndex, sessionId])

  return (
    <>
      <Header title="Готовая экскурсия" showBack />
      <PageLayout>
        <div className="py-6 flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {/* ── Format step ── */}
            {step === 'format' && (
              <motion.div
                key="format"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="flex flex-col gap-5"
              >
                <div>
                  <h2 className="section-title">Формат экскурсии</h2>
                  <p className="section-subtitle">Как ты хочешь получать информацию об экспонатах?</p>
                </div>

                <div className="flex flex-col gap-3">
                  <Card
                    hoverable
                    selected={format === 'with_images'}
                    onClick={() => setFormat('with_images')}
                    className="flex items-center gap-4"
                  >
                    <Image className="w-8 h-8 text-gold shrink-0" />
                    <div>
                      <p className="font-semibold text-museum-100">С изображениями</p>
                      <p className="text-museum-500 text-sm">Фото каждого экспоната + текст + аудио</p>
                    </div>
                  </Card>
                  <Card
                    hoverable
                    selected={format === 'text_only'}
                    onClick={() => setFormat('text_only')}
                    className="flex items-center gap-4"
                  >
                    <FileText className="w-8 h-8 text-gold shrink-0" />
                    <div>
                      <p className="font-semibold text-museum-100">Только текст и аудио</p>
                      <p className="text-museum-500 text-sm">Без изображений — только описание</p>
                    </div>
                  </Card>
                </div>

                <Button fullWidth loading={loading} onClick={handleFormatConfirm}>
                  Далее
                </Button>
              </motion.div>
            )}

            {/* ── Ready step ── */}
            {step === 'ready' && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="flex flex-col items-center gap-6 text-center flex-1 justify-center"
              >
                <div className="text-5xl">🎧</div>
                <div>
                  <h2 className="section-title">Экскурсия содержит аудио</h2>
                  <p className="section-subtitle max-w-xs mx-auto">
                    Вы пройдёте по {TOTAL_EXHIBITS} экспонатам с текстовым и аудиоописанием.
                    Надень наушники!
                  </p>
                </div>
                <Button size="lg" loading={loading} onClick={handleStart}>
                  Начать экскурсию
                </Button>
              </motion.div>
            )}

            {/* ── Exhibit step ── */}
            {step === 'exhibit' && (
              <motion.div
                key={`exhibit-${exhibitIndex}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="flex flex-col gap-5 flex-1"
              >
                {/* Progress */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: TOTAL_EXHIBITS }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${
                        i < exhibitIndex ? 'bg-gold' : 'bg-museum-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-museum-500 text-xs">
                  Экспонат {exhibitIndex} из {TOTAL_EXHIBITS}
                </p>

                {loading || !exhibit ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Spinner label="Загружаю описание экспоната…" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 flex-1">
                    {format === 'with_images' && exhibit.imageUrl && (
                      <img
                        src={exhibit.imageUrl}
                        alt="Экспонат"
                        className="w-full rounded-2xl object-cover max-h-72"
                      />
                    )}

                    <Card className="flex-1">
                      <MarkdownContent content={exhibit.text} />
                    </Card>

                    {exhibit.audioUrl && (
                      <AudioPlayer src={exhibit.audioUrl} autoPlay />
                    )}

                    <Button fullWidth onClick={handleNext}>
                      {exhibitIndex < TOTAL_EXHIBITS ? (
                        <>
                          Следующий экспонат <ChevronRight className="w-4 h-4" />
                        </>
                      ) : (
                        'Завершить экскурсию'
                      )}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Finish step ── */}
            {step === 'finish' && (
              <motion.div
                key="finish"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6 text-center flex-1 justify-center"
              >
                <CheckCircle2 className="w-16 h-16 text-gold" />
                <div>
                  <h2 className="section-title">Экскурсия завершена!</h2>
                  <p className="section-subtitle max-w-xs mx-auto">
                    Надеемся, вам понравилось. Увидимся снова!
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <Button fullWidth onClick={() => navigate('/excursion-type')}>
                    Новая экскурсия
                  </Button>
                  <Button fullWidth variant="secondary" onClick={() => navigate('/')}>
                    На главную
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PageLayout>
    </>
  )
}
