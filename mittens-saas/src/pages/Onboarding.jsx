import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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

const FREQUENCIES = [
  { value: '15min', label: 'Every 15 min', desc: 'For high-volume inboxes' },
  { value: '30min', label: 'Every 30 min', desc: 'Balanced — default' },
  { value: '1hr', label: 'Every hour', desc: 'Moderate traffic' },
  { value: '4hr', label: 'Every 4 hours', desc: 'Low traffic' },
  { value: 'daily', label: 'Once daily', desc: 'Digest only' },
]

const CATEGORIES = [
  { value: 'SECURITY', label: 'Security', color: 'border-red-500/30 text-red-400 bg-red-500/10' },
  { value: 'MEETING', label: 'Meetings', color: 'border-blue-500/30 text-blue-400 bg-blue-500/10' },
  { value: 'EVENT', label: 'Events', color: 'border-purple-500/30 text-purple-400 bg-purple-500/10' },
  { value: 'WORK', label: 'Work', color: 'border-green-500/30 text-green-400 bg-green-500/10' },
  { value: 'PERSONAL', label: 'Personal', color: 'border-accent/30 text-accent bg-accent-soft' },
  { value: 'SPAM', label: 'Spam', color: 'border-border text-muted bg-muted/10' },
]

const NOTIFICATIONS = [
  { value: 'ntfy', label: 'Push (ntfy)', desc: 'Get instant push alerts on your phone' },
  { value: 'email', label: 'Email digest', desc: 'Receive a daily summary via email' },
  { value: 'both', label: 'Both', desc: 'Push alerts + email digest' },
  { value: 'quiet', label: 'Quiet mode', desc: 'No notifications — check manually' },
]

const TONES = [
  { value: 'professional', label: 'Professional', desc: 'Formal, business-ready language' },
  { value: 'casual', label: 'Casual', desc: 'Friendly, conversational tone' },
  { value: 'concise', label: 'Concise', desc: 'Short and to the point' },
  { value: 'detailed', label: 'Detailed', desc: 'Thorough analysis with context' },
]

const STEPS = [
  { title: 'Triage speed', subtitle: 'How often should Mittens check your inbox?' },
  { title: 'Priority categories', subtitle: 'Which types of email matter most?' },
  { title: 'Notifications', subtitle: 'How should Mittens reach you?' },
  { title: 'AI personality', subtitle: 'What tone should the AI use?' },
  { title: 'You\'re all set', subtitle: 'Here\'s your Mittens configuration' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState({
    frequency: '30min',
    priorityCategories: ['SECURITY', 'MEETING'],
    notificationStyle: 'ntfy',
    aiTone: 'concise',
  })

  const toggleCategory = (cat) => {
    setPrefs(p => ({
      ...p,
      priorityCategories: p.priorityCategories.includes(cat)
        ? p.priorityCategories.filter(c => c !== cat)
        : [...p.priorityCategories, cat],
    }))
  }

  const canProceed = () => {
    if (step === 1) return prefs.priorityCategories.length > 0
    return true
  }

  const handleNext = () => {
    if (!canProceed()) return
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await api.put('/user/onboarding', { preferences: prefs })
      toast.success('Preferences saved — Mittens is ready')
      navigate('/dashboard?onboarded=true')
    } catch {
      toast.error('Could not save preferences')
    } finally {
      setSaving(false)
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted text-xs font-mono tracking-widest">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="text-muted text-xs">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-px bg-border rounded-full mb-10 overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step title */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <PawIcon size={18} className="text-accent" />
            <span className="eyebrow" style={{ fontSize: 11 }}>{STEPS[step].title}</span>
          </div>
          <p className="text-muted text-sm mb-8">{STEPS[step].subtitle}</p>
        </motion.div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <div className="space-y-3">
                {FREQUENCIES.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setPrefs(p => ({ ...p, frequency: f.value }))}
                    className={`w-full text-left card-glow rounded-xl p-4 bg-surface transition-all ${
                      prefs.frequency === f.value
                        ? 'border-accent/40 ring-1 ring-accent/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-text text-sm font-medium">{f.label}</div>
                        <div className="text-muted text-xs mt-0.5">{f.desc}</div>
                      </div>
                      {prefs.frequency === f.value && (
                        <span className="text-accent text-lg">◆</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <div>
                <p className="text-muted text-xs mb-4">Select all that apply — these will get priority attention.</p>
                <div className="flex flex-wrap gap-3">
                  {CATEGORIES.map(c => {
                    const active = prefs.priorityCategories.includes(c.value)
                    return (
                      <button
                        key={c.value}
                        onClick={() => toggleCategory(c.value)}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                          active ? c.color + ' ring-1' : 'border-border text-muted bg-transparent hover:border-border/80'
                        }`}
                      >
                        {c.label}
                      </button>
                    )
                  })}
                </div>
                {prefs.priorityCategories.length === 0 && (
                  <p className="text-red-400/70 text-xs mt-3">Pick at least one category</p>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                {NOTIFICATIONS.map(n => (
                  <button
                    key={n.value}
                    onClick={() => setPrefs(p => ({ ...p, notificationStyle: n.value }))}
                    className={`w-full text-left card-glow rounded-xl p-4 bg-surface transition-all ${
                      prefs.notificationStyle === n.value
                        ? 'border-accent/40 ring-1 ring-accent/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-text text-sm font-medium">{n.label}</div>
                        <div className="text-muted text-xs mt-0.5">{n.desc}</div>
                      </div>
                      {prefs.notificationStyle === n.value && (
                        <span className="text-accent text-lg">◆</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                {TONES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setPrefs(p => ({ ...p, aiTone: t.value }))}
                    className={`w-full text-left card-glow rounded-xl p-4 bg-surface transition-all ${
                      prefs.aiTone === t.value
                        ? 'border-accent/40 ring-1 ring-accent/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-text text-sm font-medium">{t.label}</div>
                        <div className="text-muted text-xs mt-0.5">{t.desc}</div>
                      </div>
                      {prefs.aiTone === t.value && (
                        <span className="text-accent text-lg">◆</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="card-glow rounded-2xl p-6 bg-surface space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <PawIcon size={24} className="text-accent" />
                  <span className="font-serif italic text-lg text-text">Your Mittens setup</span>
                </div>
                {[
                  { label: 'Triage frequency', value: FREQUENCIES.find(f => f.value === prefs.frequency)?.label },
                  { label: 'Priority categories', value: prefs.priorityCategories.join(', ') },
                  { label: 'Notification style', value: NOTIFICATIONS.find(n => n.value === prefs.notificationStyle)?.label },
                  { label: 'AI tone', value: TONES.find(t => t.value === prefs.aiTone)?.label },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <span className="text-muted text-sm">{item.label}</span>
                    <span className="text-text text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="btn-ghost text-sm"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="btn-primary text-sm disabled:opacity-40"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary text-sm"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin w-3 h-3 border-2 border-black border-t-transparent rounded-full" />
                  Saving…
                </span>
              ) : (
                'Start managing my inbox →'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
