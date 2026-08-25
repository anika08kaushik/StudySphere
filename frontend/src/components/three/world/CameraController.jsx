import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

export default function CameraController({ cameraMode = 'EXPLORE', selectedDesk = null }) {
  const { camera } = useThree()
  const controlsRef = useRef()
  const targetPosRef = useRef(new THREE.Vector3(0, 6, 9))
  const targetLookAtRef = useRef(new THREE.Vector3(0, 1, 0))

  useEffect(() => {
    if (cameraMode === 'OVERVIEW') {
      targetPosRef.current.set(0, 9, 11)
      targetLookAtRef.current.set(0, 0.5, 0)
    } else if (cameraMode === 'EXPLORE') {
      targetPosRef.current.set(0, 6, 9)
      targetLookAtRef.current.set(0, 1, 0)
    } else if (cameraMode === 'DESK_VIEW' && selectedDesk) {
      const [dx, , dz] = selectedDesk.pos
      targetPosRef.current.set(dx, 3.8, dz + 3.8)
      targetLookAtRef.current.set(dx, 0.8, dz)
    } else if (cameraMode === 'STUDY_VIEW' && selectedDesk) {
      const [dx, , dz] = selectedDesk.pos
      targetPosRef.current.set(dx, 2.2, dz + 2.4)
      targetLookAtRef.current.set(dx, 1.0, dz - 0.4)
    }
  }, [cameraMode, selectedDesk])

  useFrame(() => {
    if (!controlsRef.current) return
    // Smooth lerp camera position and target lookAt
    camera.position.lerp(targetPosRef.current, 0.05)
    controlsRef.current.target.lerp(targetLookAtRef.current, 0.05)
    controlsRef.current.update()
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minPolarAngle={0.2}
      maxPolarAngle={1.4}
      minDistance={2.5}
      maxDistance={16}
      enablePan={true}
      autoRotate={false}
    />
  )
}
