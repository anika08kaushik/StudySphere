import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'

export default function SceneContainer({
  children,
  className = '',
  camera = [0, 0, 6],
  fov = 50,
  dpr,
  shadows = false,
}) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <Canvas
        camera={{ position: camera, fov }}
        dpr={dpr || [1, 1.5]}
        shadows={shadows}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </Canvas>
    </div>
  )
}
