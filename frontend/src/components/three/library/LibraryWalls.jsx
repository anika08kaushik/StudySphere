import { COLORS, ROOM } from './materials'

export default function LibraryWalls() {
  const hw = ROOM.width / 2
  const hd = ROOM.depth / 2
  const h = ROOM.height

  return (
    <group>
      {/* Back Wall */}
      <mesh position={[0, h / 2, -hd]} receiveShadow>
        <boxGeometry args={[ROOM.width, h, ROOM.wallThickness]} />
        <meshStandardMaterial color={COLORS.walls} roughness={0.9} metalness={0} />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-hw, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[ROOM.depth, h, ROOM.wallThickness]} />
        <meshStandardMaterial color={COLORS.walls} roughness={0.9} metalness={0} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[hw, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[ROOM.depth, h, ROOM.wallThickness]} />
        <meshStandardMaterial color={COLORS.walls} roughness={0.9} metalness={0} />
      </mesh>

      {/* Warm Peach Wooden Pillars */}
      <mesh position={[-hw + 0.5, h / 2, -hd + 0.5]} castShadow>
        <boxGeometry args={[0.7, h, 0.7]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.7} />
      </mesh>

      <mesh position={[hw - 0.5, h / 2, -hd + 0.5]} castShadow>
        <boxGeometry args={[0.7, h, 0.7]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.7} />
      </mesh>

      <mesh position={[-hw + 0.5, h / 2, hd - 0.5]} castShadow>
        <boxGeometry args={[0.7, h, 0.7]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.7} />
      </mesh>

      <mesh position={[hw - 0.5, h / 2, hd - 0.5]} castShadow>
        <boxGeometry args={[0.7, h, 0.7]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.7} />
      </mesh>
    </group>
  )
}

