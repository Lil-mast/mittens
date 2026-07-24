import express from 'express'
import { supabase, supabaseAnon } from '../lib/supabase.js'

const router = express.Router()

// Supabase handles Google OAuth directly
router.get('/google', (req, res) => {
  const { data, error } = supabaseAnon.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.CLIENT_URL}/auth/callback`,
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

  // Store session and redirect
  res.redirect(`${process.env.CLIENT_URL}/auth/success?session=${JSON.stringify(data.session)}`)
})

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization?.split(' ')[1]
    if (!authHeader) return res.status(401).json({ error: 'No token' })

    const { data: { user }, error } = await supabaseAnon.auth.getUser(authHeader)
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

  res.json({ user: data.user, session: data.session })
})

// Email/password sign in
router.post('/signin', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password })
  if (error) return res.status(400).json({ error: error.message })

  res.json({ user: data.user, session: data.session })
})

// Sign out
router.post('/signout', async (req, res) => {
  const authHeader = req.headers.authorization?.split(' ')[1]
  if (authHeader) await supabaseAnon.auth.signOut()

  res.json({ success: true })
})

export default router