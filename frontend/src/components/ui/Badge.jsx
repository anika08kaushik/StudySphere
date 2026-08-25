const colorMap = {
  primary: 'bg-[#E9DFFF] text-[#493A63] border border-[#C9B8E8]',
  success: 'bg-[#F2F7F3] text-emerald-800 border border-[#BFD8C0]',
  warning: 'bg-[#FCF9EE] text-amber-800 border border-[#F6D98B]',
  danger: 'bg-rose-50 text-rose-800 border border-rose-200',
  info: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
  gray: 'bg-[#F8F5FF] text-[#493A63] border border-[#E8E0F2]',
  online: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  focusing: 'bg-amber-50 text-amber-800 border border-amber-200',
  away: 'bg-amber-50 text-amber-800 border border-amber-200',
  offline: 'bg-slate-50 text-slate-700 border border-slate-200',
}

const dotColors = {
  primary: 'bg-[#9B7EDB]',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-indigo-500',
  gray: 'bg-[#776B88]',
  online: 'bg-emerald-500',
  focusing: 'bg-amber-500',
  away: 'bg-amber-500',
  offline: 'bg-slate-400',
}

export default function Badge({ children, color = 'gray', dot, pulse, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${colorMap[color]} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[color]} ${pulse ? 'animate-pulse' : ''}`} />
      )}
      {children}
    </span>
  )
}

