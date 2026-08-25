import { COLORS } from './materials'

export default function Desk({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isOccupied = false,
  width = 1.3,
  height = 0.75,
  depth = 0.65,
}) {
  const legHeight = height - 0.04
  const legOffset = 0.06

  return (
    <group position={position} rotation={rotation}>
      {/* Desktop Surface */}
      <mesh position={[0, height - 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.04, depth]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.6} />
      </mesh>

      {/* Desk Legs */}
      {[
        [-width / 2 + legOffset, legHeight / 2, -depth / 2 + legOffset],
        [width / 2 - legOffset, legHeight / 2, -depth / 2 + legOffset],
        [-width / 2 + legOffset, legHeight / 2, depth / 2 - legOffset],
        [width / 2 - legOffset, legHeight / 2, depth / 2 - legOffset],
      ].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[0.025, 0.025, legHeight, 8]} />
          <meshStandardMaterial color={COLORS.woodDark} roughness={0.7} />
        </mesh>
      ))}

      {/* Desk Props: Open Laptop */}
      <group position={[0, height + 0.02, -0.05]}>
        {/* Base */}
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.012, 0.2]} />
          <meshStandardMaterial color="#493A63" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Screen lid */}
        <group position={[0, 0.006, -0.09]} rotation={[isOccupied ? 0.35 : 1.4, 0, 0]}>
          <mesh position={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[0.28, 0.2, 0.008]} />
            <meshStandardMaterial color="#493A63" roughness={0.3} metalness={0.8} />
          </mesh>
          {/* Glowing Screen */}
          <mesh position={[0, 0.1, 0.005]}>
            <planeGeometry args={[0.26, 0.18]} />
            <meshStandardMaterial
              color={isOccupied ? '#9B7EDB' : '#C9B8E8'}
              emissive={isOccupied ? '#9B7EDB' : '#000000'}
              emissiveIntensity={isOccupied ? 0.6 : 0}
            />
          </mesh>
        </group>
      </group>

      {/* Desk Props: Open Notebook & Pencil */}
      <mesh position={[0.32, height + 0.01, 0.08]} rotation={[0, -0.15, 0]} castShadow>
        <boxGeometry args={[0.2, 0.01, 0.26]} />
        <meshStandardMaterial color="#FCF9EE" roughness={0.9} />
      </mesh>
      <mesh position={[-0.32, height + 0.015, 0.05]} rotation={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.18, 0.02, 0.22]} />
        <meshStandardMaterial color="#F4C9B4" roughness={0.8} />
      </mesh>
    </group>
  )
}

