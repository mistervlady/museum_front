import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Image,
  FileText,
  ChevronRight,
  CheckCircle2,
  Send,
  MessageSquare,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import AudioPlayer from '@/components/ui/AudioPlayer'
import MarkdownContent from '@/components/ui/MarkdownContent'
import VoiceRecorder from '@/components/ui/VoiceRecorder'
import {
  startPersonalExcursion,
  getPersonalExhibitDescription,
  nextPersonalExhibit,
  askPersonalQuestion,
  transcribeAudio,
} from '@/api/endpoints'
import type { ExcursionFormat, PersonalExcursionSession, ExhibitDescription } from '@/types'

type Step =
  | 'style'
  | 'format'
  | 'description'
  | 'count'
  | 'map'
  | 'exhibit'
  | 'finish'

const EXHIBIT_COUNTS = [3, 5, 7, 10]

const STYLE_EXAMPLES = [
  '🪆 В стиле русской сказки',
  '🧠 Научно-популярное путешествие',
  '🌟 Рассказ любимого персонажа',
  '🎄 Тайны и легенды Сибири',
]

export default function PersonalExcursionPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const museumId = params.get('museum') ?? 'default'

  const [step, setStep] = useState<Step>('style')
  const [style, setStyle] = useState('')
  const [format, setFormat] = useState<ExcursionFormat>('with_images')
  const [userDescription, setUserDescription] = useState('')
  const [exhibitCount, setExhibitCount] = useState(5)

  const [session, setSession] = useState<PersonalExcursionSession | null>(null)
  const [exhibit, setExhibit] = useState<ExhibitDescription | null>(null)
  const [exhibitIndex, setExhibitIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<{ text: string; audioUrl?: string } | null>(null)
  const [asLoading, setAsLoading] = useState(false)

  // ── Style → Format ─────────────────────────────────────────────────────────
  const handleStyleSubmit = () => {
    if (!style.trim()) return
    setStep('format')
  }

  const handleStyleVoice = useCallback(async (blob: Blob) => {
    const text = await transcribeAudio(blob)
    setStyle(text)
    setStep('format')
  }, [])

  // ── Format → Description ───────────────────────────────────────────────────
  const handleFormatNext = () => setStep('description')

  // ── Description → Count ───────────────────────────────────────────────────
  const handleDescriptionNext = () => {
    if (!userDescription.trim()) return
    setStep('count')
  }

  // ── Count → Map (start session) ───────────────────────────────────────────
  const handleCountNext = async () => {
    setLoading(true)
    try {
      const s = await startPersonalExcursion({
        museumId,
        style,
        format,
        description: userDescription,
        exhibitCount,
      })
      setSession(s)
      setStep('map')
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // ── Map → first Exhibit ────────────────────────────────────────────────────
  const handleStartExcursion = async () => {
    if (!session) return
    setLoading(true)
    setAnswer(null)
    try {
      const data = await getPersonalExhibitDescription(session.sessionId)
      setExhibit(data)
      setExhibitIndex(1)
      setStep('exhibit')
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // ── Next exhibit ───────────────────────────────────────────────────────────
  const handleNextExhibit = useCallback(async () => {
    if (!session) return
    const next = exhibitIndex + 1
    if (next > (session.exhibits?.length ?? exhibitCount)) {
      setStep('finish')
      return
    }
    setLoading(true)
    setExhibit(null)
    setAnswer(null)
    try {
      const data = await nextPersonalExhibit(session.sessionId)
      setExhibit(data)
      setExhibitIndex(next)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [session, exhibitIndex, exhibitCount])

  // ── Ask question ──────────────────────────────────────────────────────────
  const handleAsk = useCallback(async (q: string) => {
    if (!q.trim() || !session) return
    setAsLoading(true)
    setAnswer(null)
    try {
      const res = await askPersonalQuestion(session.sessionId, q)
      setAnswer({ text: res.answer, audioUrl: res.audioUrl })
      setQuestion('')
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setAsLoading(false)
    }
  }, [session])

  const handleVoiceQuestion = useCallback(async (blob: Blob) => {
    const text = await transcribeAudio(blob)
    if (text) await handleAsk(text)
  }, [handleAsk])

  const totalExhibits = session?.exhibits?.length ?? exhibitCount

  return (
    <>
      <Header title="Персональная" showBack />
      <PageLayout>
        <div className="py-6 flex-1 flex flex-col">
          <AnimatePresence mode="wait">

            {/* ── Style ── */}
            {step === 'style' && (
              <motion.div
                key="style"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="flex flex-col gap-5"
              >
                <div>
                  <h2 className="section-title">Стиль экскурсии</h2>
                  <p className="section-subtitle">
                    Выберите, в какой манере гид будет рассказывать. Напишите свой вариант или выберите пример.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {STYLE_EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setStyle(ex)}
                      className={`text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200 ${
                        style === ex
                          ? 'border-gold bg-museum-800 text-gold'
                          : 'border-museum-700 text-museum-400 hover:border-museum-500 hover:text-museum-200'
                      }`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>

                <div>
                  <p className="text-museum-500 text-xs mb-2">или введите свой:</p>
                  <textarea
                    className="textarea h-24"
                    placeholder="Напишите стиль рассказчика…"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    fullWidth
                    onClick={handleStyleSubmit}
                    disabled={!style.trim()}
                  >
                    Далее
                  </Button>
                  <VoiceRecorder onRecorded={handleStyleVoice} />
                </div>
              </motion.div>
            )}

            {/* ── Format ── */}
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
                  <p className="section-subtitle">Хотите видеть фотографии экспонатов?</p>
                </div>

                <div className="flex flex-col gap-3">
                  <Card hoverable selected={format === 'with_images'} onClick={() => setFormat('with_images')} className="flex items-center gap-4">
                    <Image className="w-8 h-8 text-gold shrink-0" />
                    <div>
                      <p className="font-semibold text-museum-100">С изображениями</p>
                      <p className="text-museum-500 text-sm">Фото + текст + аудио</p>
                    </div>
                  </Card>
                  <Card hoverable selected={format === 'text_only'} onClick={() => setFormat('text_only')} className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-gold shrink-0" />
                    <div>
                      <p className="font-semibold text-museum-100">Только текст и аудио</p>
                      <p className="text-museum-500 text-sm">Без фотографий</p>
                    </div>
                  </Card>
                </div>

                <Button fullWidth onClick={handleFormatNext}>Далее</Button>
              </motion.div>
            )}

            {/* ── Description ── */}
            {step === 'description' && (
              <motion.div
                key="description"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="flex flex-col gap-5"
              >
                <div>
                  <h2 className="section-title">Ваши интересы</h2>
                  <p className="section-subtitle">
                    Кратко опишите, что хотите увидеть: темы, жанры, эпохи, настроение.
                  </p>
                </div>
                <textarea
                  className="textarea h-32"
                  placeholder="Например: хочу увидеть работы сибирских художников XX века, особенно пейзажи…"
                  value={userDescription}
                  onChange={(e) => setUserDescription(e.target.value)}
                />
                <Button fullWidth onClick={handleDescriptionNext} disabled={!userDescription.trim()}>
                  Далее
                </Button>
              </motion.div>
            )}

            {/* ── Count ── */}
            {step === 'count' && (
              <motion.div
                key="count"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="flex flex-col gap-5"
              >
                <div>
                  <h2 className="section-title">Количество экспонатов</h2>
                  <p className="section-subtitle">Сколько экспонатов включить в маршрут?</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {EXHIBIT_COUNTS.map((n) => (
                    <Card
                      key={n}
                      hoverable
                      selected={exhibitCount === n}
                      onClick={() => setExhibitCount(n)}
                      className="text-center py-5"
                    >
                      <span className="text-3xl font-serif font-bold text-gold">{n}</span>
                      <p className="text-museum-500 text-xs mt-1">
                        {n <= 3 ? '~20 мин' : n <= 5 ? '~40 мин' : n <= 7 ? '~60 мин' : '~90 мин'}
                      </p>
                    </Card>
                  ))}
                </div>

                <Button fullWidth loading={loading} onClick={handleCountNext}>
                  Составить маршрут
                </Button>
              </motion.div>
            )}

            {/* ── Map ── */}
            {step === 'map' && session && (
              <motion.div
                key="map"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="flex flex-col gap-5"
              >
                <div>
                  <h2 className="section-title">Ваш маршрут</h2>
                  <p className="section-subtitle">
                    Следуйте по порядку номеров экспонатов. На полу — наклейки с индексами.
                  </p>
                </div>

                {session.mapImageUrl ? (
                  <img
                    src={session.mapImageUrl}
                    alt="Карта маршрута"
                    className="w-full rounded-2xl border border-museum-700"
                  />
                ) : (
                  <div className="rounded-2xl border border-museum-700 bg-museum-900 flex items-center justify-center py-12 text-museum-600 text-sm">
                    Карта маршрута не доступна
                  </div>
                )}

                {/* Exhibit list */}
                {session.exhibits && session.exhibits.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {session.exhibits.map((ex, i) => (
                      <div key={ex.id} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-museum-900 border border-museum-700">
                        <span className="w-6 h-6 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs flex items-center justify-center font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-museum-200 text-sm">{ex.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-xl bg-museum-900 border border-museum-700 px-4 py-3 flex items-center gap-2 text-sm text-museum-400">
                  🎧 <span>Экскурсия содержит аудио — надень наушники!</span>
                </div>

                <Button fullWidth size="lg" loading={loading} onClick={handleStartExcursion}>
                  Начать экскурсию
                </Button>
              </motion.div>
            )}

            {/* ── Exhibit ── */}
            {step === 'exhibit' && (
              <motion.div
                key={`exhibit-${exhibitIndex}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="flex flex-col gap-4 flex-1"
              >
                {/* Progress */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    {Array.from({ length: totalExhibits }).map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${i < exhibitIndex ? 'bg-gold' : 'bg-museum-700'}`} />
                    ))}
                  </div>
                  <p className="text-museum-500 text-xs">Экспонат {exhibitIndex} из {totalExhibits}</p>
                </div>

                {loading || !exhibit ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Spinner label="Генерирую описание…" />
                  </div>
                ) : (
                  <>
                    {format === 'with_images' && exhibit.imageUrl && (
                      <img src={exhibit.imageUrl} alt="Экспонат" className="w-full rounded-2xl object-cover max-h-64" />
                    )}

                    <Card className="flex-1">
                      <MarkdownContent content={exhibit.text} />
                    </Card>

                    {exhibit.audioUrl && <AudioPlayer src={exhibit.audioUrl} autoPlay />}

                    {/* Q&A */}
                    <div className="rounded-2xl bg-museum-900 border border-museum-700 p-4 flex flex-col gap-3">
                      <p className="text-museum-400 text-xs flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Задайте вопрос об экспонате
                      </p>

                      {answer && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2">
                          <div className="bubble-ai">
                            <MarkdownContent content={answer.text} />
                          </div>
                          {answer.audioUrl && <AudioPlayer src={answer.audioUrl} autoPlay />}
                        </motion.div>
                      )}

                      <div className="flex gap-2">
                        <input
                          className="input flex-1 py-2 text-sm"
                          placeholder="Введите вопрос…"
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAsk(question)}
                        />
                        <button
                          onClick={() => handleAsk(question)}
                          disabled={!question.trim() || asLoading}
                          className="w-10 h-10 rounded-xl bg-gold text-museum-950 flex items-center justify-center hover:bg-gold-light disabled:opacity-50 transition-colors shrink-0"
                        >
                          {asLoading ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                      <VoiceRecorder onRecorded={handleVoiceQuestion} disabled={asLoading} />
                    </div>

                    <Button fullWidth onClick={handleNextExhibit}>
                      {exhibitIndex < totalExhibits ? (
                        <>Следующий экспонат <ChevronRight className="w-4 h-4" /></>
                      ) : 'Завершить экскурсию'}
                    </Button>
                  </>
                )}
              </motion.div>
            )}

            {/* ── Finish ── */}
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
                    Надеемся, вам понравилось. До новых встреч в музее!
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <Button fullWidth onClick={() => navigate('/excursion-type')}>Новая экскурсия</Button>
                  <Button fullWidth variant="secondary" onClick={() => navigate('/')}>На главную</Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </PageLayout>
    </>
  )
}
