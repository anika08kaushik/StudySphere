import { ROOM } from './materials'

export default function LibraryCeiling() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.height, 0]}>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial color="#2a2525" roughness={0.95} metalness={0} />
      </mesh>

      {[-3, 0, 3].map((x, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[x, ROOM.height - 0.01, -2]}>
          <planeGeometry args={[0.6, 0.6]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.15}
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}
    </group>
  )
}
