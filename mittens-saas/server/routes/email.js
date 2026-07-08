import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { checkPlan } from '../middleware/trial.js'
import { fetchEmails } from '../lib/gmail.js'
import { categorizeEmails } from '../lib/bedrock.js'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

// Get and categorize emails
router.get('/categorize', requireAuth, checkPlan, async (req, res) => {
  try {
    const { query = 'newer_than:1d is:unread', max = 20 } = req.query
    const tokens = req.user.gmailToken

    if (!tokens) {
      return res.status(400).json({
        error: 'Gmail not connected',
        message: 'Please connect your Gmail account first'
      })
    }

    // Fetch emails
    const emails = await fetchEmails(tokens, query, parseInt(max))
    if (!emails.length) {
      return res.json({ emails: [], categories: {}, message: 'No emails found' })
    }

    // Categorize with Bedrock
    const categorized = await categorizeEmails(emails, req.plan)

    // Merge results
    const result = emails.map((email, i) => ({
      ...email,
      ...categorized.find(c => c.index === i + 1) || {}
    }))

    // Log to DB
    await supabase.from('EmailLog').insert(
      result.map(e => ({
        userId: req.user.id,
        subject: e.subject,
        sender: e.from,
        category: e.category,
        familiarity: e.familiarity
      }))
    )

    // Group by category
    const grouped = result.reduce((acc, email) => {
      const cat = email.category || 'WORK'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(email)
      return acc
    }, {})

    res.json({
      total: result.length,
      plan: req.plan,
      model: req.model,
      emails: result,
      grouped
    })
  } catch (err) {
    console.error('Email error:', err)
    res.status(500).json({ error: 'Failed to process emails' })
  }
})

// Get email logs/history
router.get('/logs', requireAuth, async (req, res) => {
  try {
    const { data: logs } = await supabase
      .from('EmailLog')
      .select('*')
      .eq('userId', req.user.id)
      .order('processedAt', { ascending: false })
      .limit(50)

    res.json({ logs })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' })
  }
})

export default router