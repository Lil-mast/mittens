import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import toast from 'react-hot-toast'

const PawIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <ellipse cx="6" cy="6" rx="2" ry="2.5"/>
    <ellipse cx="11" cy="4" rx="1.8" ry="2.3"/>
    <ellipse cx="16" cy="5" rx="2" ry="2.5"/>
    <ellipse cx="19" cy="10" rx="1.8" ry="2.3"/>
    <path d="M12 9c-4 0-7 2.5-7 6 0 2.5 2 4.5 4.5 4.5 1 0 1.8-.3 2.5-.3s1.5.3 2.5.3C17 19.5 19 17.5 19 15c0-3.5-3-6-7-6z"/>
  </svg>
)

const CATEGORY_COLORS = {
  MEETING:  { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20' },
  EVENT:    { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  SECURITY: { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20' },
  WORK:     { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/20' },
  PERSONAL: { bg: 'bg-accent-soft',   text: 'text-accent',     border: 'border-accent/20' },
  SPAM:     { bg: 'bg-muted/10',      text: 'text-muted',      border: 'border-border' },
}

const CategoryBadge = ({ category }) => {
  const c = CATEGORY_COLORS[category] || CATEGORY_COLORS.WORK
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${c.bg} ${c.text} ${c.border}`}>
      {category}
    </span>
  )
}

const StatCard = ({ label, value, sub }) => (
  <div className="card-glow rounded-xl p-5 bg-surface">
    <div className="text-muted text-xs mb-2">{label}</div>
    <div className="text-3xl font-serif italic text-text">{value}</div>
    {sub && <div className="text-muted text-xs mt-1">{sub}</div>}
  </div>
)

export default function Dashboard() {
  const { user, plan, logout } = useAuth()
  const [emails, setEmails]     = useState([])
  const [grouped, setGrouped]   = useState({})
  const [loading, setLoading]   = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [ntfyTopic, setNtfyTopic] = useState('')
  const [savingNtfy, setSavingNtfy] = useState(false)

  const daysLeft = plan?.daysLeft || 0
  const isTrialExpired = plan?.status === 'expired'
  const isPro = plan?.status === 'pro'

  const fetchEmails = async () => {
    setLoading(true)
    try {
      const res = await api.get('/email/categorize?max=30')
      setEmails(res.data.emails || [])
      setGrouped(res.data.grouped || {})
      toast.success(`Fetched ${res.data.total} emails`)
    } catch (err) {
      if (err.response?.status === 402) {
        toast.error('Trial expired — upgrade to continue')
      } else {
        toast.error('Failed to fetch emails')
      }
    } finally {
      setLoading(false)
    }
  }

  const saveNtfy = async () => {
    setSavingNtfy(true)
    try {
      await api.patch('/user/ntfy', { ntfyTopic })
      toast.success('ntfy topic saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSavingNtfy(false)
    }
  }

  const handleUpgrade = async () => {
    try {
      const res = await api.post('/subscription/initialize')
      window.location.href = res.data.authorizationUrl
    } catch {
      toast.error('Could not start payment')
    }
  }

  const displayEmails = activeTab === 'all' ? emails : (grouped[activeTab] || [])

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PawIcon size={20} className="text-accent" />
            <span className="font-serif italic text-text">Mittens</span>
            <span className="text-border">·</span>
            <span className="text-muted text-sm">{user?.email}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Plan badge */}
            {isPro && (
              <span className="text-xs bg-accent text-black px-2.5 py-1 rounded-full font-semibold">Pro</span>
            )}
            {plan?.status === 'trial' && (
              <span className="text-xs text-accent bg-accent-soft border border-accent/20 px-2.5 py-1 rounded-full">
                Trial · {daysLeft}d left
              </span>
            )}
            {isTrialExpired && (
              <button onClick={handleUpgrade} className="btn-primary text-xs px-4 py-2">
                Upgrade — $4/mo
              </button>
            )}
            <button onClick={logout} className="text-muted text-sm hover:text-text transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Trial expired banner */}
        {isTrialExpired && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-accent/30 bg-accent-soft p-6 flex items-center justify-between"
          >
            <div>
              <div className="text-text font-medium mb-1">Your free trial has ended</div>
              <div className="text-muted text-sm">Upgrade to Mittens Pro for $4/month to continue.</div>
            </div>
            <button onClick={handleUpgrade} className="btn-primary">
              Upgrade now →
            </button>
          </motion.div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total emails" value={emails.length || '—'} />
          <StatCard label="Security alerts" value={grouped['SECURITY']?.length || 0} sub={grouped['SECURITY']?.length ? 'Needs attention' : 'All clear'} />
          <StatCard label="Meetings" value={grouped['MEETING']?.length || 0} />
          <StatCard label="Spam caught" value={grouped['SPAM']?.length || 0} />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Email panel */}
          <div className="md:col-span-2">
            {/* Tab bar + fetch */}
            <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-1">
              {['all', 'MEETING', 'EVENT', 'SECURITY', 'WORK', 'PERSONAL', 'SPAM'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs whitespace-nowrap px-3 py-1.5 rounded-full border transition-all ${
                    activeTab === tab
                      ? 'border-accent/40 text-accent bg-accent-soft'
                      : 'border-border text-muted hover:text-text hover:border-border/80'
                  }`}
                >
                  {tab === 'all' ? 'All emails' : tab}
                  {tab !== 'all' && grouped[tab]?.length
                    ? ` (${grouped[tab].length})`
                    : ''}
                </button>
              ))}

              <button
                onClick={fetchEmails}
                disabled={loading || isTrialExpired}
                className="ml-auto btn-primary text-xs px-4 py-2 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Fetching…' : '⟳ Fetch now'}
              </button>
            </div>

            {/* Email list */}
            <div className="space-y-2">
              {displayEmails.length === 0 && !loading && (
                <div className="text-center py-20 text-muted">
                  <PawIcon size={40} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No emails yet — hit "Fetch now" to start</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-20 text-muted">
                  <div className="animate-spin w-8 h-8 border-2 border-border border-t-accent rounded-full mx-auto mb-4" />
                  <p className="text-sm">Mittens is reading your inbox…</p>
                </div>
              )}

              <AnimatePresence>
                {displayEmails.map((email, i) => (
                  <motion.div
                    key={email.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="card-glow rounded-xl p-4 bg-surface flex items-start gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <CategoryBadge category={email.category} />
                        {email.familiarity === 'UNKNOWN' && (
                          <span className="text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                            Unknown sender
                          </span>
                        )}
                      </div>
                      <div className="text-text text-sm font-medium truncate">{email.subject || '(no subject)'}</div>
                      <div className="text-muted text-xs mt-0.5 truncate">{email.from}</div>
                      {email.snippet && (
                        <p className="text-muted text-xs mt-1.5 line-clamp-2 leading-relaxed">{email.snippet}</p>
                      )}
                    </div>
                    <div className="text-muted text-xs whitespace-nowrap shrink-0 mt-1">
                      {email.date ? new Date(email.date).toLocaleDateString() : ''}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* ntfy setup */}
            <div className="card-glow rounded-2xl p-6 bg-surface">
              <div className="text-text font-medium mb-1 text-sm">ntfy.sh notifications</div>
              <p className="text-muted text-xs mb-4 leading-relaxed">
                Get push alerts when Mittens finds security emails or runs a digest.
              </p>
              <input
                type="text"
                value={ntfyTopic}
                onChange={e => setNtfyTopic(e.target.value)}
                placeholder="your-topic-name"
                className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-muted focus:outline-none focus:border-accent/50 mb-3"
              />
              <button
                onClick={saveNtfy}
                disabled={savingNtfy || !ntfyTopic}
                className="btn-primary text-xs w-full justify-center py-2.5 disabled:opacity-40"
              >
                {savingNtfy ? 'Saving…' : 'Save topic'}
              </button>
              <p className="text-muted text-xs mt-3">
                Install ntfy app → subscribe to your topic → done.
              </p>
            </div>

            {/* Model info */}
            <div className="card-glow rounded-2xl p-6 bg-surface">
              <div className="text-text font-medium mb-4 text-sm">Active model</div>
              <div className="text-accent font-mono text-xs bg-accent-soft border border-accent/20 px-3 py-2 rounded-lg">
                {plan?.model || 'amazon.nova-micro-v1:0'}
              </div>
              {!isPro && (
                <div className="mt-4 text-muted text-xs leading-relaxed">
                  Trial uses Nova Micro.{' '}
                  <button onClick={handleUpgrade} className="text-accent hover:underline">
                    Upgrade to Nova Pro →
                  </button>
                </div>
              )}
            </div>

            {/* Category breakdown */}
            {emails.length > 0 && (
              <div className="card-glow rounded-2xl p-6 bg-surface">
                <div className="text-text font-medium mb-4 text-sm">Breakdown</div>
                <div className="space-y-3">
                  {Object.entries(grouped).map(([cat, items]) => (
                    <div key={cat} className="flex items-center justify-between">
                      <CategoryBadge category={cat} />
                      <span className="text-muted text-xs">{items.length}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}