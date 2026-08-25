import { Html } from '@react-three/drei'

export default function FocusTimer({ session, totalSecs = 0, count = 0, position = [0, 2.5, 0] }) {
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <Html position={position} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          background: 'rgba(10, 1, 24, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px',
          padding: '16px 28px',
          textAlign: 'center',
          minWidth: '180px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(124,58,237,0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '8px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: session ? '#f59e0b' : '#64748b',
              boxShadow: session ? '0 0 8px #f59e0b' : 'none',
              animation: session ? 'pulse 2s infinite' : 'none',
            }}
          />
          <span
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '11px',
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {session ? 'Focus Session' : 'No Session'}
          </span>
        </div>
        <div
          style={{
            color: '#ffffff',
            fontSize: '36px',
            fontFamily: 'ui-monospace, monospace',
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '0.02em',
          }}
        >
          {formatTime(totalSecs)}
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: '12px',
            fontFamily: 'Inter, system-ui, sans-serif',
            marginTop: '6px',
          }}
        >
          {count} {count === 1 ? 'student' : 'students'} studying
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    </Html>
  )
}
