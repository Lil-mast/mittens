import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/me')
        const userData = res.data.user
        setUser(userData)
        setPlan(computePlan(userData))
      } catch {
        setUser(null)
        setPlan(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const computePlan = (userData) => {
    if (!userData) return null
    const trial = userData.Trial
    const subscription = userData.Subscription

    let planStatus = 'none'
    let daysLeft = 0
    let model = 'amazon.nova-micro-v1:0'

    if (subscription?.status === 'active') {
      planStatus = 'pro'
      model = 'amazon.nova-pro-v1:0'
    } else if (trial?.isActive && new Date(trial.endsAt) > new Date()) {
      planStatus = 'trial'
      daysLeft = Math.ceil(
        (new Date(trial.endsAt) - new Date()) / (1000 * 60 * 60 * 24)
      )
      model = 'amazon.nova-micro-v1:0'
    } else {
      planStatus = 'expired'
    }

    return {
      status: planStatus,
      daysLeft,
      model
    }
  }

  const signOut = async () => {
    try {
      await api.post('/auth/signout')
    } catch {
      // Ignore errors
    }
    setUser(null)
    setPlan(null)
    navigate('/')
  }

  return (
    <AuthContext.Provider value={{ user, plan, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)