import { COLORS } from './materials'

export default function Chair({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  pulledOut = false,
}) {
  const seatHeight = 0.45
  const pulledZ = pulledOut ? 0.3 : 0

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, seatHeight, pulledZ]} castShadow>
        <boxGeometry args={[0.4, 0.04, 0.4]} />
        <meshStandardMaterial color={COLORS.woodDark} roughness={0.75} metalness={0.05} />
      </mesh>

      <mesh position={[0, seatHeight + 0.02, pulledZ]} castShadow>
        <boxGeometry args={[0.36, 0.02, 0.36]} />
        <meshStandardMaterial color="#5c4033" roughness={0.85} metalness={0} />
      </mesh>

      <mesh position={[0, seatHeight + 0.28, -0.18 + pulledZ]} castShadow>
        <boxGeometry args={[0.38, 0.5, 0.04]} />
        <meshStandardMaterial color={COLORS.woodDark} roughness={0.75} metalness={0.05} />
      </mesh>

      {[
        [-0.15, seatHeight / 2, -0.15 + pulledZ],
        [0.15, seatHeight / 2, -0.15 + pulledZ],
        [-0.15, seatHeight / 2, 0.15 + pulledZ],
        [0.15, seatHeight / 2, 0.15 + pulledZ],
      ].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[0.02, 0.02, seatHeight, 6]} />
          <meshStandardMaterial color={COLORS.woodDark} roughness={0.8} metalness={0.1} />
        </mesh>
      ))}
    </group>
  )
}
