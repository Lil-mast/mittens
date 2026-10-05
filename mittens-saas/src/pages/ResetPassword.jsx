import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [reset, setReset] = useState(false)
  const token = searchParams.get('token')

  const submit = async (event) => {
    event.preventDefault()
    try {
      if (token) {
        await api.post('/auth/reset-password', { token, password })
        setReset(true)
        toast.success('Password updated. You can sign in now.')
      } else {
        await api.post('/auth/forgot-password', { email })
        setSent(true)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update password')
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="font-serif italic text-4xl text-white mb-3 text-center">
          {token ? 'Choose a new password' : 'Reset your password'}
        </h1>
        {sent || reset ? (
          <p className="text-muted text-center">
            {sent ? 'If that email belongs to an account, a reset link will be sent.' : 'Your password has been updated.'}
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-5 mt-8">
            {!token ? (
              <input className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            ) : (
              <input className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password (8+ characters)" minLength={8} required />
            )}
            <button className="w-full btn-primary py-3" type="submit">{token ? 'Update password' : 'Send reset link'}</button>
          </form>
        )}
        <p className="mt-6 text-center text-sm"><Link to="/auth/signin" className="text-accent hover:underline">Back to sign in</Link></p>
      </div>
    </div>
  )
}
