import { type HTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  selected?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hoverable = false, selected = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'bg-museum-900 border rounded-2xl p-6 shadow-lg shadow-black/30 transition-all duration-200',
          hoverable
            ? 'cursor-pointer hover:border-gold/60 hover:bg-museum-800'
            : 'border-museum-700',
          selected && 'border-gold bg-museum-800 ring-1 ring-gold/30',
          !selected && !hoverable && 'border-museum-700',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)

Card.displayName = 'Card'
export default Card
