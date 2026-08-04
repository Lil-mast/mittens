import express from 'express'
import { supabase, supabaseAnon } from '../lib/supabase.js'

const router = express.Router()

// Cookie options for httpOnly secure cookies
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days
  path: '/',
}

// Helper to set auth cookies
const setAuthCookies = (res, session) => {
  if (session?.access_token) {
    res.cookie('sb-access-token', session.access_token, cookieOptions)
  }
  if (session?.refresh_token) {
    res.cookie('sb-refresh-token', session.refresh_token, cookieOptions)
  }
}

// Helper to clear auth cookies
const clearAuthCookies = (res) => {
  res.clearCookie('sb-access-token', { ...cookieOptions, maxAge: 0 })
  res.clearCookie('sb-refresh-token', { ...cookieOptions, maxAge: 0 })
}

// Supabase handles Google OAuth directly
router.get('/google', (req, res) => {
  const { data, error } = supabaseAnon.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.SERVER_URL}/api/auth/callback`,
      scopes: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.labels https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    },
  })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json({ url: data.url })
})

// Auth callback - Supabase handles this
router.get('/callback', async (req, res) => {
  const { code } = req.query
  if (!code) return res.redirect(`${process.env.CLIENT_URL}/auth/error`)

  const { data, error } = await supabaseAnon.auth.exchangeCodeForSession(code)
  if (error) {
    console.error('Auth callback error:', error)
    return res.redirect(`${process.env.CLIENT_URL}/auth/error`)
  }

  // Set auth cookies and redirect
  setAuthCookies(res, data.session)
  res.redirect(`${process.env.CLIENT_URL}/auth/success`)
})

// Get current user
router.get('/me', async (req, res) => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies?.['sb-access-token'] || req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token' })

    const { data: { user }, error } = await supabaseAnon.auth.getUser(token)
    if (error || !user) return res.status(401).json({ error: 'Invalid token' })

    // Get user profile from database
    const { data: profile } = await supabase
      .from('User')
      .select('id, email, name, avatar, createdAt, Trial(*), Subscription(*)')
      .eq('id', user.id)
      .single()

    res.json({ user: profile || user })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

// Email/password sign up
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  const { data, error } = await supabaseAnon.auth.signUp({ email, password, options: { data: { name } } })
  if (error) return res.status(400).json({ error: error.message })

  // Create user profile
  if (data.user) {
    await supabase.from('User').upsert({
      id: data.user.id,
      email,
      name,
      createdAt: new Date().toISOString(),
    }, { onConflict: 'id' })
  }

  // Set auth cookies
  setAuthCookies(res, data.session)
  res.json({ user: data.user, session: data.session })
})

// Email/password sign in
router.post('/signin', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password })
  if (error) return res.status(400).json({ error: error.message })

  // Set auth cookies
  setAuthCookies(res, data.session)
  res.json({ user: data.user, session: data.session })
})

// Sign out
router.post('/signout', async (req, res) => {
  const token = req.cookies?.['sb-access-token'] || req.headers.authorization?.split(' ')[1]
  if (token) await supabaseAnon.auth.signOut()

  // Clear auth cookies
  clearAuthCookies(res)
  res.json({ success: true })
})

export default router