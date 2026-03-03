import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

export default function Spinner({ size = 'md', className, label }: SpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }

  return (
    <div className={clsx('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={clsx('text-gold animate-spin', sizes[size])} />
      {label && <p className="text-museum-400 text-sm animate-pulse">{label}</p>}
    </div>
  )
}
