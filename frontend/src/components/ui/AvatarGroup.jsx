import Avatar from './Avatar'

export default function AvatarGroup({ users = [], max = 4, size = 'sm', className = '' }) {
  const visible = users.slice(0, max)
  const overflow = users.length - max

  return (
    <div className={`flex items-center ${className}`}>
      {visible.map((user, i) => (
        <div
          key={user._id || i}
          className="relative"
          style={{ marginLeft: i === 0 ? 0 : '-8px', zIndex: max - i }}
        >
          <Avatar
            name={user.name || 'U'}
            src={user.profilePhoto}
            size={size}
            status={user.status}
          />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="relative flex items-center justify-center rounded-full bg-[#E9DFFF] text-[#493A63] font-bold ring-2 ring-white"
          style={{
            marginLeft: '-8px',
            zIndex: 0,
            ...(size === 'sm'
              ? { width: 32, height: 32, fontSize: 12 }
              : size === 'md'
              ? { width: 40, height: 40, fontSize: 13 }
              : { width: 56, height: 56, fontSize: 14 }),
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}

