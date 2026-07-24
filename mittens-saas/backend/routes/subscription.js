import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  initializeTransaction,
  verifyTransaction,
  createCustomer,
  verifyWebhook
} from '../lib/paystack.js'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

const PRO_PLAN_AMOUNT = 999 // KES 999/month

// Initialize payment
router.post('/initialize', requireAuth, async (req, res) => {
  try {
    const user = req.user

    const customer = await createCustomer(user.email, user.name)

    const transaction = await initializeTransaction(
      user.email,
      PRO_PLAN_AMOUNT,
      {
        userId: user.id,
        plan: 'pro',
        paystackCustomerId: customer.customer_code
      }
    )

    res.json({
      authorizationUrl: transaction.authorization_url,
      reference: transaction.reference
    })
  } catch (err) {
    console.error('Payment init error:', err)
    res.status(500).json({ error: 'Failed to initialize payment' })
  }
})

// Verify payment
router.get('/verify/:reference', requireAuth, async (req, res) => {
  try {
    const { reference } = req.params
    const transaction = await verifyTransaction(reference)

    if (transaction.status !== 'success') {
      return res.status(400).json({ error: 'Payment not successful' })
    }

    const { userId, paystackCustomerId } = transaction.metadata

    // Create subscription record
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    await supabase.from('Subscription').upsert({
      userId,
      paystackCustomerId,
      plan: 'pro',
      model: 'amazon.nova-pro-v1:0',
      status: 'active',
      currentPeriodEnd: periodEnd.toISOString(),
      updatedAt: new Date().toISOString()
    }, { onConflict: 'userId' })

    res.json({ success: true, message: 'Upgraded to Mittens Pro!' })
  } catch (err) {
    console.error('Verify error:', err)
    res.status(500).json({ error: 'Verification failed' })
  }
})

// Paystack webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-paystack-signature']

  if (!verifyWebhook(signature, req.body)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const event = JSON.parse(req.body)

  if (event.event === 'subscription.disable') {
    const { customer } = event.data
    await supabase
      .from('Subscription')
      .update({ status: 'cancelled', updatedAt: new Date().toISOString() })
      .eq('paystackCustomerId', customer.customer_code)
  }

  res.json({ received: true })
})

export default router