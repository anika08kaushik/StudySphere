import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import StudyAvatar from './StudyAvatar'

export default function WalkController({
  avatarConfig,
  targetDesk,
  onArrived,
  isSeatedInitial = false,
}) {
  // State: 'IDLE' | 'WALKING' | 'APPROACHING_DESK' | 'TURNING' | 'SITTING' | 'STUDYING'
  const [avatarState, setAvatarState] = useState(isSeatedInitial ? 'STUDYING' : 'WALKING')
  const avatarGroupRef = useRef()
  const positionRef = useRef(new THREE.Vector3(0, 0, 5))
  const rotationRef = useRef(0)
  const waypointIndexRef = useRef(0)
  const waypointsRef = useRef([])
  const arrivalTimeoutRef = useRef(null)
  const hasScheduledArrivalRef = useRef(false)

  useEffect(() => {
    if (!targetDesk) {
      positionRef.current.set(0, 0, 5)
      return
    }

    hasScheduledArrivalRef.current = false
    const deskPos = targetDesk.pos
    if (isSeatedInitial) {
      positionRef.current.set(deskPos[0], 0, deskPos[2] + 0.45)
      rotationRef.current = targetDesk.rot[1] + Math.PI
      return
    }

    // Calculate path waypoints: Start -> Walk down aisle -> Walk to desk front -> Sit in chair
    waypointsRef.current = [
      new THREE.Vector3(0, 0, 5),
      new THREE.Vector3(deskPos[0], 0, 5),
      new THREE.Vector3(deskPos[0], 0, deskPos[2] + 1.0),
      new THREE.Vector3(deskPos[0], 0, deskPos[2] + 0.45),
    ]
    waypointIndexRef.current = 0
    return () => {
      if (arrivalTimeoutRef.current) {
        clearTimeout(arrivalTimeoutRef.current)
      }
    }
  }, [targetDesk, isSeatedInitial])

  useFrame((state, delta) => {
    if (avatarState === 'WALKING') {
      const currentTarget = waypointsRef.current[waypointIndexRef.current]
      if (!currentTarget) return

      const moveSpeed = 3.2 * delta
      const dist = positionRef.current.distanceTo(currentTarget)

      if (dist < 0.15) {
        // Move to next waypoint
        waypointIndexRef.current += 1
        if (waypointIndexRef.current >= waypointsRef.current.length) {
          // Reached final waypoint (chair)
          setAvatarState('TURNING')
        }
      } else {
        // Lerp position towards waypoint
        const dir = new THREE.Vector3().subVectors(currentTarget, positionRef.current).normalize()
        positionRef.current.add(dir.multiplyScalar(moveSpeed))
        // Calculate angle facing direction of movement
        rotationRef.current = THREE.MathUtils.lerp(
          rotationRef.current,
          Math.atan2(dir.x, dir.z),
          0.15
        )
      }
    } else if (avatarState === 'TURNING') {
      // Rotate facing desk
      const targetRot = targetDesk ? targetDesk.rot[1] + Math.PI : 0
      rotationRef.current = THREE.MathUtils.lerp(rotationRef.current, targetRot, 0.15)

      if (Math.abs(rotationRef.current - targetRot) < 0.05 && !hasScheduledArrivalRef.current) {
        hasScheduledArrivalRef.current = true
        setAvatarState('SITTING')
        arrivalTimeoutRef.current = setTimeout(() => {
          setAvatarState('STUDYING')
          if (onArrived) onArrived()
        }, 400)
      }
    }

    if (avatarGroupRef.current) {
      avatarGroupRef.current.position.copy(positionRef.current)
      avatarGroupRef.current.rotation.y = rotationRef.current
    }
  })

  const isSeated = avatarState === 'SITTING' || avatarState === 'STUDYING'
  const isWalking = avatarState === 'WALKING'

  return (
    <group ref={avatarGroupRef}>
      <StudyAvatar
        avatarConfig={avatarConfig}
        isSeated={isSeated}
        isWalking={isWalking}
        isCurrentUser={true}
      />
    </group>
  )
}
