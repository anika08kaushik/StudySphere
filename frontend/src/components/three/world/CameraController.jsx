import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

export default function CameraController({ cameraMode = 'EXPLORE', selectedDesk = null }) {
  const { camera } = useThree()
  const controlsRef = useRef()
  const targetPosRef = useRef(new THREE.Vector3(0, 6, 9))
  const targetLookAtRef = useRef(new THREE.Vector3(0, 1, 0))
  const isTransitioningRef = useRef(true)

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
      targetLookAtRef.current.set(dx, 1.05, dz + 0.45)
    }
    isTransitioningRef.current = true
  }, [cameraMode, selectedDesk])

  useFrame(() => {
    if (!controlsRef.current) return
    if (isTransitioningRef.current) {
      camera.position.lerp(targetPosRef.current, 0.08)
      controlsRef.current.target.lerp(targetLookAtRef.current, 0.08)
      if (
        camera.position.distanceToSquared(targetPosRef.current) < 0.0025 &&
        controlsRef.current.target.distanceToSquared(targetLookAtRef.current) < 0.0025
      ) {
        camera.position.copy(targetPosRef.current)
        controlsRef.current.target.copy(targetLookAtRef.current)
        isTransitioningRef.current = false
      }
    }
    controlsRef.current.update()
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      enableRotate
      enableZoom
      minPolarAngle={0.25}
      maxPolarAngle={1.45}
      minDistance={1.8}
      maxDistance={12}
      enablePan={false}
      autoRotate={false}
      onStart={() => {
        isTransitioningRef.current = false
      }}
    />
  )
}
