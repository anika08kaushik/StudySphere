export default function Decorations() {
  return (
    <group>
      {/* Soft Area Rug under Central Desks */}
      <mesh position={[0, 0.01, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 7]} />
        <meshStandardMaterial color="#E9DFFF" roughness={0.9} opacity={0.85} transparent />
      </mesh>

      {/* Rug Decorative Border */}
      <mesh position={[0, 0.015, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8.6, 6.6]} />
        <meshStandardMaterial color="#F3ECFE" roughness={0.9} opacity={0.6} transparent />
      </mesh>

      {/* Potted Plant 1 (Corner Left) */}
      <group position={[-5.8, 0, -4]}>
        {/* Pot */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.22, 0.7, 12]} />
          <meshStandardMaterial color="#F4C9B4" roughness={0.7} />
        </mesh>
        {/* Leaves */}
        <mesh position={[0, 0.9, 0]} castShadow>
          <dodecahedronGeometry args={[0.5, 1]} />
          <meshStandardMaterial color="#8FBA99" roughness={0.6} />
        </mesh>
        <mesh position={[0.1, 1.2, -0.1]} castShadow>
          <sphereGeometry args={[0.35, 10, 10]} />
          <meshStandardMaterial color="#A3C9A8" roughness={0.6} />
        </mesh>
      </group>

      {/* Potted Plant 2 (Corner Right) */}
      <group position={[5.8, 0, -4]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.2, 0.65, 12]} />
          <meshStandardMaterial color="#FCF9EE" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.85, 0]} castShadow>
          <dodecahedronGeometry args={[0.45, 1]} />
          <meshStandardMaterial color="#8FBA99" roughness={0.6} />
        </mesh>
      </group>

      {/* Plant 3 (Entrance Left) */}
      <group position={[-5.8, 0, 4.5]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.18, 0.6, 12]} />
          <meshStandardMaterial color="#C9B8E8" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.75, 0]} castShadow>
          <sphereGeometry args={[0.4, 10, 10]} />
          <meshStandardMaterial color="#8FBA99" roughness={0.6} />
        </mesh>
      </group>

      {/* Notice Board on Back Wall */}
      <group position={[0, 2.8, -4.95]}>
        <mesh castShadow>
          <boxGeometry args={[3.2, 1.6, 0.06]} />
          <meshStandardMaterial color="#DFAB79" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[3.0, 1.4, 0.04]} />
          <meshStandardMaterial color="#E8D8C3" roughness={0.9} />
        </mesh>

        {/* Sticky Notes on Notice Board */}
        <mesh position={[-0.9, 0.3, 0.05]} rotation={[0, 0, 0.05]}>
          <planeGeometry args={[0.4, 0.4]} />
          <meshStandardMaterial color="#F6D98B" roughness={0.8} />
        </mesh>
        <mesh position={[-0.3, -0.2, 0.05]} rotation={[0, 0, -0.08]}>
          <planeGeometry args={[0.45, 0.45]} />
          <meshStandardMaterial color="#F5C2C7" roughness={0.8} />
        </mesh>
        <mesh position={[0.5, 0.2, 0.05]} rotation={[0, 0, 0.02]}>
          <planeGeometry args={[0.4, 0.4]} />
          <meshStandardMaterial color="#C9B8E8" roughness={0.8} />
        </mesh>
        <mesh position={[1.0, -0.3, 0.05]} rotation={[0, 0, -0.04]}>
          <planeGeometry args={[0.38, 0.38]} />
          <meshStandardMaterial color="#BFD8C0" roughness={0.8} />
        </mesh>
      </group>
    </group>
  )
}
