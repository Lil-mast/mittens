import { supabase } from '../lib/supabase.js'

export const checkPlan = async (req, res, next) => {
  const user = req.user

  const trial = user.Trial
  const subscription = user.Subscription

  // Active paid subscription
  if (subscription && subscription.status === 'active') {
    req.plan = 'pro'
    req.model = 'amazon.nova-pro-v1:0'
    return next()
  }

  // Active trial
  if (trial && trial.isActive && new Date(trial.endsAt) > new Date()) {
    req.plan = 'trial'
    req.model = 'amazon.nova-micro-v1:0'
    return next()
  }

  // Trial expired
  if (trial && new Date(trial.endsAt) < new Date()) {
    // Mark trial as inactive
    await supabase
      .from('Trial')
      .update({ isActive: false })
      .eq('userId', user.id)

    return res.status(402).json({
      error: 'Trial expired',
      message: 'Your 7-day free trial has ended. Upgrade to Mittens Pro to continue.',
      upgradeUrl: `${process.env.CLIENT_URL}/pricing`
    })
  }

  // No trial started yet — start it
  const endsAt = new Date()
  endsAt.setDate(endsAt.getDate() + 7)

  await supabase.from('Trial').insert({
    userId: user.id,
    endsAt: endsAt.toISOString(),
    isActive: true,
    model: 'amazon.nova-micro-v1:0'
  })

  req.plan = 'trial'
  req.model = 'amazon.nova-micro-v1:0'
  next()
}