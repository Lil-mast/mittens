import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.['mittens-session'] || req.headers.authorization?.split(' ')[1]
    if (!token || !process.env.SESSION_SECRET) return res.status(401).json({ error: 'Authentication required' })
    const payload = jwt.verify(token, process.env.SESSION_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { trial: true },
    })
    if (!user) return res.status(401).json({ error: 'Invalid session' })
    req.user = user
    next()
  } catch {
    res.status(401).json({ error: 'Invalid session' })
  }
}
