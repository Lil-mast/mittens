import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth.js'
import emailRoutes from './routes/email.js'
import subscriptionRoutes from './routes/subscription.js'
import userRoutes from './routes/user.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, slow down.'
})
app.use(limiter)

app.use('/api/auth', authRoutes)
app.use('/api/email', emailRoutes)
app.use('/api/subscription', subscriptionRoutes)
app.use('/api/user', userRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', agent: 'Mittens', version: '1.0.0' })
})

app.listen(PORT, () => {
  console.log(`Mittens server running on port ${PORT}`)
})