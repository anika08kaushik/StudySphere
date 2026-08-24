import { createContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const login = (nextUser, token) => {
    setUser(nextUser)
    if (token) localStorage.setItem('studysphere_token', token)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('studysphere_token')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
