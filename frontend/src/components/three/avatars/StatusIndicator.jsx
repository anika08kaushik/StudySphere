import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const STATUS_COLORS = {
  focusing: '#f59e0b',
  online: '#22c55e',
  reading: '#3b82f6',
  discussion: '#a855f7',
  away: '#64748b',
  offline: '#64748b',
}

export default function StatusIndicator({ status = 'online', position = [0, 0, 0] }) {
  const ref = useRef()
  const glowRef = useRef()
  const color = STATUS_COLORS[status] || STATUS_COLORS.offline

  useFrame((state) => {
    if (!ref.current) return
    if (status === 'focusing') {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.15 + 1
      ref.current.scale.setScalar(pulse)
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(ref.current?.scale.x || 1)
    }
  })

  return (
    <group position={position}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
        />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.2}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  )
}
