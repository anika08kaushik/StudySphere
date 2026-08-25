import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

const DEFAULT_AVATAR = {
  preset: 'maya',
  name: 'Anika',
  hairStyle: 'long',
  hairColor: '#493A63', // dark plum
  skinTone: '#F3C5A5', // warm peach
  outfitStyle: 'hoodie',
  outfitColor: '#9B7EDB', // lavender primary
  accessory: 'headphones',
}

export function AppProvider({ children }) {
  const [currentGroup, setCurrentGroup] = useState(null)
  const [unreadCount, setUnreadCount] = useState(3)
  const [avatarConfig, setAvatarConfig] = useState(DEFAULT_AVATAR)
  const [activeDeskId, setActiveDeskId] = useState(null)
  const [isStudying, setIsStudying] = useState(false)

  const updateAvatar = (newConfig) => {
    setAvatarConfig((prev) => ({ ...prev, ...newConfig }))
  }

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

