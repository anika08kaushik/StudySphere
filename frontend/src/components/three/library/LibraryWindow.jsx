import { COLORS } from './materials'

export default function LibraryWindow({ position = [0, 2, 0], rotation = [0, 0, 0] }) {
  const frameWidth = 1.0
  const frameHeight = 1.4
  const frameDepth = 0.08

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[frameWidth, frameHeight, frameDepth]} />
        <meshStandardMaterial color={COLORS.stoneLight} roughness={0.8} metalness={0.1} />
      </mesh>

      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[frameWidth - 0.15, frameHeight - 0.15]} />
        <meshStandardMaterial
          color={COLORS.windowGlow}
          transparent
          opacity={0.25}
          emissive={COLORS.windowGlow}
          emissiveIntensity={0.4}
          side={2}
        />
      </mesh>

      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[frameWidth - 0.15, 0.03, 0.01]} />
        <meshStandardMaterial color={COLORS.stoneLight} roughness={0.8} />
      </mesh>

      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.03, frameHeight - 0.15, 0.01]} />
        <meshStandardMaterial color={COLORS.stoneLight} roughness={0.8} />
      </mesh>

      <spotLight
        position={[0, 0, 0.5]}
        target-position={[0, -2, 3]}
        angle={0.5}
        penumbra={0.6}
        intensity={1.0}
        color={COLORS.daylight}
        distance={12}
        decay={2}
      />

      <pointLight
        position={[0, 0, 0.3]}
        color={COLORS.daylight}
        intensity={0.4}
        distance={5}
        decay={2}
      />
    </group>
  )
}
