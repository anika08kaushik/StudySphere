import { createContext, useContext, useState, useEffect } from 'react'
import notificationService from '../services/notificationService'
import { onNewNotification, offNewNotification } from '../services/socket'

const AppContext = createContext(null)

const DEFAULT_AVATAR = {
  preset: 'maya',
  name: '',
  hairStyle: 'long',
  hairColor: '#493A63', // dark plum
  skinTone: '#F3C5A5', // warm peach
  outfitStyle: 'hoodie',
  outfitColor: '#9B7EDB', // lavender primary
  accessory: 'headphones',
}

export function AppProvider({ children }) {
  const [currentGroup, setCurrentGroup] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [avatarConfig, setAvatarConfig] = useState(DEFAULT_AVATAR)
  const [activeDeskId, setActiveDeskId] = useState(null)
  const [isStudying, setIsStudying] = useState(false)

  const updateAvatar = (newConfig) => {
    setAvatarConfig((prev) => ({ ...prev, ...newConfig }))
  }

  // Load real unread count on startup and listen to real-time events
  useEffect(() => {
    const token = localStorage.getItem('studysphere_token')
    if (token) {
      notificationService
        .getNotifications()
        .then((res) => {
          const data = res.data?.data
          if (Array.isArray(data)) {
            setUnreadCount(data.filter((n) => !n.read).length)
          }
        })
        .catch(() => {})
    }

    const handleLiveNotif = (notif) => {
      if (!notif) return
      const storedUser = localStorage.getItem('studysphere_user')
      const currentUserId = storedUser ? JSON.parse(storedUser)?.id || JSON.parse(storedUser)?._id : null
      if (!notif.recipient || (currentUserId && String(notif.recipient) === String(currentUserId))) {
        setUnreadCount((prev) => prev + 1)
      }
    }

    onNewNotification(handleLiveNotif)
    return () => {
      offNewNotification(handleLiveNotif)
    }
  }, [])

  return (
    <AppContext.Provider
      value={{
        currentGroup,
        setCurrentGroup,
        unreadCount,
        setUnreadCount,
        avatarConfig,
        updateAvatar,
        activeDeskId,
        setActiveDeskId,
        isStudying,
        setIsStudying,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext)

