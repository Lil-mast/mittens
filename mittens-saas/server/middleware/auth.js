import jwt from 'jsonwebtoken'
import { supabase } from '../lib/supabase.js'

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token provided' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const { data: user, error } = await supabase
      .from('User')
      .select('*, Trial(*), Subscription(*)')
      .eq('id', decoded.userId)
      .single()

    if (error || !user) return res.status(401).json({ error: 'User not found' })

    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
