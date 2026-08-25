import { COLORS, ROOM } from './materials'

export default function LibraryFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[ROOM.width, ROOM.depth]} />
      <meshStandardMaterial
        color={COLORS.woodFloor}
        roughness={0.85}
        metalness={0.05}
      />
    </mesh>
  )
}
