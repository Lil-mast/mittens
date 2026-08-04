import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function AuthSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleAuth = async () => {
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (error) {
        toast.error(errorDescription || 'Authentication failed')
        navigate('/')
        return
      }

      try {
        // Check if user needs onboarding via backend (cookies are set automatically)
        const res = await api.get('/user/onboarding')
        if (!res.data.completed) {
          navigate('/onboarding')
          return
        }
        toast.success('Welcome to Mittens!')
        navigate('/dashboard')
      } catch (err) {
        // If onboarding check fails, try to get user to see if logged in
        try {
          await api.get('/auth/me')
          navigate('/dashboard')
        } catch {
          toast.error('Failed to complete sign in')
          navigate('/')
        }
      }
    }

    handleAuth()
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-border border-t-accent rounded-full" />
    </div>
  )
}