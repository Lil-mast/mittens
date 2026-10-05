import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { checkPlan } from '../middleware/trial.js'
import { fetchEmails } from '../lib/gmail.js'
import { categorizeEmails, invokeModel } from '../lib/agentrouter.js'
import { prisma } from '../lib/prisma.js'

const router = express.Router()

// First-pass inbox review (used after onboarding)
router.get('/review', requireAuth, checkPlan, async (req, res) => {
  try {
    const tokens = req.user.gmailToken
    if (!tokens) {
      return res.json({
        needsConnection: true,
        message: 'Connect your Gmail to get an inbox review'
      })
    }

    const emails = await fetchEmails(tokens, 'newer_than:7d', 30)
    if (!emails.length) {
      return res.json({
        volume: 0,
        senders: [],
        urgent: [],
        suggestions: [],
        message: 'No recent emails found'
      })
    }

    const emailList = emails.map((e, i) =>
      `${i + 1}. From: ${e.from} | Subject: ${e.subject} | Snippet: ${(e.snippet || '').slice(0, 80)}`
    ).join('\n')

    const prompt = `You are Mittens, an AI email management agent doing a first inbox review.
Review these ${emails.length} recent emails and respond ONLY as JSON with:
- volume: total count
- uniqueSenders: number of unique senders
- topSenders: array of {name, count} for the top senders (max 5)
- urgent: array of {subject, from, reason} for SECURITY/urgent items
- suggestions: array of suggested triage rules (max 4 strings like "Auto-archive newsletters from Mailchimp")

Emails:
${emailList}

Respond ONLY as JSON, no markdown: {"volume":0,"uniqueSenders":0,"topSenders":[],"urgent":[],"suggestions":[]}`

    const raw = await invokeModel(prompt)
    let review
    try {
      const clean = raw.replace(/```json|```/g, '').trim()
      review = JSON.parse(clean)
    } catch {
      review = {
        volume: emails.length,
        uniqueSenders: new Set(emails.map(e => e.from)).size,
        topSenders: [],
        urgent: [],
        suggestions: ['Let Mittens categorize and monitor your inbox automatically']
      }
    }

    res.json(review)
  } catch (err) {
    console.error('Review error:', err)
    res.status(500).json({ error: 'Failed to review inbox' })
  }
})

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

    // Categorize through Agent Router
    const categorized = await categorizeEmails(emails)

    // Merge results
    const result = emails.map((email, i) => ({
      ...email,
      ...categorized.find(c => c.index === i + 1) || {}
    }))

    // Log to DB
    await prisma.emailLog.createMany({
      data: result.map(e => ({
        userId: req.user.id,
        subject: e.subject,
        sender: e.from,
        category: e.category,
        familiarity: e.familiarity,
      })),
    })

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
    const logs = await prisma.emailLog.findMany({
      where: { userId: req.user.id },
      orderBy: { processedAt: 'desc' },
      take: 50,
    })
    res.json({ logs })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' })
  }
})

export default router
