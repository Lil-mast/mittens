import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthSuccess() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token  = params.get('token')

    if (token) {
      login(token)
      navigate('/dashboard')
    } else {
      navigate('/')
    }
  }, [])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-border border-t-accent rounded-full mx-auto mb-4" />
        <p className="text-muted text-sm">Connecting your Gmail…</p>
      </div>
    </div>
  )
}