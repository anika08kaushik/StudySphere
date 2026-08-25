import { useMemo } from 'react'
import { COLORS } from './materials'

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export default function Bookshelf({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 1.4,
  height = 3.0,
  depth = 0.4,
  shelfCount = 5,
  seed = 42,
}) {
  const books = useMemo(() => {
    const rand = seededRandom(seed)
    const shelfSpacing = height / shelfCount
    const result = []

    for (let s = 0; s < shelfCount; s++) {
      const shelfY = s * shelfSpacing + shelfSpacing * 0.5
      const numBooks = 5 + Math.floor(rand() * 6)
      let x = -width / 2 + 0.05

      for (let b = 0; b < numBooks && x < width / 2 - 0.05; b++) {
        const bookWidth = 0.03 + rand() * 0.05
        const bookHeight = shelfSpacing * 0.5 + rand() * shelfSpacing * 0.35
        const bookDepth = depth * 0.8
        const colorIdx = Math.floor(rand() * COLORS.bookColors.length)

        result.push({
          key: `${s}-${b}`,
          position: [x + bookWidth / 2, shelfY - shelfSpacing * 0.15, 0],
          size: [bookWidth, bookHeight, bookDepth],
          color: COLORS.bookColors[colorIdx],
          rotation: (rand() - 0.5) * 0.04,
        })

        x += bookWidth + 0.005 + rand() * 0.01
      }
    }

    return result
  }, [width, height, depth, shelfCount, seed])

  const shelfSpacing = height / shelfCount

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[-width / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[0.04, height, depth]} />
        <meshStandardMaterial color={COLORS.woodDark} roughness={0.8} metalness={0.05} />
      </mesh>

      <mesh position={[width / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[0.04, height, depth]} />
        <meshStandardMaterial color={COLORS.woodDark} roughness={0.8} metalness={0.05} />
      </mesh>

      <mesh position={[0, height, 0]} castShadow>
        <boxGeometry args={[width + 0.04, 0.04, depth]} />
        <meshStandardMaterial color={COLORS.woodDark} roughness={0.8} metalness={0.05} />
      </mesh>

      {Array.from({ length: shelfCount + 1 }).map((_, i) => (
        <mesh key={`shelf-${i}`} position={[0, i * shelfSpacing, 0]} receiveShadow>
          <boxGeometry args={[width, 0.03, depth]} />
          <meshStandardMaterial color={COLORS.wood} roughness={0.75} metalness={0.05} />
        </mesh>
      ))}

      {books.map((book) => (
        <mesh key={book.key} position={book.position} rotation={[0, 0, book.rotation]} castShadow>
          <boxGeometry args={book.size} />
          <meshStandardMaterial color={book.color} roughness={0.7} metalness={0.1} />
        </mesh>
      ))}
    </group>
  )
}
