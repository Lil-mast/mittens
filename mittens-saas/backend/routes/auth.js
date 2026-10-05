import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import { createHash } from 'crypto'
import nodemailer from 'nodemailer'
import { google } from 'googleapis'
import { prisma } from '../lib/prisma.js'

const router = express.Router()
const sessionCookie = 'mittens-session'
const oauthStateCookie = 'google-oauth-state'
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
}
const sessionSecret = () => {
  if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is not configured')
  return process.env.SESSION_SECRET
}
const oauthClient = () => new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)
const gmailScopes = [
  'openid', 'email', 'profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/contacts.readonly',
]
const safeUser = ({ passwordHash, gmailToken, ...user }) => user
const issueSession = (res, user) => {
  const token = jwt.sign({ sub: user.id }, sessionSecret(), { expiresIn: '7d' })
  res.cookie(sessionCookie, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
}
const ensureTrial = async (userId) => {
  const startedAt = new Date()
  const endsAt = new Date(startedAt)
  endsAt.setDate(endsAt.getDate() + 7)
  await prisma.trial.upsert({
    where: { userId },
    create: { userId, startedAt, endsAt },
    update: {},
  })
}
const hashResetToken = token => createHash('sha256').update(token).digest('hex')
const clearSession = (res) => {
  res.clearCookie(sessionCookie, cookieOptions)
  res.clearCookie(oauthStateCookie, cookieOptions)
}

router.get('/google', (req, res) => {
  const state = randomBytes(32).toString('hex')
  res.cookie(oauthStateCookie, state, { ...cookieOptions, maxAge: 10 * 60 * 1000 })
  const url = oauthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: gmailScopes,
    state,
  })
  res.redirect(url)
})

router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query
    if (error || !code || !state || state !== req.cookies?.[oauthStateCookie]) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/signin?error=google_auth_failed`)
    }

    const client = oauthClient()
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)
    const { data: profile } = await google.oauth2({ version: 'v2', auth: client }).userinfo.get()
    if (!profile.id || !profile.email || !profile.verified_email) throw new Error('Google did not return a verified identity')

    let user = await prisma.user.findUnique({ where: { googleId: profile.id } })
    if (!user) {
      user = await prisma.user.findUnique({ where: { email: profile.email.toLowerCase() } })
      user = user
        ? await prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.id, avatar: profile.picture || user.avatar, gmailToken: tokens },
        })
        : await prisma.user.create({
          data: {
            email: profile.email.toLowerCase(),
            name: profile.name,
            avatar: profile.picture,
            googleId: profile.id,
            gmailToken: tokens,
          },
        })
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatar: profile.picture || user.avatar, gmailToken: tokens },
      })
    }

    await ensureTrial(user.id)
    issueSession(res, user)
    res.clearCookie(oauthStateCookie, cookieOptions)
    res.redirect(`${process.env.CLIENT_URL}/auth/success`)
  } catch (err) {
    console.error('Google auth callback failed:', err)
    res.redirect(`${process.env.CLIENT_URL}/auth/signin?error=google_auth_failed`)
  }
})

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.[sessionCookie] || req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token' })
    const payload = jwt.verify(token, sessionSecret())
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { trial: true },
    })
    if (!user) return res.status(401).json({ error: 'Invalid token' })
    res.json({ user: safeUser(user) })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body
    if (!email || !password || !name) return res.status(400).json({ error: 'Name, email and password required' })
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
    const normalizedEmail = email.trim().toLowerCase()
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email: normalizedEmail, name: name.trim(), passwordHash },
    })
    await ensureTrial(user.id)
    issueSession(res, user)
    res.status(201).json({ user: safeUser(user) })
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'An account with this email already exists' })
    console.error('Signup failed:', err)
    res.status(500).json({ error: 'Could not create account' })
  }
})

router.post('/signin', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
  if (!user?.passwordHash || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  issueSession(res, user)
  res.json({ user: safeUser(user) })
})

router.post('/forgot-password', async (req, res) => {
  const genericResponse = { message: 'If that email belongs to an account, a reset link will be sent.' }
  const email = req.body.email?.trim().toLowerCase()
  if (!email) return res.status(400).json({ error: 'Email is required' })
  if (!process.env.SMTP_URL) return res.status(503).json({ error: 'Password recovery email is not configured' })
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.json(genericResponse)

  const token = randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 60 * 60 * 1000)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: hashResetToken(token), passwordResetExpiry: expiry },
  })
  const transporter = nodemailer.createTransport(process.env.SMTP_URL)
  const link = `${process.env.CLIENT_URL}/reset-password?token=${encodeURIComponent(token)}`
  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'Mittens <no-reply@localhost>',
    to: user.email,
    subject: 'Reset your Mittens password',
    text: `Use this link within one hour to reset your password: ${link}`,
  })
  res.json(genericResponse)
})

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body
  if (!token || !password || password.length < 8) {
    return res.status(400).json({ error: 'A reset token and password of at least 8 characters are required' })
  }
  const user = await prisma.user.findUnique({ where: { passwordResetToken: hashResetToken(token) } })
  if (!user || !user.passwordResetExpiry || user.passwordResetExpiry <= new Date()) {
    return res.status(400).json({ error: 'This password reset link is invalid or expired' })
  }
  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null },
  })
  res.json({ success: true })
})

router.post('/signout', (req, res) => {
  clearSession(res)
  res.json({ success: true })
})

export default router
