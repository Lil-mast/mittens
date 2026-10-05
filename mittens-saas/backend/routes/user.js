import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const router = express.Router()

router.get('/profile', requireAuth, async (req, res) => {
  const trial = req.user.trial
  const active = Boolean(trial?.isActive && trial.endsAt > new Date())
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar,
    },
    plan: {
      status: active ? 'trial' : 'expired',
      daysLeft: active ? Math.ceil((trial.endsAt - new Date()) / 86400000) : 0,
    },
  })
})

router.patch('/ntfy', requireAuth, async (req, res) => {
  await prisma.user.update({ where: { id: req.user.id }, data: { ntfyTopic: req.body.ntfyTopic } })
  res.json({ success: true })
})

router.put('/onboarding', requireAuth, async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { preferences: req.body.preferences, onboardingCompleted: true },
  })
  res.json({ success: true })
})

router.get('/onboarding', requireAuth, (req, res) => {
  res.json({ completed: req.user.onboardingCompleted, preferences: req.user.preferences || null })
})

export default router
