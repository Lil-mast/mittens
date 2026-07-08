import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [plan, setPlan]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('mittens_token')
    if (token) fetchMe(token)
    else setLoading(false)
  }, [])

  const fetchMe = async (token) => {
    try {
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(res.data.user)
      setPlan(res.data.plan)
    } catch {
      localStorage.removeItem('mittens_token')
    } finally {
      setLoading(false)
    }
  }

  const login = (token) => {
    localStorage.setItem('mittens_token', token)
    fetchMe(token)
  }

  const logout = () => {
    localStorage.removeItem('mittens_token')
    setUser(null)
    setPlan(null)
  }

  return (
    <AuthContext.Provider value={{ user, plan, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
