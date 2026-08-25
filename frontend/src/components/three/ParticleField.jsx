import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function createParticles(count) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const speeds = new Float32Array(count)

  const palette = [
    [0.486, 0.227, 0.929],
    [0.024, 0.714, 0.831],
    [0.957, 0.247, 0.369],
    [1, 1, 1],
  ]

  for (let i = 0; i < count; i++) {
    const seed1 = Math.sin(i * 12.9898 + i * 78.233) * 43758.5453 % 1
    const seed2 = Math.sin(i * 4.898 + i * 7.23) * 23421.631 % 1
    const seed3 = Math.sin(i * 9.123 + i * 33.456) * 12345.678 % 1
    const seed4 = Math.sin(i * 7.654 + i * 11.22) * 98765.432 % 1
    const seed5 = Math.sin(i * 3.333 + i * 55.777) * 54321.987 % 1

    const r1 = Math.abs(seed1)
    const r2 = Math.abs(seed2)
    const r3 = Math.abs(seed3)
    const r4 = Math.abs(seed4)
    const r5 = Math.abs(seed5)

    positions[i * 3] = (r1 - 0.5) * 20
    positions[i * 3 + 1] = (r2 - 0.5) * 20
    positions[i * 3 + 2] = (r3 - 0.5) * 10 - 2

    const color = palette[Math.floor(r4 * palette.length)]
    colors[i * 3] = color[0]
    colors[i * 3 + 1] = color[1]
    colors[i * 3 + 2] = color[2]

    sizes[i] = r5 * 0.08 + 0.02
    speeds[i] = r1 * 0.3 + 0.1
  }

  return { positions, colors, sizes, speeds }
}

export default function ParticleField({ count = 100, mouse }) {
  const mesh = useRef()
  const initialData = useMemo(() => createParticles(count), [count])

  const dataRef = useRef(initialData)

  useFrame((state) => {
    if (!mesh.current) return
    const time = state.clock.elapsedTime
    const posArray = mesh.current.geometry.attributes.position.array
    const { speeds } = dataRef.current

    for (let i = 0; i < count; i++) {
      const speed = speeds[i]
      posArray[i * 3 + 1] += Math.sin(time * speed + i) * 0.001
      posArray[i * 3] += Math.cos(time * speed * 0.5 + i) * 0.0005
    }

    mesh.current.geometry.attributes.position.needsUpdate = true

    if (mouse.current) {
      mesh.current.rotation.y = THREE.MathUtils.lerp(
        mesh.current.rotation.y,
        mouse.current.x * 0.05,
        0.02
      )
      mesh.current.rotation.x = THREE.MathUtils.lerp(
        mesh.current.rotation.x,
        mouse.current.y * 0.03,
        0.02
      )
    }
  })

  return (
    <group>
      <points ref={mesh}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={initialData.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={count}
            array={initialData.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <pointLight position={[0, 0, 5]} intensity={0.5} color="#7c3aed" />
    </group>
  )
}
