import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import clsx from 'clsx'

interface MarkdownContentProps {
  content: string
  className?: string
}

export default function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div
      className={clsx(
        'prose prose-invert prose-museum max-w-none text-museum-100',
        '[&_h1]:text-xl [&_h1]:font-serif [&_h1]:text-gold [&_h1]:mb-3',
        '[&_h2]:text-lg [&_h2]:font-serif [&_h2]:text-gold [&_h2]:mb-2',
        '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-museum-200 [&_h3]:mb-2',
        '[&_p]:text-museum-200 [&_p]:leading-relaxed [&_p]:mb-3',
        '[&_strong]:text-museum-100 [&_strong]:font-semibold',
        '[&_em]:text-museum-300 [&_em]:italic',
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1',
        '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1',
        '[&_li]:text-museum-200',
        '[&_blockquote]:border-l-2 [&_blockquote]:border-gold [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-museum-400',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
