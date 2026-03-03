import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ArrowLeft, Sparkles, MapPin } from 'lucide-react'
import clsx from 'clsx'
import Header from '@/components/layout/Header'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import AudioPlayer from '@/components/ui/AudioPlayer'
import MarkdownContent from '@/components/ui/MarkdownContent'
import VoiceRecorder from '@/components/ui/VoiceRecorder'
import TypingIndicator from '@/components/ui/TypingIndicator'
import {
  startInfinityExcursion,
  sendGuideMessage,
  requestExhibitSuggestions,
  startExpertSession,
  sendExpertMessage,
  returnToGuide,
  transcribeAudio,
} from '@/api/endpoints'
import type { ChatMessage, ExhibitSuggestion, InfinityExcursionSession, InfinityMode } from '@/types'

type InitStep = 'start' | 'history_prompt' | 'chat'

let _msgId = 0
const newId = () => String(++_msgId)

function makeMsg(role: 'user' | 'ai', content: string, audioUrl?: string): ChatMessage {
  return { id: newId(), role, content, audioUrl, timestamp: new Date() }
}

export default function InfinityExcursionPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const userId = params.get('user') ?? 'web-user'

  const [initStep, setInitStep] = useState<InitStep>('start')
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)

  const [session, setSession] = useState<InfinityExcursionSession | null>(null)
  const [mode, setMode] = useState<InfinityMode>('guide')

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')

  const [suggestions, setSuggestions] = useState<ExhibitSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [currentExhibit, setCurrentExhibit] = useState<{ name: string; imageUrl?: string } | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, showSuggestions])

  // ── Start / history handling ───────────────────────────────────────────────
  const handleStart = useCallback(async (continueHistory = false) => {
    setLoading(true)
    try {
      const s = await startInfinityExcursion(userId)
      setSession(s)

      if (s.hasHistory && !continueHistory) {
        setInitStep('history_prompt')
        setLoading(false)
        return
      }

      const prompt = s.hasHistory && continueHistory
        ? 'Пользователь вернулся в музей и решил продолжить экскурсию'
        : 'Поприветствуй пользователя'

      setInitStep('chat')
      setMode('guide')
      setTyping(true)
      const aiMsg = await sendGuideMessage(s.sessionId, prompt)
      setMessages([aiMsg])
      setTyping(false)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // ── Send guide message ─────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !session) return
    const userMsg = makeMsg('user', text)
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setTyping(true)
    setSuggestions([])
    setShowSuggestions(false)
    try {
      if (mode === 'guide') {
        const aiMsg = await sendGuideMessage(session.sessionId, text)
        setMessages((prev) => [...prev, aiMsg])
      } else {
        const expertId = session.expertSessionId!
        const aiMsg = await sendExpertMessage(expertId, text)
        setMessages((prev) => [...prev, aiMsg])
      }
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setTyping(false)
    }
  }, [session, mode])

  const handleVoiceMessage = useCallback(async (blob: Blob) => {
    const text = await transcribeAudio(blob)
    if (text) await sendMessage(text)
  }, [sendMessage])

  // ── Suggest exhibits ───────────────────────────────────────────────────────
  const handleSuggest = useCallback(async () => {
    if (!session) return
    setTyping(true)
    setSuggestions([])
    setShowSuggestions(false)
    try {
      const suggests = await requestExhibitSuggestions(session.sessionId)
      setSuggestions(suggests)
      setShowSuggestions(true)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setTyping(false)
    }
  }, [session])

  // ── Choose exhibit (enter expert mode) ────────────────────────────────────
  const handleChooseExhibit = useCallback(async (exhibitId: number, exhibitName: string) => {
    if (!session) return
    setShowSuggestions(false)
    setSuggestions([])
    setTyping(true)
    setCurrentExhibit({ name: exhibitName })
    try {
      const { expertSessionId, exhibit } = await startExpertSession(session.sessionId, exhibitId)
      setSession((s) => s ? { ...s, expertSessionId, mode: 'expert' } : s)
      setMode('expert')
      setCurrentExhibit({ name: exhibit.name, imageUrl: exhibit.imageUrl })
      const aiMsg = await sendExpertMessage(expertSessionId, 'Пользователь впервые у данного экспоната, сделай краткое вступление')
      setMessages((prev) => [...prev, aiMsg])
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setTyping(false)
    }
  }, [session])

  // ── Return to guide ────────────────────────────────────────────────────────
  const handleReturnToGuide = useCallback(async () => {
    if (!session?.expertSessionId) return
    setTyping(true)
    setMode('guide')
    setCurrentExhibit(null)
    try {
      const aiMsg = await returnToGuide(session.sessionId, session.expertSessionId)
      setMessages((prev) => [...prev, aiMsg])
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setTyping(false)
    }
  }, [session])

  return (
    <>
      <Header title="Бесконечная" showBack />
      <PageLayout>
        <div className="flex flex-col flex-1 pt-2 pb-4 min-h-0" style={{ height: 'calc(100vh - 56px)' }}>

          <AnimatePresence mode="wait">

            {/* ── Start screen ── */}
            {initStep === 'start' && (
              <motion.div
                key="start"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-6 text-center flex-1 justify-center"
              >
                <div className="text-6xl">♾️</div>
                <div>
                  <h2 className="section-title">Бесконечная экскурсия</h2>
                  <p className="section-subtitle max-w-sm mx-auto">
                    Живой AI-гид проведёт вас по музею. Исследуй свободно, задавай вопросы,
                    переходи к любому экспонату и общайся с экспертом.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 text-xs">
                  {['🗣️ Живой чат', '🎧 Аудио', '🔬 Режим эксперта', '🗺️ Карта'].map((f) => (
                    <span key={f} className="badge-gold px-3 py-1.5 rounded-full">{f}</span>
                  ))}
                </div>
                <Button size="lg" loading={loading} onClick={() => handleStart(false)}>
                  Начать экскурсию
                </Button>
              </motion.div>
            )}

            {/* ── History prompt ── */}
            {initStep === 'history_prompt' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-5 flex-1 justify-center"
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">👋</div>
                  <h2 className="section-title">Добро пожаловать снова!</h2>
                  <p className="section-subtitle max-w-xs mx-auto">
                    Похоже, вы уже посещали наш музей. Хотите продолжить прошлую экскурсию?
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button fullWidth loading={loading} onClick={() => handleStart(true)}>
                    Продолжить прошлую экскурсию
                  </Button>
                  <Button fullWidth variant="secondary" loading={loading} onClick={() => handleStart(false)}>
                    Начать новую
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Chat ── */}
            {initStep === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col flex-1 gap-3 overflow-hidden"
              >
                {/* Mode badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={clsx(
                      'badge text-xs',
                      mode === 'guide' ? 'badge-gold' : 'bg-purple-900/40 text-purple-300 border border-purple-600/40',
                    )}
                  >
                    {mode === 'guide' ? '🗺️ Режим гида' : '🔬 Режим эксперта'}
                  </span>

                  {mode === 'expert' && (
                    <button
                      onClick={handleReturnToGuide}
                      className="flex items-center gap-1.5 text-xs text-museum-400 hover:text-gold transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Вернуться к гиду
                    </button>
                  )}
                </div>

                {/* Exhibit header (expert mode) */}
                {mode === 'expert' && currentExhibit && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 bg-museum-900 border border-museum-700 rounded-xl px-4 py-3"
                  >
                    {currentExhibit.imageUrl && (
                      <img src={currentExhibit.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-museum-500 mb-0.5">
                        <MapPin className="w-3 h-3" /> Текущий экспонат
                      </div>
                      <p className="text-museum-100 font-semibold text-sm">{currentExhibit.name}</p>
                    </div>
                  </motion.div>
                )}

                {/* Messages list */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                    >
                      <div className={msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}>
                        {msg.role === 'ai' ? (
                          <MarkdownContent content={msg.content} />
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                        {msg.audioUrl && (
                          <div className="mt-2">
                            <AudioPlayer src={msg.audioUrl} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {typing && (
                    <div className="flex justify-start">
                      <TypingIndicator />
                    </div>
                  )}

                  {/* Exhibit suggestions */}
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col gap-2"
                      >
                        <p className="text-museum-500 text-xs pl-1">Выбери экспонат для посещения:</p>
                        {suggestions.map(({ exhibit }) => (
                          <Card
                            key={exhibit.id}
                            hoverable
                            className="flex items-center gap-3 py-3 px-4"
                            onClick={() => handleChooseExhibit(exhibit.id, exhibit.name)}
                          >
                            {exhibit.imageUrl && (
                              <img src={exhibit.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-museum-100 text-sm font-medium leading-tight truncate">{exhibit.name}</p>
                              {exhibit.roomNumber && (
                                <p className="text-museum-500 text-xs mt-0.5">Зал {exhibit.roomNumber}</p>
                              )}
                            </div>
                          </Card>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={bottomRef} />
                </div>

                {/* Input area */}
                <div className="flex flex-col gap-2 pt-2 border-t border-museum-800">
                  {/* Guide-mode quick actions */}
                  {mode === 'guide' && !typing && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      <button
                        onClick={handleSuggest}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-museum-600 text-museum-400 hover:border-gold hover:text-gold transition-colors whitespace-nowrap shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Предложи экспонаты
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    <textarea
                      rows={1}
                      className="textarea flex-1 py-2.5 text-sm resize-none"
                      placeholder={mode === 'guide' ? 'Напиши гиду…' : 'Спроси эксперта…'}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage(input)
                        }
                      }}
                    />
                    <button
                      onClick={() => sendMessage(input)}
                      disabled={!input.trim() || typing}
                      className="w-10 h-10 rounded-xl bg-gold text-museum-950 flex items-center justify-center hover:bg-gold-light disabled:opacity-50 transition-colors shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  <VoiceRecorder onRecorded={handleVoiceMessage} disabled={typing} />
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </PageLayout>
    </>
  )
}
