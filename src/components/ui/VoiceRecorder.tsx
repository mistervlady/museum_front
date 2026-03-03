import { useState, useRef, useCallback } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface VoiceRecorderProps {
  onRecorded: (blob: Blob) => Promise<void> | void
  disabled?: boolean
  className?: string
}

type RecorderState = 'idle' | 'recording' | 'processing'

export default function VoiceRecorder({ onRecorded, disabled, className }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle')
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setState('processing')
        try {
          await onRecorded(blob)
        } finally {
          setState('idle')
        }
      }

      mr.start()
      mediaRef.current = mr
      setState('recording')
    } catch {
      alert('Не удалось получить доступ к микрофону')
    }
  }, [onRecorded])

  const stop = useCallback(() => {
    mediaRef.current?.stop()
    mediaRef.current = null
  }, [])

  const handleClick = () => {
    if (state === 'recording') stop()
    else if (state === 'idle') start()
  }

  const labels: Record<RecorderState, string> = {
    idle: 'Голосовой вопрос',
    recording: 'Остановить запись',
    processing: 'Обрабатываю...',
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || state === 'processing'}
      className={clsx(
        'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
        state === 'recording'
          ? 'bg-red-600/20 border border-red-500/60 text-red-400 hover:bg-red-600/30'
          : 'border border-museum-600 text-museum-300 hover:border-gold hover:text-gold',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
    >
      {state === 'processing' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : state === 'recording' ? (
        <Square className="w-4 h-4 text-red-400 animate-pulse" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
      {labels[state]}
    </button>
  )
}
