import { ROOM } from './materials'

export default function EnvironmentLighting() {
  const hh = ROOM.height

  return (
    <>
      {/* Warm ambient light for soft light room atmosphere */}
      <ambientLight intensity={0.7} color="#FFF9EE" />

      {/* Warm sunlight streaming through window */}
      <directionalLight
        position={[6, hh + 4, 8]}
        intensity={1.1}
        color="#FFF6E0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Cozy fill lighting */}
      <pointLight position={[-4, 3.2, -4]} intensity={0.4} color="#F6D98B" distance={8} decay={2} />
      <pointLight position={[4, 3.2, -4]} intensity={0.4} color="#F6D98B" distance={8} decay={2} />

      {/* Soft lavender fog transition */}
      <fog attach="fog" args={['#F8F5FF', 14, 32]} />
    </>
  )
}

