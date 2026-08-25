import { COLORS } from './materials'

export default function Lamp({ position = [0, 0, 0], isOn = true }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.01, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.02, 16]} />
        <meshStandardMaterial color="#2a2525" roughness={0.6} metalness={0.3} />
      </mesh>

      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.26, 8]} />
        <meshStandardMaterial color="#3a3535" roughness={0.5} metalness={0.4} />
      </mesh>

      <mesh position={[0, 0.3, 0]}>
        <coneGeometry args={[0.12, 0.14, 16, 1, true]} />
        <meshStandardMaterial
          color={COLORS.lampShade}
          side={2}
          transparent
          opacity={0.9}
          emissive={isOn ? COLORS.lampLight : '#000000'}
          emissiveIntensity={isOn ? 0.3 : 0}
          roughness={0.6}
        />
      </mesh>

      {isOn && (
        <pointLight
          position={[0, 0.25, 0]}
          color={COLORS.lampLight}
          intensity={0.6}
          distance={3.5}
          decay={2}
          castShadow
        />
      )}
    </group>
  )
}
