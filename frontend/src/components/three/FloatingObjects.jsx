import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Float } from '@react-three/drei'
import * as THREE from 'three'

function FloatingSphere({ position, color, speed = 1, distort = 0.3, size = 0.5 }) {
  const ref = useRef()

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.1 * speed
      ref.current.rotation.y = state.clock.elapsedTime * 0.15 * speed
    }
  })

  return (
    <Float speed={speed * 1.5} rotationIntensity={0.5} floatIntensity={1.5}>
      <mesh ref={ref} position={position}>
        <icosahedronGeometry args={[size, 4]} />
        <MeshDistortMaterial
          color={color}
          roughness={0.2}
          metalness={0.8}
          distort={distort}
          speed={2}
          transparent
          opacity={0.85}
        />
      </mesh>
    </Float>
  )
}

function FloatingTorus({ position, color, speed = 1, size = 0.35 }) {
  return (
    <Float speed={speed} rotationIntensity={1} floatIntensity={2}>
      <mesh position={position} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[size, size * 0.3, 16, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.7}
          transparent
          opacity={0.7}
        />
      </mesh>
    </Float>
  )
}

function FloatingIcosahedron({ position, color, speed = 1, size = 0.3 }) {
  return (
    <Float speed={speed * 0.8} rotationIntensity={0.8} floatIntensity={1}>
      <mesh position={position}>
        <octahedronGeometry args={[size, 0]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.6}
          wireframe
          transparent
          opacity={0.5}
        />
      </mesh>
    </Float>
  )
}

export default function FloatingObjects({ mouse }) {
  const group = useRef()

  const objects = useMemo(() => [
    { type: 'sphere', pos: [-3, 1.5, -2], color: '#7c3aed', speed: 0.8, size: 0.6 },
    { type: 'sphere', pos: [3.5, -1, -3], color: '#06b6d4', speed: 1.2, size: 0.45 },
    { type: 'torus', pos: [-2.5, -1.5, -1.5], color: '#c084fc', speed: 0.6, size: 0.4 },
    { type: 'torus', pos: [2, 2, -2.5], color: '#06b6d4', speed: 1, size: 0.35 },
    { type: 'octa', pos: [-4, 0, -3], color: '#f43f5e', speed: 0.5, size: 0.35 },
    { type: 'octa', pos: [4, 0.5, -2], color: '#a855f7', speed: 0.7, size: 0.25 },
    { type: 'sphere', pos: [0, -2, -4], color: '#7c3aed', speed: 0.4, size: 0.8 },
  ], [])

  useFrame(() => {
    if (group.current && mouse.current) {
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        mouse.current.x * 0.08,
        0.02
      )
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        mouse.current.y * 0.05,
        0.02
      )
    }
  })

  return (
    <group ref={group}>
      {objects.map((obj, i) => {
        if (obj.type === 'sphere') {
          return <FloatingSphere key={i} position={obj.pos} color={obj.color} speed={obj.speed} size={obj.size} />
        }
        if (obj.type === 'torus') {
          return <FloatingTorus key={i} position={obj.pos} color={obj.color} speed={obj.speed} size={obj.size} />
        }
        return <FloatingIcosahedron key={i} position={obj.pos} color={obj.color} speed={obj.speed} size={obj.size} />
      })}
    </group>
  )
}
