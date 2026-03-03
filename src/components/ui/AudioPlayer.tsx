import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'
import clsx from 'clsx'

interface AudioPlayerProps {
  src: string
  autoPlay?: boolean
  className?: string
}

export default function AudioPlayer({ src, autoPlay = false, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setProgress(audio.currentTime)
    const onDurationChange = () => setDuration(audio.duration)
    const onEnded = () => setPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)

    if (autoPlay) {
      audio.play().then(() => setPlaying(true)).catch(() => {})
    }

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
    }
  }, [src, autoPlay])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {})
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * duration
  }

  const fmt = (s: number) => {
    if (isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className={clsx('flex items-center gap-3 bg-museum-800 rounded-xl px-4 py-3', className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        onClick={toggle}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-gold text-museum-950 hover:bg-gold-light transition-colors shrink-0"
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>

      <Volume2 className="w-4 h-4 text-museum-500 shrink-0" />

      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs text-museum-400 w-8 shrink-0">{fmt(progress)}</span>
        <div
          className="flex-1 h-1.5 bg-museum-700 rounded-full cursor-pointer relative"
          onClick={seek}
        >
          <div
            className="h-full bg-gold rounded-full transition-all"
            style={{ width: duration ? `${(progress / duration) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-xs text-museum-400 w-8 shrink-0">{fmt(duration)}</span>
      </div>
    </div>
  )
}
