import { supabaseAnon } from '../lib/supabase.js'

export const requireAuth = async (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies?.['sb-access-token'] || req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token provided' })

    const { data: { user }, error } = await supabaseAnon.auth.getUser(token)
    if (error || !user) return res.status(401).json({ error: 'Invalid token' })

    // Get user profile
    const { data: profile } = await supabaseAnon
      .from('User')
      .select('*, Trial(*), Subscription(*)')
      .eq('id', user.id)
      .single()

    req.user = profile || user
    req.user.id = user.id
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
