import { prisma } from '../lib/prisma.js'

export const checkPlan = async (req, res, next) => {
  try {
    let trial = req.user.trial
    if (!trial) {
      const startedAt = new Date()
      const endsAt = new Date(startedAt)
      endsAt.setDate(endsAt.getDate() + 7)
      trial = await prisma.trial.create({
        data: { userId: req.user.id, startedAt, endsAt },
      })
      req.user.trial = trial
    }

    if (trial.isActive && trial.endsAt > new Date()) {
      req.plan = 'trial'
      return next()
    }

    if (trial.isActive) {
      await prisma.trial.update({ where: { id: trial.id }, data: { isActive: false } })
    }
    return res.status(402).json({
      error: 'Trial expired',
      message: 'Your 7-day free trial has ended.',
    })
  } catch (err) {
    next(err)
  }
}
