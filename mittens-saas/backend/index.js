import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth.js'
import emailRoutes from './routes/email.js'
import subscriptionRoutes from './routes/subscription.js'
import userRoutes from './routes/user.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(cookieParser())

// Rate limiter - more lenient in development
const isDev = process.env.NODE_ENV !== 'production'
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100,  // 1000 req/15min in dev, 100 in prod
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
// Serve React app in production

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const buildPath = join(__dirname, '../build')
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath))
  app.get('/{*any}', (req, res) => {
    res.sendFile(join(buildPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Mittens server running on port ${PORT}`)
})