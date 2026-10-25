import { createContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

const getStoredToken = () =>
  sessionStorage.getItem('studysphere_token') || localStorage.getItem('studysphere_token')

const getStoredUser = () => {
  const raw = sessionStorage.getItem('studysphere_user') || localStorage.getItem('studysphere_user')
  try {
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken)
  const [user, setUser] = useState(getStoredUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const activeToken = getStoredToken()
    if (activeToken) {
      setToken(activeToken)
      if (!sessionStorage.getItem('studysphere_token')) {
        sessionStorage.setItem('studysphere_token', activeToken)
      }
      const initialUser = getStoredUser()
      if (initialUser && !sessionStorage.getItem('studysphere_user')) {
        sessionStorage.setItem('studysphere_user', JSON.stringify(initialUser))
      }
      api
        .get('/users/profile')
        .then((res) => {
          const profile = res.data.data || res.data.user || res.data
          setUser(profile)
          if (profile) {
            sessionStorage.setItem('studysphere_user', JSON.stringify(profile))
            localStorage.setItem('studysphere_user', JSON.stringify(profile))
          }
        })
        .catch(() => {
          sessionStorage.removeItem('studysphere_token')
          sessionStorage.removeItem('studysphere_user')
          localStorage.removeItem('studysphere_token')
          localStorage.removeItem('studysphere_user')
          setUser(null)
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      Promise.resolve().then(() => setLoading(false))
    }
  }, [])

  const login = (nextUser, nextToken) => {
    setUser(nextUser)
    setToken(nextToken)
    if (nextToken) {
      sessionStorage.setItem('studysphere_token', nextToken)
      localStorage.setItem('studysphere_token', nextToken)
    }
    if (nextUser) {
      sessionStorage.setItem('studysphere_user', JSON.stringify(nextUser))
      localStorage.setItem('studysphere_user', JSON.stringify(nextUser))
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    sessionStorage.removeItem('studysphere_token')
    sessionStorage.removeItem('studysphere_user')
    localStorage.removeItem('studysphere_token')
    localStorage.removeItem('studysphere_user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: Boolean(user),
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
