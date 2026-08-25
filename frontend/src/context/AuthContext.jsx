import { createContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('studysphere_token')
    if (token) {
      api.get('/users/profile')
        .then((res) => setUser(res.data.data || res.data.user || res.data))
        .catch(() => localStorage.removeItem('studysphere_token'))
        .finally(() => setLoading(false))
    } else {
      // Defer to avoid synchronous setState in effect
      Promise.resolve().then(() => setLoading(false))
    }
  }, [])

  const login = (nextUser, token) => {
    setUser(nextUser)
    if (token) localStorage.setItem('studysphere_token', token)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('studysphere_token')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: Boolean(user), loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
