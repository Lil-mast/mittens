import express from 'express'
import jwt from 'jsonwebtoken'
import { getAuthUrl, getTokens } from '../lib/gmail.js'
import { supabase } from '../lib/supabase.js'
import { google } from 'googleapis'

const router = express.Router()

// Get Google OAuth URL
router.get('/google', (req, res) => {
  const url = getAuthUrl()
  res.json({ url })
})

// Google OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query
    if (!code) return res.status(400).json({ error: 'No code provided' })

    const tokens = await getTokens(code)

    // Get user info from Google
    const oauth2 = google.oauth2('v2')
    const { oauth2Client } = tokens
    const { data: googleUser } = await oauth2.userinfo.get({ auth: { credentials: tokens } })

    // Upsert user in Supabase
    const { data: user, error } = await supabase
      .from('User')
      .upsert({
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
        googleId: googleUser.id,
        gmailToken: tokens,
        updatedAt: new Date().toISOString()
      }, { onConflict: 'email' })
      .select()
      .single()

    if (error) throw error

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${jwtToken}`)
  } catch (err) {
    console.error('Auth error:', err)
    res.redirect(`${process.env.CLIENT_URL}/auth/error`)
  }
})

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const { data: user } = await supabase
      .from('User')
      .select('id, email, name, avatar, createdAt, Trial(*), Subscription(*)')
      .eq('id', decoded.userId)
      .single()

    res.json({ user })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router