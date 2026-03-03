export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-museum-800 border border-museum-700 rounded-2xl rounded-bl-sm w-fit">
      {[0, 0.2, 0.4].map((delay) => (
        <span
          key={delay}
          className="w-2 h-2 bg-gold rounded-full animate-bounce"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  )
}
