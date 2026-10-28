/**
 * Focus Seat Storage Service
 *
 * Persists user seat preferences across focus room sessions using localStorage.
 * Provides sync external store hook for reactive cross-tab and component state.
 */
import { useCallback, useMemo, useSyncExternalStore } from 'react'

const FOCUS_SEAT_CHANGE_EVENT = 'studysphere:focus-seat-change'

export const getFocusSeatStorageKey = (userId, roomId) =>
  `studysphere:focus-seat:${encodeURIComponent(String(userId))}:${encodeURIComponent(String(roomId))}`

const getStorage = () => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch (error) {
    console.warn('Focus seat storage is unavailable:', error?.message)
    return null
  }
}

const notifyFocusSeatSubscribers = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(FOCUS_SEAT_CHANGE_EVENT))
  }
}

export const useSavedFocusSeat = (userId, roomId) => {
  const key = useMemo(
    () => userId && roomId ? getFocusSeatStorageKey(userId, roomId) : null,
    [userId, roomId]
  )
  const subscribe = useCallback((callback) => {
    if (typeof window === 'undefined' || !key) return () => {}
    const handleChange = (event) => {
      if (event.type === FOCUS_SEAT_CHANGE_EVENT || event.key === key) callback()
    }
    window.addEventListener('storage', handleChange)
    window.addEventListener(FOCUS_SEAT_CHANGE_EVENT, handleChange)
    return () => {
      window.removeEventListener('storage', handleChange)
      window.removeEventListener(FOCUS_SEAT_CHANGE_EVENT, handleChange)
    }
  }, [key])
  const getSnapshot = useCallback(() => {
    const storage = getStorage()
    if (!key || !storage) return null
    try {
      return storage.getItem(key)
    } catch (error) {
      console.warn('Unable to read the saved focus seat:', error?.message)
      return null
    }
  }, [key])

  return useSyncExternalStore(subscribe, getSnapshot, () => null)
}

export const readSavedFocusSeat = (userId, roomId, validSeatIds, storage = getStorage()) => {
  if (!userId || !roomId || !storage) return null

  const key = getFocusSeatStorageKey(userId, roomId)
  try {
    const seatId = storage.getItem(key)
    if (!seatId) return null
    if (!validSeatIds.includes(seatId)) {
      storage.removeItem(key)
      return null
    }
    return seatId
  } catch (error) {
    console.warn('Unable to restore the saved focus seat:', error?.message)
    return null
  }
}

export const saveFocusSeat = (userId, roomId, seatId, storage = getStorage()) => {
  if (!userId || !roomId || !seatId || !storage) return
  try {
    storage.setItem(getFocusSeatStorageKey(userId, roomId), seatId)
    notifyFocusSeatSubscribers()
  } catch (error) {
    console.warn('Unable to save the selected focus seat:', error?.message)
  }
}

export const clearSavedFocusSeat = (userId, roomId, storage = getStorage()) => {
  if (!userId || !roomId || !storage) return
  try {
    storage.removeItem(getFocusSeatStorageKey(userId, roomId))
    notifyFocusSeatSubscribers()
  } catch (error) {
    console.warn('Unable to clear the saved focus seat:', error?.message)
  }
}
