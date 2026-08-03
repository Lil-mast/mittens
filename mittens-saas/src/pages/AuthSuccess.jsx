import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function AuthSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (error) {
        toast.error(errorDescription || 'Authentication failed')
        navigate('/')
        return
      }

      if (code) {
        try {
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
          if (sessionError) throw sessionError
          toast.success('Welcome to Mittens!')

          // Check if user needs onboarding
          const session = await supabase.auth.getSession()
          const token = session?.data?.session?.access_token
          if (token) {
            localStorage.setItem('mittens_token', token)
            try {
              const res = await api.get('/user/onboarding')
              if (!res.data.completed) {
                navigate('/onboarding')
                return
              }
            } catch {
              // If check fails, send to dashboard
            }
          }
          navigate('/dashboard')
        } catch (err) {
          toast.error('Failed to complete sign in')
          navigate('/')
        }
      } else {
        navigate('/')
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