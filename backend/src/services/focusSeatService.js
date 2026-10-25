export const FOCUS_SEAT_IDS = Object.freeze([
  'desk-01',
  'desk-02',
  'desk-03',
  'desk-04',
  'desk-05',
  'desk-06',
])

export const resolveFocusSeat = (seatId, deskIndex) => {
  if (typeof seatId === 'string') {
    const index = FOCUS_SEAT_IDS.indexOf(seatId)
    return index === -1 ? null : { seatId, deskIndex: index }
  }

  if (Number.isInteger(deskIndex) && deskIndex >= 0 && deskIndex < FOCUS_SEAT_IDS.length) {
    return { seatId: FOCUS_SEAT_IDS[deskIndex], deskIndex }
  }

  return null
}

export const findFocusSeatConflict = (room, socketId, seatId) => {
  for (const [participantSocketId, participant] of room) {
    if (participantSocketId === socketId) continue
    const participantSeat = resolveFocusSeat(participant.seatId, participant.deskIndex)
    if (participantSeat?.seatId === seatId) return participant
  }
  return null
}
