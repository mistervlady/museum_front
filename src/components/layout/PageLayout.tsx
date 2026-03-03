import { type ReactNode } from 'react'
import clsx from 'clsx'

interface PageLayoutProps {
  children: ReactNode
  className?: string
  /** adds top padding for fixed header */
  withHeader?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'full'
}

export default function PageLayout({
  children,
  className,
  withHeader = true,
  maxWidth = 'md',
}: PageLayoutProps) {
  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    full: 'max-w-full',
  }

  return (
    <main
      className={clsx(
        'min-h-screen flex flex-col',
        withHeader && 'pt-14',
        className,
      )}
    >
      <div className={clsx('w-full mx-auto px-4 flex-1 flex flex-col', widths[maxWidth])}>
        {children}
      </div>
    </main>
  )
}
