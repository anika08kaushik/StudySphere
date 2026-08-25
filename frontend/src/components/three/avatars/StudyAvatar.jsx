import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import NameLabel from './NameLabel'

export default function StudyAvatar({
  avatarConfig,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isSeated = false,
  isWalking = false,
  isCurrentUser = false,
  walkCycle = 0,
}) {
  const groupRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const torsoRef = useRef()

  const name = avatarConfig?.name || 'Student'
  const hairColor = avatarConfig?.hairColor || '#493A63'
  const skinTone = avatarConfig?.skinTone || '#F3C5A5'
  const outfitColor = avatarConfig?.outfitColor || '#9B7EDB'
  const accessory = avatarConfig?.accessory || 'headphones'

  useFrame((state) => {
    const time = state.clock.elapsedTime

    // Breathing micro-animation
    if (torsoRef.current) {
      torsoRef.current.scale.y = 1 + Math.sin(time * 2) * 0.005
    }

    // Walking leg and arm swing animation
    if (isWalking) {
      const swing = Math.sin(time * 10) * 0.4
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.6
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.6
    } else if (!isSeated) {
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0
    }
  })

  // Vertical offsets for seated vs standing
  const headY = isSeated ? 1.05 : 1.55
  const torsoY = isSeated ? 0.72 : 1.12
  const armAngle = isSeated ? -0.4 : 0
  const forearmAngle = isSeated ? -0.8 : 0
  const legAngle = isSeated ? -Math.PI / 2 + 0.2 : 0

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Torso / Outfit Hoodie */}
      <mesh ref={torsoRef} position={[0, torsoY, 0]} castShadow>
        <boxGeometry args={[0.26, 0.34, 0.14]} />
        <meshStandardMaterial color={outfitColor} roughness={0.5} />
      </mesh>

      {/* Head */}
      <mesh position={[0, headY, 0]} castShadow>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial color={skinTone} roughness={0.6} />
      </mesh>

      {/* Hair */}
      <mesh position={[0, headY + 0.06, -0.01]} castShadow>
        <sphereGeometry args={[0.115, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        <meshStandardMaterial color={hairColor} roughness={0.8} />
      </mesh>

      {/* Accessory: Headphones */}
      {accessory === 'headphones' && (
        <group position={[0, headY + 0.02, 0]}>
          <mesh position={[0, 0.1, 0]}>
            <torusGeometry args={[0.12, 0.015, 8, 24, Math.PI]} />
            <meshStandardMaterial color="#493A63" roughness={0.3} />
          </mesh>
          <mesh position={[-0.12, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.02, 12]} />
            <meshStandardMaterial color="#493A63" metalness={0.5} />
          </mesh>
          <mesh position={[0.12, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.02, 12]} />
            <meshStandardMaterial color="#493A63" metalness={0.5} />
          </mesh>
        </group>
      )}

      {/* Accessory: Glasses */}
      {accessory === 'glasses' && (
        <group position={[0, headY + 0.01, 0.1]}>
          <mesh position={[-0.045, 0, 0]}>
            <ringGeometry args={[0.025, 0.032, 12]} />
            <meshStandardMaterial color="#2C1810" roughness={0.2} />
          </mesh>
          <mesh position={[0.045, 0, 0]}>
            <ringGeometry args={[0.025, 0.032, 12]} />
            <meshStandardMaterial color="#2C1810" roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.03, 0.005, 0.005]} />
            <meshStandardMaterial color="#2C1810" />
          </mesh>
        </group>
      )}

      {/* Accessory: Beanie */}
      {accessory === 'beanie' && (
        <group position={[0, headY + 0.08, 0]}>
          <mesh position={[0, 0.03, 0]}>
            <sphereGeometry args={[0.12, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#F4C9B4" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.17, torsoY + 0.1, 0]} rotation={[armAngle, 0, 0]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.032, 0.028, 0.22, 8]} />
          <meshStandardMaterial color={outfitColor} roughness={0.5} />
        </mesh>
        <group position={[0, -0.22, 0]} rotation={[forearmAngle, 0, 0]}>
          <mesh position={[0, -0.08, 0]} castShadow>
            <cylinderGeometry args={[0.026, 0.022, 0.18, 8]} />
            <meshStandardMaterial color={outfitColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.17, 0.03]} castShadow>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color={skinTone} roughness={0.6} />
          </mesh>
        </group>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.17, torsoY + 0.1, 0]} rotation={[armAngle, 0, 0]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.032, 0.028, 0.22, 8]} />
          <meshStandardMaterial color={outfitColor} roughness={0.5} />
        </mesh>
        <group position={[0, -0.22, 0]} rotation={[forearmAngle, 0, 0]}>
          <mesh position={[0, -0.08, 0]} castShadow>
            <cylinderGeometry args={[0.026, 0.022, 0.18, 8]} />
            <meshStandardMaterial color={outfitColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.17, 0.03]} castShadow>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color={skinTone} roughness={0.6} />
          </mesh>
        </group>
      </group>

      {/* Legs (Seated vs Standing) */}
      {isSeated ? (
        <>
          <group position={[-0.07, 0.5, 0.05]} rotation={[legAngle, 0, 0]}>
            <mesh position={[0, 0.1, 0]} castShadow>
              <boxGeometry args={[0.08, 0.24, 0.08]} />
              <meshStandardMaterial color="#493A63" roughness={0.7} />
            </mesh>
          </group>
          <group position={[0.07, 0.5, 0.05]} rotation={[legAngle, 0, 0]}>
            <mesh position={[0, 0.1, 0]} castShadow>
              <boxGeometry args={[0.08, 0.24, 0.08]} />
              <meshStandardMaterial color="#493A63" roughness={0.7} />
            </mesh>
          </group>
        </>
      ) : (
        <>
          <group ref={leftLegRef} position={[-0.07, 0.35, 0]}>
            <mesh position={[0, -0.16, 0]} castShadow>
              <boxGeometry args={[0.08, 0.36, 0.08]} />
              <meshStandardMaterial color="#493A63" roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.38, 0.03]} castShadow>
              <boxGeometry args={[0.09, 0.06, 0.13]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
            </mesh>
          </group>
          <group ref={rightLegRef} position={[0.07, 0.35, 0]}>
            <mesh position={[0, -0.16, 0]} castShadow>
              <boxGeometry args={[0.08, 0.36, 0.08]} />
              <meshStandardMaterial color="#493A63" roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.38, 0.03]} castShadow>
              <boxGeometry args={[0.09, 0.06, 0.13]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
            </mesh>
          </group>
        </>
      )}

      {/* Name Label Floating Above Head */}
      <NameLabel
        name={name}
        status={isSeated ? 'focusing' : 'online'}
        position={[0, headY + 0.25, 0]}
      />
    </group>
  )
}
