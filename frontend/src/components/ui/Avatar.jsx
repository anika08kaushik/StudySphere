const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-28 h-28 text-3xl',
}

const statusColors = {
  online: 'bg-online',
  focusing: 'bg-focusing animate-pulse',
  away: 'bg-away',
  offline: 'bg-offline',
}

const statusSizes = {
  sm: 'w-2.5 h-2.5 border',
  md: 'w-3 h-3 border-2',
  lg: 'w-3.5 h-3.5 border-2',
  xl: 'w-4 h-4 border-2',
  '2xl': 'w-5 h-5 border-2',
}

const colorPalette = [
  'bg-primary-100 text-primary-700',
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-yellow-100 text-yellow-700',
  'bg-red-100 text-red-700',
  'bg-indigo-100 text-indigo-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
]

function getColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colorPalette[Math.abs(hash) % colorPalette.length]
}

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function Avatar({ name = 'U', src, size = 'md', status, className = '' }) {
  const sizeClass = sizeMap[size]

  const inner = src ? (
    <img
      src={src}
      alt={name}
      className={`${sizeClass} rounded-full object-cover ring-2 ring-white ${className}`}
    />
  ) : (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-semibold ring-2 ring-white ${getColor(name)} ${className}`}
    >
      {getInitials(name)}
    </div>
  )

  if (!status) return inner

  return (
    <div className="relative inline-flex shrink-0">
      {inner}
      <span
        className={`absolute bottom-0 right-0 rounded-full border-white ${statusColors[status]} ${statusSizes[size]}`}
      />
    </div>
  )
}
