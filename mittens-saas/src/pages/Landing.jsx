import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollReveal, useTypewriter, useCounter } from '../hooks/useanimations'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import toast from 'react-hot-toast'

// ── SVG Assets ──────────────────────────────────────────────────
const PawIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <ellipse cx="6"  cy="6"  rx="2"   ry="2.5" />
    <ellipse cx="11" cy="4"  rx="1.8" ry="2.3" />
    <ellipse cx="16" cy="5"  rx="2"   ry="2.5" />
    <ellipse cx="19" cy="10" rx="1.8" ry="2.3" />
    <path d="M12 9c-4 0-7 2.5-7 6 0 2.5 2 4.5 4.5 4.5 1 0 1.8-.3 2.5-.3s1.5.3 2.5.3C17 19.5 19 17.5 19 15c0-3.5-3-6-7-6z"/>
  </svg>
)

const CatEyeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <ellipse cx="16" cy="16" rx="14" ry="14" stroke="#DC143C" strokeWidth="1.5"/>
    <ellipse cx="16" cy="16" rx="4" ry="10" fill="#DC143C" className="animate-blink"/>
    <circle cx="14" cy="13" r="1.5" fill="rgba(255,255,255,0.6)"/>
  </svg>
)

const MailIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const BotIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <rect x="2" y="3" width="20" height="18" rx="2" ry="2"/>
    <circle cx="9" cy="9" r="1"/>
    <circle cx="15" cy="9" r="1"/>
    <path d="M5 18h14M7 15v-3M17 15v-3"/>
  </svg>
)

const PhoneIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

// ── Navbar ──────────────────────────────────────────────────────
const Navbar = ({ onConnect, onSignUp }) => {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/80 backdrop-blur-md border-b border-border' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <CatEyeIcon />
          <span className="font-serif italic text-xl text-text tracking-tight">Mittens</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How it works', 'Free trial'].map(link => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s/g, '-')}`}
              className="text-muted text-sm hover:text-text transition-colors duration-200"
            >
              {link}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <button onClick={onSignUp} className="btn-ghost text-sm">
            Sign Up
          </button>
          <button onClick={onConnect} className="btn-primary text-sm">
            Start free — 7 days
          </button>
        </div>
      </div>
    </motion.nav>
  )
}

