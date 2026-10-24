import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clearSavedFocusSeat,
  getFocusSeatStorageKey,
  readSavedFocusSeat,
  saveFocusSeat,
} from './focusSeatStorage.js'

const createStorage = () => {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

test('focus seats persist independently for each user and room', () => {
  const storage = createStorage()
  const seatIds = ['desk-01', 'desk-02']

  saveFocusSeat('user-a', 'room-a', 'desk-01', storage)
  saveFocusSeat('user-a', 'room-b', 'desk-02', storage)
  saveFocusSeat('user-b', 'room-a', 'desk-02', storage)

  assert.equal(readSavedFocusSeat('user-a', 'room-a', seatIds, storage), 'desk-01')
  assert.equal(readSavedFocusSeat('user-a', 'room-b', seatIds, storage), 'desk-02')
  assert.equal(readSavedFocusSeat('user-b', 'room-a', seatIds, storage), 'desk-02')
})

test('an invalid saved seat is removed so the user can choose another', () => {
  const storage = createStorage()
  const key = getFocusSeatStorageKey('user-a', 'room-a')
  storage.setItem(key, 'desk-99')

  assert.equal(readSavedFocusSeat('user-a', 'room-a', ['desk-01'], storage), null)
  assert.equal(storage.getItem(key), null)
})

test('leaving a room does not clear its seat unless explicitly requested', () => {
  const storage = createStorage()
  saveFocusSeat('user-a', 'room-a', 'desk-01', storage)

  assert.equal(readSavedFocusSeat('user-a', 'room-a', ['desk-01'], storage), 'desk-01')
  clearSavedFocusSeat('user-a', 'room-a', storage)
  assert.equal(readSavedFocusSeat('user-a', 'room-a', ['desk-01'], storage), null)
})
