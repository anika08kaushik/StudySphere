import { Text } from '@react-three/drei'

export default function NameLabel({ name, status, position = [0, 0, 0] }) {
  const statusLabel = {
    focusing: 'Focusing',
    online: 'Online',
    reading: 'Reading',
    discussion: 'Discussion',
    away: 'Away',
    offline: 'Offline',
  }

  return (
    <group position={position}>
      <Text
        fontSize={0.1}
        color="white"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.008}
        outlineColor="#000000"
        font={undefined}
      >
        {name}
      </Text>
      {status && (
        <Text
          position={[0, -0.13, 0]}
          fontSize={0.06}
          color={status === 'focusing' ? '#f59e0b' : status === 'online' ? '#22c55e' : '#94a3b8'}
          anchorX="center"
          anchorY="top"
          outlineWidth={0.005}
          outlineColor="#000000"
          font={undefined}
        >
          {statusLabel[status] || status}
        </Text>
      )}
    </group>
  )
}
