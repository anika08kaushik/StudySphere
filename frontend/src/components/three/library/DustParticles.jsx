import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

function createDustParticles(count) {
  const positions = new Float32Array(count * 3)
  const speeds = new Float32Array(count)
  const phases = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6
    positions[i * 3 + 1] = Math.random() * 3.5 + 0.5
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 2

    speeds[i] = 0.1 + Math.random() * 0.2
    phases[i] = Math.random() * Math.PI * 2
  }

  return { positions, speeds, phases }
}

export default function DustParticles({ count = 40 }) {
  const mesh = useRef()
  const data = useMemo(() => createDustParticles(count), [count])

  useFrame((state) => {
    if (!mesh.current) return
    const time = state.clock.elapsedTime
    const posArray = mesh.current.geometry.attributes.position.array

    for (let i = 0; i < count; i++) {
      const speed = data.speeds[i]
      const phase = data.phases[i]

      posArray[i * 3 + 1] += Math.sin(time * speed + phase) * 0.0003
      posArray[i * 3] += Math.cos(time * speed * 0.7 + phase) * 0.0002
      posArray[i * 3 + 2] += Math.sin(time * speed * 0.5 + phase + 1) * 0.0001

      if (posArray[i * 3 + 1] > 4) posArray[i * 3 + 1] = 0.5
      if (posArray[i * 3 + 1] < 0.3) posArray[i * 3 + 1] = 3.5
    }

    mesh.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={data.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#ffeedd"
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
        blending={2}
      />
    </points>
  )
}
