import assert from 'node:assert/strict'
import test from 'node:test'
import {
  findFocusSeatConflict,
  FOCUS_SEAT_IDS,
  resolveFocusSeat,
} from '../src/services/focusSeatService.js'
import { registerFocusSocket } from '../src/sockets/focusSocket.js'

test('focus seat identifiers resolve consistently and reject unknown seats', () => {
  assert.deepEqual(resolveFocusSeat('desk-03'), { seatId: 'desk-03', deskIndex: 2 })
  assert.deepEqual(resolveFocusSeat(null, 2), { seatId: 'desk-03', deskIndex: 2 })
  assert.equal(resolveFocusSeat('desk-99'), null)
  assert.equal(resolveFocusSeat(null, 6), null)
  assert.equal(FOCUS_SEAT_IDS.length, 6)
})

test('a seat cannot be claimed by two participants in the same room', () => {
  const room = new Map([
    ['socket-a', { seatId: 'desk-01', deskIndex: 0 }],
    ['socket-b', { seatId: 'desk-02', deskIndex: 1 }],
  ])

  assert.equal(findFocusSeatConflict(room, 'socket-c', 'desk-01'), room.get('socket-a'))
  assert.equal(findFocusSeatConflict(room, 'socket-b', 'desk-02'), null)
  assert.equal(findFocusSeatConflict(new Map(), 'socket-a', 'desk-01'), null)
})

test('focus socket rejects a duplicate seat and allows it after it is released', async () => {
  const broadcasts = []
  const io = {
    to: (roomId) => ({
      emit: (event, data) => broadcasts.push({ roomId, event, data }),
    }),
  }
  const createSocket = (id, userId) => {
    const handlers = new Map()
    const emissions = []
    return {
      id,
      user: { userId, name: userId },
      handlers,
      emissions,
      on: (event, handler) => handlers.set(event, handler),
      emit: (event, data) => emissions.push({ event, data }),
      join: () => {},
      leave: () => {},
    }
  }
  const firstUser = createSocket('focus-seat-test-a', 'test-user-a')
  const secondUser = createSocket('focus-seat-test-b', 'test-user-b')
  registerFocusSocket(io, firstUser)
  registerFocusSocket(io, secondUser)

  await firstUser.handlers.get('focus:join')({
    groupId: 'focus-seat-test-room',
    seatId: 'desk-01',
  })
  await secondUser.handlers.get('focus:join')({
    groupId: 'focus-seat-test-room',
    seatId: 'desk-01',
  })

  const joinConflict = secondUser.emissions
    .filter((event) => event.event === 'focus:seat_conflict')
    .pop()
  assert.equal(joinConflict?.data.reason, 'occupied')
  secondUser.handlers.get('focus:select_desk')({
    groupId: 'focus-seat-test-room',
    seatId: 'desk-01',
  })
  assert.equal(
    secondUser.emissions.filter((event) => event.event === 'focus:seat_conflict').length,
    2
  )

  firstUser.handlers.get('focus:leave')({ groupId: 'focus-seat-test-room' })
  secondUser.handlers.get('focus:select_desk')({
    groupId: 'focus-seat-test-room',
    seatId: 'desk-01',
  })
  const latestPresence = broadcasts
    .filter((event) => event.event === 'focus:presence_update')
    .at(-1)
  const secondParticipant = latestPresence.data.participants.find(
    (participant) => participant.socketId === secondUser.id
  )
  assert.equal(secondParticipant.seatId, 'desk-01')

  secondUser.handlers.get('focus:leave')({ groupId: 'focus-seat-test-room' })
})