// ── Hero ────────────────────────────────────────────────────────
const Hero = ({ onConnect }) => {
  useTypewriter('typewriter-text', [
    'Reads your Gmail.',
    'Spots your meetings.',
    'Kills your spam.',
    'Flags security alerts.',
    'Sends you reports.',
    'Handles it all.',
  ], 65, 1600)

  useCounter('stat-emails', 20)
  useCounter('stat-categories', 6)
  useCounter('stat-minutes', 30)

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16">
      {/* Spotlight */}
      <div className="hero-spotlight" style={{ top: '20%', left: '60%' }} />
      <div className="hero-spotlight" style={{ top: '60%', left: '10%', animationDelay: '4s', opacity: 0.5 }} />

      {/* Paw watermarks */}
      <PawIcon size={320} className="paw-watermark text-accent" style={{ top: '-60px', right: '-60px' }} />
      <PawIcon size={200} className="paw-watermark text-accent" style={{ bottom: '80px', left: '-40px' }} />

      <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="eyebrow mb-8"
        >
          AI Email Agent
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-5xl md:text-7xl lg:text-8xl font-serif italic text-text leading-[1.08] tracking-tight mb-6 max-w-4xl"
        >
          Your inbox,<br />
          <span className="text-accent">handled.</span><br />
          While you sleep.
        </motion.h1>

        {/* Typewriter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex items-center gap-2 mb-12 text-muted text-lg md:text-xl"
        >
          <span id="typewriter-text" className="text-text font-light" />
          <span className="typewriter-cursor" />
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-wrap gap-4 mb-20"
        >
          <button onClick={onConnect} className="btn-primary text-base px-8 py-4">
            <PawIcon size={16} />
            Connect Gmail — Free
          </button>
          <a href="#how-it-works" className="btn-ghost text-base px-8 py-4">
            See how it works →
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-wrap gap-12 border-t border-border pt-10"
        >
          {[
            { id: 'stat-emails',     suffix: '+',  label: 'Emails per batch' },
            { id: 'stat-categories', suffix: '',   label: 'Smart categories' },
            { id: 'stat-minutes',    suffix: 'min',label: 'Auto-run interval' },
          ].map(stat => (
            <div key={stat.id}>
              <div className="text-3xl font-serif italic text-text">
                <span id={stat.id}>0</span>
                <span className="text-accent">{stat.suffix}</span>
              </div>
              <div className="text-muted text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ── Marquee ─────────────────────────────────────────────────────
const Marquee = () => {
  const items = ['Gmail', 'Agent Router', 'MCP Protocol', 'ntfy.sh', 'OpenClaw', 'MariaDB', 'Google OAuth']
  const doubled = [...items, ...items]

  return (
    <div className="py-5 border-y border-border overflow-hidden bg-surface">
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-3 px-8 text-muted text-sm whitespace-nowrap">
            <PawIcon size={10} className="text-accent opacity-60" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── How It Works ─────────────────────────────────────────────────
const HowItWorks = () => {
  const steps = [
    {
      n: '01',
      title: 'Connect Gmail',
      body: 'One-click Google OAuth. Mittens gets read access to your inbox — nothing is stored without your permission.',
      icon: <MailIcon size={32} />,
    },
    {
      n: '02',
      title: 'Agent takes over',
      body: 'Mittens fetches your unread emails, sends them through Agent Router, and categorizes each one.',
      icon: <BotIcon size={32} />,
    },
    {
      n: '03',
      title: 'You get a report',
      body: 'A clean digest lands on your phone via ntfy.sh — meetings, security alerts, spam count — no noise, just signal.',
      icon: <PhoneIcon size={32} />,
    },
  ]

  return (
    <section id="how-it-works" className="py-32 max-w-6xl mx-auto px-6">
      <div className="eyebrow mb-6 reveal">How it works</div>
      <h2 className="text-4xl md:text-5xl font-serif italic text-text mb-20 reveal reveal-delay-1">
        Three steps.<br />Zero inbox anxiety.
      </h2>

      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <motion.div
            key={step.n}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className={`card-glow rounded-2xl p-8 bg-surface reveal reveal-delay-${i + 1}`}
          >
            <div className="text-4xl mb-6">{step.icon}</div>
            <div className="text-muted text-xs font-mono mb-3 tracking-widest">{step.n}</div>
            <h3 className="text-text text-xl font-medium mb-3">{step.title}</h3>
            <p className="text-muted text-sm leading-relaxed">{step.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ── Features ─────────────────────────────────────────────────────
const Features = () => {
  const features = [
    {
      title: 'Gmail integration',
      body: 'Full read/modify access via Google OAuth. Mittens searches your inbox with custom queries, reads metadata, and works on your actual emails — not a simulation.',
      tag: 'Core',
    },
    {
      title: 'MCP agentic functions',
      body: 'Built on the Model Context Protocol. Mittens can call tools, chain actions, and make decisions autonomously — archive, label, escalate, or ignore based on category rules.',
      tag: 'Agentic',
    },
    {
      title: 'Smart categorization',
      body: 'Six categories: MEETING, EVENT, SECURITY, WORK, PERSONAL, SPAM. Each email gets a category and a familiarity tag (KNOWN vs UNKNOWN sender) powered by Agent Router.',
      tag: 'AI',
    },
    {
      title: 'Inbox reports',
      body: 'Daily and on-demand digests delivered to your phone via ntfy.sh. See what hit your inbox, what Mittens handled, and what needs your eyes — in one clean notification.',
      tag: 'Reports',
    },
    {
      title: 'Security alerting',
      body: "Login alerts, password resets, suspicious sender flags — Mittens surfaces these immediately as high-priority notifications. Your inbox's immune system.",
      tag: 'Security',
    },
    {
      title: 'Flexible model routing',
      body: 'Use your Agent Router endpoint for inbox review and email categorization throughout the seven-day trial.',
      tag: 'Agent Router',
    },
  ]

  return (
    <section id="features" className="py-32 bg-surface">
      <div className="max-w-6xl mx-auto px-6">
        <div className="eyebrow mb-6 reveal">Features</div>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
          <h2 className="text-4xl md:text-5xl font-serif italic text-text reveal reveal-delay-1">
            Not just a filter.<br />An actual agent.
          </h2>
          <p className="text-muted text-sm max-w-xs reveal reveal-delay-2">
            Mittens acts on your behalf — reads, categorizes, escalates, and reports. Continuously.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className={`card-glow rounded-2xl p-7 bg-black reveal reveal-delay-${(i % 4) + 1}`}
            >
              <div className="flex items-start justify-between mb-5">
                <PawIcon size={20} className="text-accent mt-0.5" />
                <span className="text-xs text-accent bg-accent-soft px-2.5 py-1 rounded-full font-medium">
                  {f.tag}
                </span>
              </div>
              <h3 className="text-text font-medium mb-3 text-lg">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Pricing ──────────────────────────────────────────────────────
const Pricing = ({ onConnect }) => {
  return (
    <section id="free-trial" className="py-32 max-w-6xl mx-auto px-6">
      <div className="eyebrow mb-6 reveal">Free trial</div>
      <h2 className="text-4xl md:text-5xl font-serif italic text-text mb-6 reveal reveal-delay-1">
        Your inbox, handled.<br />Try it free for seven days.
      </h2>
      <p className="text-muted mb-20 reveal reveal-delay-2">
        No payment method required. Create an account to get started.
      </p>

      <div className="max-w-xl mx-auto">
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="card-glow rounded-2xl p-8 bg-surface reveal"
        >
          <div className="text-muted text-xs uppercase tracking-widest mb-4 font-mono">Free trial</div>
          <div className="text-4xl font-serif italic text-text mb-2">7 days</div>
          <div className="text-muted text-sm mb-8">Agent Router · No card needed</div>

          <div className="section-divider mb-8" />

          <ul className="space-y-3 mb-10">
            {['Gmail integration', 'Email categorization', 'ntfy.sh reports', 'Security alerts'].map(item => (
              <li key={item} className="flex items-center gap-3 text-sm text-muted">
                <span className="text-accent text-xs">◆</span>
                {item}
              </li>
            ))}
          </ul>

          <button onClick={onConnect} className="btn-ghost w-full justify-center">
            Start free trial
          </button>
        </motion.div>

      </div>
    </section>
  )
}

// ── CTA Banner ───────────────────────────────────────────────────
const CtaBanner = ({ onConnect }) => (
  <section className="py-32 max-w-6xl mx-auto px-6 text-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="price-card rounded-3xl py-20 px-8"
    >
      <PawIcon size={48} className="text-accent mx-auto mb-8 opacity-40" />
      <h2 className="text-4xl md:text-6xl font-serif italic text-text mb-6">
        Your inbox won't<br />manage itself.
      </h2>
      <p className="text-muted mb-10 max-w-md mx-auto">
        Let Mittens handle it. Start with seven days of access. No payment required.
      </p>
      <button onClick={onConnect} className="btn-primary text-base px-10 py-4">
        <PawIcon size={16} />
        Connect Gmail — Start free
      </button>
    </motion.div>
  </section>
)

// ── Footer ───────────────────────────────────────────────────────
const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-3">
        <CatEyeIcon />
        <span className="font-serif italic text-text">Mittens</span>
      </div>

      <div className="flex gap-8 text-muted text-sm">
        {['Privacy', 'Terms', 'Docs', 'GitHub'].map(link => (
          <a key={link} href="#" className="hover:text-text transition-colors">
            {link}
          </a>
        ))}
      </div>

      <div className="text-muted text-xs text-center">
        Built by{' '}
        <a href="https://github.com/salamander-tech-hub" className="text-accent hover:underline">
          Salamander Tech Hub
        </a>
        {' '}· 2026
      </div>
    </div>
  </footer>
)

// ── Landing Page ─────────────────────────────────────────────────
export default function Landing() {
  useScrollReveal()
  const navigate = useNavigate()

  const handleConnect = async () => {
    try {
      window.location.href = `${api.defaults.baseURL}/auth/google`
    } catch {
      toast.error('Could not connect to Google. Try again.')
    }
  }

  const handleSignUp = () => navigate('/auth/signup')

  return (
    <>
      <Navbar onConnect={handleConnect} onSignUp={handleSignUp} />
      <Hero onConnect={handleConnect} />
      <Marquee />
      <HowItWorks />
      <Features />
      <Pricing onConnect={handleConnect} />
      <CtaBanner onConnect={handleConnect} />
      <Footer />
    </>
  )
}
