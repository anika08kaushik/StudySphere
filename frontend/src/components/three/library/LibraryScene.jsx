import { useState } from 'react'
import { Html } from '@react-three/drei'
import LibraryFloor from './LibraryFloor'
import LibraryWalls from './LibraryWalls'
import Bookshelf from './Bookshelf'
import Desk from './Desk'
import Chair from './Chair'
import Lamp from './Lamp'
import LibraryWindow from './LibraryWindow'
import DustParticles from './DustParticles'
import StudyAvatar from '../avatars/StudyAvatar'
import WalkController from '../avatars/WalkController'
import CameraController from '../world/CameraController'
import Decorations from './Decorations'
import EnvironmentLighting from './EnvironmentLighting'
import { ROOM } from './materials'

const DESK_LAYOUT = [
  { id: 'desk-01', pos: [-3, 0, -1], rot: [0, 0, 0], chairRot: [0, Math.PI, 0] },
  { id: 'desk-02', pos: [3, 0, -1], rot: [0, 0, 0], chairRot: [0, Math.PI, 0] },
  { id: 'desk-03', pos: [-3, 0, 3], rot: [0, Math.PI, 0], chairRot: [0, 0, 0] },
  { id: 'desk-04', pos: [3, 0, 3], rot: [0, Math.PI, 0], chairRot: [0, 0, 0] },
  { id: 'desk-05', pos: [0, 0, 1], rot: [0, Math.PI / 2, 0], chairRot: [0, Math.PI / 2, 0] },
  { id: 'desk-06', pos: [0, 0, 4.5], rot: [0, -Math.PI / 2, 0], chairRot: [0, -Math.PI / 2, 0] },
]

const BOOKSHELF_LAYOUT = [
  { pos: [-6, 0, -ROOM.depth / 2 + 0.3], rot: [0, 0, 0], seed: 10 },
  { pos: [0, 0, -ROOM.depth / 2 + 0.3], rot: [0, 0, 0], seed: 20 },
  { pos: [6, 0, -ROOM.depth / 2 + 0.3], rot: [0, 0, 0], seed: 30 },
  { pos: [-ROOM.width / 2 + 0.3, 0, -3], rot: [0, Math.PI / 2, 0], seed: 40 },
  { pos: [ROOM.width / 2 - 0.3, 0, -3], rot: [0, -Math.PI / 2, 0], seed: 50 },
]

const WINDOW_POSITIONS = [
  { pos: [-4, 2.2, -ROOM.depth / 2 + 0.25], rot: [0, 0, 0] },
  { pos: [4, 2.2, -ROOM.depth / 2 + 0.25], rot: [0, 0, 0] },
]

// Mock Occupants in Library
const MOCK_OCCUPANTS = {
  1: { name: 'Maya', preset: 'maya', outfitColor: '#9B7EDB', hairColor: '#493A63', skinTone: '#F3C5A5', accessory: 'headphones' },
  3: { name: 'Alex', preset: 'alex', outfitColor: '#8FBA99', hairColor: '#E58C6B', skinTone: '#FBE4D8', accessory: 'glasses' },
}

