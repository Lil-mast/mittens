import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

// Get user profile + plan status
router.get('/profile', requireAuth, async (req, res) => {
  const user = req.user
  const trial = user.Trial
  const subscription = user.Subscription

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

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar
    },
    plan: {
      status: planStatus,
      daysLeft,
      model
    }
  })
})

// Update ntfy topic
router.patch('/ntfy', requireAuth, async (req, res) => {
  const { ntfyTopic } = req.body
  await supabase
    .from('User')
    .update({ ntfyTopic, updatedAt: new Date().toISOString() })
    .eq('id', req.user.id)

  res.json({ success: true })
})

export default router