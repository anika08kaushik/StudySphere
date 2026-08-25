export default function Card({ children, className = '', header, footer, interactive, cover, coverClassName = '' }) {
  const base = 'card-soft bg-white border border-[#E8E0F2] text-[#493A63] rounded-2xl overflow-hidden'
  const hover = interactive ? 'hover:border-[#9B7EDB] shadow-xs cursor-pointer transition-all' : ''

  return (
    <div className={`${base} ${hover} ${className}`}>
      {cover && (
        <div className={`h-24 bg-gradient-to-br ${coverClassName || 'from-[#E9DFFF] to-[#FCF9EE]'} relative`}>
          {cover}
        </div>
      )}
      {header && (
        <div className="px-5 py-4 border-b border-[#E8E0F2] font-bold text-[#493A63]">
          {header}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-[#E8E0F2] bg-[#F8F5FF] rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  )
}