export default function LibraryScene({
  userAvatarConfig,
  selectedDeskIndex = null,
  onSelectDesk,
  onAvatarArrived,
  cameraMode = 'EXPLORE',
}) {
  const [hoveredDesk, setHoveredDesk] = useState(null)

  return (
    <>
      <EnvironmentLighting />
      <LibraryFloor />
      <LibraryWalls />

      {/* Bookcases & Decorations */}
      {BOOKSHELF_LAYOUT.map((shelf, i) => (
        <Bookshelf
          key={i}
          position={shelf.pos}
          rotation={shelf.rot}
          seed={shelf.seed}
          height={3.2}
          shelfCount={5}
        />
      ))}

      {WINDOW_POSITIONS.map((w, i) => (
        <LibraryWindow key={i} position={w.pos} rotation={w.rot} />
      ))}

      <Decorations />

      {/* Interactive Desks & Seated Avatars */}
      {DESK_LAYOUT.map((desk, i) => {
        const mockOccupant = MOCK_OCCUPANTS[i]
        const isUserDesk = selectedDeskIndex === i
        const isOccupied = !!mockOccupant || isUserDesk
        const chairPulled = !isOccupied
        const chairSign = desk.chairRot[1] === 0 ? 1 : -1

        return (
          <group key={desk.id}>
            <Desk position={desk.pos} rotation={desk.rot} isOccupied={isOccupied} />
            <Chair
              position={[
                desk.pos[0],
                desk.pos[1],
                desk.pos[2] + (desk.rot[1] === 0 ? 0.55 : 0) * chairSign,
              ]}
              rotation={desk.chairRot}
              pulledOut={chairPulled}
            />
            <Lamp
              position={[
                desk.pos[0] + (desk.rot[1] === 0 ? 0.35 : 0) * Math.cos(desk.rot[1]),
                desk.pos[1] + 0.75,
                desk.pos[2] + (desk.rot[1] === 0 ? -0.15 : 0.35) * Math.sin(desk.rot[1]),
              ]}
              isOn={isOccupied}
            />

            {/* Other Seated Students */}
            {mockOccupant && !isUserDesk && (
              <StudyAvatar
                avatarConfig={mockOccupant}
                position={[desk.pos[0], desk.pos[1] + 0.05, desk.pos[2] + (desk.rot[1] === 0 ? 0.35 : 0) * chairSign]}
                rotation={[0, desk.rot[1] + Math.PI, 0]}
                isSeated={true}
              />
            )}

            {/* Interactive Hitbox for Available Desks */}
            {!mockOccupant && !isUserDesk && (
              <group position={desk.pos}>
                <mesh
                  position={[0, 0.5, 0]}
                  onPointerEnter={(e) => {
                    e.stopPropagation()
                    setHoveredDesk(i)
                  }}
                  onPointerLeave={(e) => {
                    e.stopPropagation()
                    setHoveredDesk(null)
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onSelectDesk) onSelectDesk(i)
                  }}
                >
                  <boxGeometry args={[1.4, 1.1, 0.8]} />
                  <meshStandardMaterial transparent opacity={0} />
                </mesh>

                {/* Soft Pastel Hover Card Tooltip */}
                {hoveredDesk === i && (
                  <Html position={[0, 1.3, 0]} center style={{ pointerEvents: 'none' }}>
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1.5px solid #9B7EDB',
                        borderRadius: '12px',
                        padding: '8px 14px',
                        color: '#493A63',
                        fontSize: '12px',
                        fontWeight: '700',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 8px 24px rgba(73, 58, 99, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>🪑</span>
                      <span>Desk 0{i + 1} • Available • Click to sit</span>
                    </div>
                  </Html>
                )}
              </group>
            )}

            {/* Tooltip for Occupied Desks */}
            {mockOccupant && hoveredDesk === i && (
              <Html position={[desk.pos[0], desk.pos[1] + 1.4, desk.pos[2]]} center style={{ pointerEvents: 'none' }}>
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #F4C9B4',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    color: '#493A63',
                    fontSize: '12px',
                    fontWeight: '700',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 8px 24px rgba(73, 58, 99, 0.15)',
                  }}
                >
                  👩 Occupied by {mockOccupant.name} (Focusing)
                </div>
              </Html>
            )}
          </group>
        )
      })}

      {/* User's Walking / Seated Avatar */}
      {selectedDeskIndex !== null && (
        <WalkController
          avatarConfig={userAvatarConfig}
          targetDesk={DESK_LAYOUT[selectedDeskIndex]}
          onArrived={onAvatarArrived}
        />
      )}

      <DustParticles count={35} />

      <CameraController
        cameraMode={cameraMode}
        selectedDesk={selectedDeskIndex !== null ? DESK_LAYOUT[selectedDeskIndex] : null}
      />
    </>
  )
}

