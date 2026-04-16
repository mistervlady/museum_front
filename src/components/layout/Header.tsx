import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Settings, Map } from 'lucide-react'
import clsx from 'clsx'

interface HeaderProps {
  title?: string
  showBack?: boolean
  backTo?: string
  showAdmin?: boolean
  className?: string
}

export default function Header({
  title,
  showBack = false,
  backTo,
  showAdmin = false,
  className,
}: HeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleBack = () => {
    if (backTo) navigate(backTo)
    else navigate(-1)
  }

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-50',
        'bg-museum-950/90 backdrop-blur-md border-b border-museum-800',
        className,
      )}
    >
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left */}
        <div className="w-10">
          {showBack && (
            <button
              onClick={handleBack}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-museum-800 text-museum-400 hover:text-museum-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Center */}
        <div className="flex items-center gap-2">
          {!showBack && (
            <div className="w-6 h-6 rounded-md bg-gold flex items-center justify-center">
              <Map className="w-3.5 h-3.5 text-museum-950" />
            </div>
          )}
          <span className="font-serif font-bold text-museum-50 text-sm">
            {title ?? 'Музейный Гид'}
          </span>
        </div>

        {/* Right */}
        <div className="w-10 flex justify-end">
          {showAdmin && location.pathname !== '/admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-museum-800 text-museum-400 hover:text-museum-100 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
