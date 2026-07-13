import { useEffect, useRef, useState } from 'react'
import logo from './assets/logo.png'
import './index.css'

const MittensLogo = ({ size = 36, showText = true }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <img src={logo} alt="Mittens AGI" style={{ width: size, height: size, objectFit: 'contain', filter: 'brightness(1.1) drop-shadow(0 0 8px rgba(255,138,61,0.3))' }} />
    {showText && (
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: size * 0.44, color: '#F0EBE0', letterSpacing: '0.06em' }}>MITTENS</div>
        <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: size * 0.28, color: '#FF8A3D', letterSpacing: '0.18em' }}>AGI</div>
      </div>
    )}
  </div>
)

function Cursor() {
  useEffect(() => {
    const dot = document.querySelector('.c-dot')
    const ring = document.querySelector('.c-ring')
    if (!dot || !ring) return
    let mx = 0, my = 0, rx = 0, ry = 0, raf
    const move = e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx-5}px,${my-5}px)` }
    const tick = () => { rx += (mx-rx)*0.13; ry += (my-ry)*0.13; ring.style.transform = `translate(${rx-18}px,${ry-18}px)`; raf = requestAnimationFrame(tick) }
    const over = () => ring.classList.add('big')
    const out = () => ring.classList.remove('big')
    document.addEventListener('mousemove', move)
    raf = requestAnimationFrame(tick)
    document.querySelectorAll('a,button,[data-hover]').forEach(el => { el.addEventListener('mouseenter', over); el.addEventListener('mouseleave', out) })
    return () => { document.removeEventListener('mousemove', move); cancelAnimationFrame(raf) }
  }, [])
  return <><div className="c-dot"/><div className="c-ring"/></>
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    const io = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }) }, { threshold: 0.1 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

function useTypewriter(ref, words) {
  useEffect(() => {
    if (!ref.current) return
    let wi = 0, ci = 0, del = false, t
    const tick = () => {
      const w = words[wi]
      if (del) { ref.current.textContent = w.slice(0,--ci); if (ci===0) { del=false; wi=(wi+1)%words.length; t=setTimeout(tick,400); return }; t=setTimeout(tick,38) }
      else { ref.current.textContent = w.slice(0,++ci); if (ci===w.length) { del=true; t=setTimeout(tick,1800); return }; t=setTimeout(tick,68) }
    }
    t = setTimeout(tick, 800)
    return () => clearTimeout(t)
  }, [])
}

const headingStyle = (delay='0s') => ({ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:'clamp(36px,5vw,60px)', color:'#F0EBE0', lineHeight:1.1, opacity:0, transition:`opacity 0.7s ${delay}, transform 0.7s ${delay}`, transform:'translateY(16px)', marginBottom:0 })

function Eyebrow({ children }) {
  return (
    <div data-reveal style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:20, opacity:0, transition:'opacity 0.6s, transform 0.6s', transform:'translateY(12px)' }}>
      <div style={{ width:20, height:1, background:'#FF8A3D' }}/>
      <span style={{ color:'#FF8A3D', fontSize:11, fontWeight:500, letterSpacing:'0.14em', textTransform:'uppercase' }}>{children}</span>
    </div>
  )
}

function Card({ children, delay=0, bg='#0F0F18' }) {
  return (
    <div data-reveal data-hover style={{ background:bg, border:'1px solid #1E1E2E', borderRadius:20, padding:32, cursor:'none', transition:`border-color 0.3s, transform 0.2s, box-shadow 0.3s, opacity 0.6s ${delay}s`, opacity:0, transform:'translateY(20px)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,138,61,0.35)'; e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 0 32px rgba(255,138,61,0.07)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='#1E1E2E'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}
    >{children}</div>
  )
}

function Navbar({ onCTA }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => { const fn = () => setScrolled(window.scrollY>48); window.addEventListener('scroll',fn); return ()=>window.removeEventListener('scroll',fn) }, [])
  return (
    <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:50, transition:'background 0.3s, border-color 0.3s', background:scrolled?'rgba(8,8,13,0.88)':'transparent', backdropFilter:scrolled?'blur(14px)':'none', borderBottom:scrolled?'1px solid #1E1E2E':'1px solid transparent' }}>
      <div style={{ maxWidth:1120, margin:'0 auto', padding:'0 24px', height:62, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <MittensLogo size={34} showText={true}/>
        <div style={{ display:'flex', alignItems:'center', gap:32 }}>
          {['Features','How it works','Pricing'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`} style={{ color:'#6E6C7E', fontSize:14, textDecoration:'none', transition:'color 0.2s' }} onMouseEnter={e=>e.target.style.color='#F0EBE0'} onMouseLeave={e=>e.target.style.color='#6E6C7E'}>{l}</a>
          ))}
          <button onClick={onCTA} data-hover style={{ background:'#FF8A3D', color:'#08080D', fontWeight:700, fontSize:13, padding:'9px 22px', borderRadius:8, border:'none', cursor:'none', transition:'background 0.2s, transform 0.15s' }} onMouseEnter={e=>{e.target.style.background='#ff9d5c';e.target.style.transform='translateY(-1px)'}} onMouseLeave={e=>{e.target.style.background='#FF8A3D';e.target.style.transform='translateY(0)'}}>
            Start free — 7 days
          </button>
        </div>
      </div>
    </nav>
  )
}

function Hero({ onCTA }) {
  const twRef = useRef()
  useTypewriter(twRef, ['Reads your Gmail.','Spots your meetings.','Kills your spam.','Flags security alerts.','Sends reports.','Never sleeps.'])
  return (
    <section style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', overflow:'hidden', paddingTop:62 }}>
      <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,138,61,0.07) 0%, transparent 65%)', top:'5%', right:'-10%', animation:'drift 9s ease-in-out infinite', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,138,61,0.04) 0%, transparent 65%)', bottom:'10%', left:'-5%', animation:'drift 12s ease-in-out infinite reverse', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,138,61,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,138,61,0.025) 1px,transparent 1px)', backgroundSize:'60px 60px', pointerEvents:'none' }}/>
      {/* Big watermark logo */}
      <div style={{ position:'absolute', top:-40, right:-60, opacity:0.04, pointerEvents:'none' }}>
        <img src={logo} alt="" style={{ width:340, height:340, objectFit:'contain', filter:'brightness(2)' }}/>
      </div>
      <div style={{ maxWidth:1120, margin:'0 auto', padding:'80px 24px 100px', width:'100%' }}>
        {/* Announcement bar */}
        <div data-reveal style={{ display:'inline-flex', alignItems:'center', gap:10, background:'rgba(255,138,61,0.07)', border:'1px solid rgba(255,138,61,0.18)', borderRadius:100, padding:'6px 16px', marginBottom:52, opacity:0, transition:'opacity 0.6s, transform 0.6s', transform:'translateY(16px)' }}>
          <img src={logo} alt="" style={{ width:18, height:18, objectFit:'contain', filter:'brightness(1.2)' }}/>
          <span style={{ color:'#FF8A3D', fontSize:12, fontWeight:500, letterSpacing:'0.06em' }}>Mittens AGI · AI Email Agent · Powered by AWS Bedrock</span>
        </div>
        <h1 data-reveal style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:'clamp(52px,8vw,100px)', lineHeight:1.02, color:'#F0EBE0', marginBottom:0, letterSpacing:'-0.02em', opacity:0, transition:'opacity 0.7s 0.1s, transform 0.7s 0.1s', transform:'translateY(24px)' }}>Your inbox,</h1>
        <h1 data-reveal style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:'clamp(52px,8vw,100px)', lineHeight:1.02, color:'#FF8A3D', marginBottom:0, letterSpacing:'-0.02em', opacity:0, transition:'opacity 0.7s 0.15s, transform 0.7s 0.15s', transform:'translateY(24px)' }}>handled.</h1>
        <h1 data-reveal style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:'clamp(52px,8vw,100px)', lineHeight:1.02, color:'rgba(240,235,224,0.28)', marginBottom:44, letterSpacing:'-0.02em', opacity:0, transition:'opacity 0.7s 0.2s, transform 0.7s 0.2s', transform:'translateY(24px)' }}>While you sleep.</h1>
        <div data-reveal style={{ display:'flex', alignItems:'center', gap:6, marginBottom:52, opacity:0, transition:'opacity 0.6s 0.35s', transform:'translateY(12px)' }}>
          <span ref={twRef} style={{ color:'#F0EBE0', fontSize:20, fontWeight:300 }}/>
          <span style={{ display:'inline-block', width:2, height:'1.2em', background:'#FF8A3D', animation:'blink 1s step-end infinite', verticalAlign:'middle' }}/>
        </div>
        <div data-reveal style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:80, opacity:0, transition:'opacity 0.6s 0.45s', transform:'translateY(12px)' }}>
          <button onClick={onCTA} data-hover style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#FF8A3D', color:'#08080D', fontWeight:700, fontSize:15, padding:'14px 32px', borderRadius:10, border:'none', cursor:'none', transition:'background 0.2s, transform 0.15s' }} onMouseEnter={e=>{e.currentTarget.style.background='#ff9d5c';e.currentTarget.style.transform='translateY(-2px)'}} onMouseLeave={e=>{e.currentTarget.style.background='#FF8A3D';e.currentTarget.style.transform='translateY(0)'}}>
            <img src={logo} alt="" style={{ width:18, height:18, objectFit:'contain' }}/> Connect Gmail — Free
          </button>
          <a href="#how-it-works" data-hover style={{ display:'inline-flex', alignItems:'center', gap:8, background:'transparent', color:'#F0EBE0', fontWeight:500, fontSize:15, padding:'14px 32px', borderRadius:10, border:'1px solid #1E1E2E', textDecoration:'none', cursor:'none', transition:'border-color 0.2s, color 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,138,61,0.4)';e.currentTarget.style.color='#FF8A3D'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#1E1E2E';e.currentTarget.style.color='#F0EBE0'}}>
            See how it works →
          </a>
        </div>
        <div data-reveal style={{ display:'flex', gap:48, borderTop:'1px solid #1E1E2E', paddingTop:40, flexWrap:'wrap', opacity:0, transition:'opacity 0.6s 0.55s' }}>
          {[['7 days','Free trial'],['$4','Per month after'],['6','Smart categories'],['30min','Auto-run interval']].map(([val,label]) => (
            <div key={label}>
              <div style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:32, color:'#F0EBE0', lineHeight:1 }}>{val}</div>
              <div style={{ color:'#6E6C7E', fontSize:13, marginTop:6 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap');
        @keyframes drift{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,20px) scale(1.1)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .c-dot{position:fixed;top:0;left:0;width:10px;height:10px;background:#FF8A3D;border-radius:50%;pointer-events:none;z-index:9999;transition:transform 0.08s}
        .c-ring{position:fixed;top:0;left:0;width:36px;height:36px;border:1.5px solid rgba(255,138,61,0.45);border-radius:50%;pointer-events:none;z-index:9998;transition:width 0.2s,height 0.2s,border-color 0.2s}
        .c-ring.big{width:52px;height:52px;border-color:rgba(255,138,61,0.8)}
        [data-reveal].in{opacity:1!important;transform:none!important}
        html{cursor:none}
        @media(max-width:768px){.c-dot,.c-ring{display:none}html{cursor:auto}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::selection{background:rgba(255,138,61,0.2);color:#F0EBE0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#08080D}::-webkit-scrollbar-thumb{background:#1E1E2E;border-radius:2px}
      `}</style>
    </section>
  )
}

function Marquee() {
  const items = ['Gmail API','AWS Bedrock','MCP Protocol','Nova Pro','Nova Micro','ntfy.sh','OpenClaw','Supabase','Paystack','OAuth 2.0','Agentic AI']
  const all = [...items,...items]
  return (
    <div style={{ borderTop:'1px solid #1E1E2E', borderBottom:'1px solid #1E1E2E', background:'#0F0F18', padding:'14px 0', overflow:'hidden' }}>
      <div style={{ display:'flex', width:'max-content', animation:'marquee 30s linear infinite' }}>
        {all.map((item,i) => (
          <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'0 28px', color:'#6E6C7E', fontSize:13, whiteSpace:'nowrap' }}>
            <img src={logo} alt="" style={{ width:12, height:12, objectFit:'contain', opacity:0.4 }}/>{item}
          </span>
        ))}
      </div>
    </div>
  )
}

function HowItWorks() {
  const steps = [
    { n:'01', icon:'📬', title:'Connect Gmail', body:'One-click Google OAuth. Mittens gets secure read access to your inbox in under 30 seconds. Nothing stored without permission.' },
    { n:'02', icon:'🤖', title:'Agent categorizes', body:'Every 30 minutes, Mittens fetches unread emails, runs them through Nova Micro (trial) or Nova Pro (paid), and applies category rules autonomously.' },
    { n:'03', icon:'📲', title:'You get a report', body:"A clean digest hits your phone via ntfy.sh — meetings, security alerts, spam count. No noise, no missed emails, just signal." },
  ]
  return (
    <section id="how-it-works" style={{ padding:'120px 24px', maxWidth:1120, margin:'0 auto' }}>
      <Eyebrow>How it works</Eyebrow>
      <h2 data-reveal style={headingStyle('0.1s')}>Three steps.<br/>Zero inbox anxiety.</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20, marginTop:64 }}>
        {steps.map((s,i) => (
          <Card key={s.n} delay={i*0.1}>
            <div style={{ fontSize:36, marginBottom:20 }}>{s.icon}</div>
            <div style={{ color:'#6E6C7E', fontSize:11, fontFamily:'monospace', letterSpacing:'0.12em', marginBottom:12 }}>{s.n}</div>
            <h3 style={{ color:'#F0EBE0', fontSize:20, fontWeight:500, marginBottom:12 }}>{s.title}</h3>
            <p style={{ color:'#6E6C7E', fontSize:14, lineHeight:1.7 }}>{s.body}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}

function Features() {
  const feats = [
    { tag:'Core',        title:'Gmail integration',     body:'Full read/modify access via Google OAuth. Mittens works on your actual emails — not a simulation.' },
    { tag:'Agentic',     title:'MCP agentic functions', body:'Built on the Model Context Protocol. Mittens chains tool calls and acts autonomously — archive, label, escalate.' },
    { tag:'AI',          title:'Smart categorization',  body:'Six categories: MEETING, EVENT, SECURITY, WORK, PERSONAL, SPAM. Each email tagged with AI precision.' },
    { tag:'Reports',     title:'Inbox reports',         body:'Daily and on-demand digests to your phone via ntfy.sh. One notification, full picture.' },
    { tag:'Security',    title:'Security alerting',     body:'Login alerts, password resets, suspicious senders — surfaced immediately as urgent priority.' },
    { tag:'AWS Bedrock', title:'Nova Micro → Nova Pro', body:'Nova Micro on the free trial. Nova Pro on paid — better reasoning, higher accuracy, 300k context.' },
  ]
  return (
    <section id="features" style={{ background:'#0F0F18', padding:'120px 24px' }}>
      <div style={{ maxWidth:1120, margin:'0 auto' }}>
        <Eyebrow>Features</Eyebrow>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:48, marginTop:24, flexWrap:'wrap', gap:24 }}>
          <h2 data-reveal style={headingStyle('0.1s')}>Not just a filter.<br/>An actual agent.</h2>
          <p data-reveal style={{ color:'#6E6C7E', fontSize:14, maxWidth:280, lineHeight:1.7, opacity:0, transition:'opacity 0.6s 0.2s' }}>Mittens reads, categorizes, escalates, and reports — continuously, on your behalf.</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:44 }}>
          {['Gmail','MCP','Bedrock','Reports','Security','Agentic'].map(tag => (
            <span key={tag} style={{ background:'rgba(255,138,61,0.06)', border:'1px solid rgba(255,138,61,0.15)', color:'#FF8A3D', fontSize:12, padding:'5px 14px', borderRadius:100, fontWeight:500 }}>{tag}</span>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>
          {feats.map((f,i) => (
            <Card key={f.title} delay={(i%3)*0.08} bg="#08080D">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <img src={logo} alt="" style={{ width:20, height:20, objectFit:'contain', opacity:0.7 }}/>
                <span style={{ background:'rgba(255,138,61,0.08)', border:'1px solid rgba(255,138,61,0.15)', color:'#FF8A3D', fontSize:11, padding:'3px 10px', borderRadius:100, fontWeight:500 }}>{f.tag}</span>
              </div>
              <h3 style={{ color:'#F0EBE0', fontSize:18, fontWeight:500, marginBottom:10 }}>{f.title}</h3>
              <p style={{ color:'#6E6C7E', fontSize:13, lineHeight:1.7 }}>{f.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing({ onCTA }) {
  const proFeatures = ['Amazon Nova Pro model','Gmail read + modify access','MCP agentic functions','6-category email classification','Security alert priority','Daily reports via ntfy.sh','Sender familiarity tagging','Custom query intervals']
  return (
    <section id="pricing" style={{ padding:'120px 24px', maxWidth:1120, margin:'0 auto' }}>
      <Eyebrow>Pricing</Eyebrow>
      <h2 data-reveal style={headingStyle('0.1s')}>One plan.<br/>Everything included.</h2>
      <p data-reveal style={{ color:'#6E6C7E', marginBottom:64, fontSize:15, marginTop:16, opacity:0, transition:'opacity 0.6s 0.2s' }}>Start with a 7-day free trial on Nova Micro. No card required.</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:24, maxWidth:840, margin:'0 auto' }}>
        <Card delay={0}>
          <div style={{ color:'#6E6C7E', fontSize:11, textTransform:'uppercase', letterSpacing:'0.14em', fontFamily:'monospace', marginBottom:16 }}>Free trial</div>
          <div style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:44, color:'#F0EBE0', marginBottom:6 }}>7 days</div>
          <div style={{ color:'#6E6C7E', fontSize:13, marginBottom:28 }}>Nova Micro · No card needed</div>
          <div style={{ height:1, background:'#1E1E2E', marginBottom:24 }}/>
          {['Gmail integration','Email categorization','ntfy.sh reports','Basic security alerts'].map(f => (
            <div key={f} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <span style={{ color:'#FF8A3D', fontSize:10 }}>◆</span>
              <span style={{ color:'#6E6C7E', fontSize:13 }}>{f}</span>
            </div>
          ))}
          <button onClick={onCTA} data-hover style={{ marginTop:28, width:'100%', background:'transparent', color:'#F0EBE0', fontWeight:500, fontSize:14, padding:'12px 0', borderRadius:10, border:'1px solid #1E1E2E', cursor:'none', transition:'border-color 0.2s, color 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,138,61,0.4)';e.currentTarget.style.color='#FF8A3D'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#1E1E2E';e.currentTarget.style.color='#F0EBE0'}}>Start free trial</button>
        </Card>
        <div data-reveal data-hover style={{ background:'linear-gradient(135deg,#141420,#0F0F18)', border:'1px solid rgba(255,138,61,0.3)', borderRadius:20, padding:32, boxShadow:'0 0 60px rgba(255,138,61,0.06)', cursor:'none', transition:'transform 0.2s, box-shadow 0.2s, opacity 0.6s', transitionDelay:'0.1s', opacity:0, transform:'translateY(20px)' }} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 0 80px rgba(255,138,61,0.1)'}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 0 60px rgba(255,138,61,0.06)'}}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <img src={logo} alt="" style={{ width:22, height:22, objectFit:'contain', filter:'drop-shadow(0 0 4px rgba(255,138,61,0.5))' }}/>
              <span style={{ color:'#FF8A3D', fontSize:11, textTransform:'uppercase', letterSpacing:'0.14em', fontFamily:'monospace' }}>Mittens Pro</span>
            </div>
            <span style={{ background:'#FF8A3D', color:'#08080D', fontSize:11, padding:'3px 10px', borderRadius:100, fontWeight:700 }}>Popular</span>
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:6 }}>
            <span style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:52, color:'#F0EBE0', lineHeight:1 }}>$4</span>
            <span style={{ color:'#6E6C7E', fontSize:14 }}>/month</span>
          </div>
          <div style={{ color:'#6E6C7E', fontSize:13, marginBottom:28 }}>Nova Pro · Cancel anytime</div>
          <div style={{ height:1, background:'rgba(255,138,61,0.15)', marginBottom:24 }}/>
          {proFeatures.map(f => (
            <div key={f} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <span style={{ color:'#FF8A3D', fontSize:10 }}>◆</span>
              <span style={{ color:'#F0EBE0', fontSize:13 }}>{f}</span>
            </div>
          ))}
          <button onClick={onCTA} data-hover style={{ marginTop:28, width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#FF8A3D', color:'#08080D', fontWeight:700, fontSize:15, padding:'14px 0', borderRadius:10, border:'none', cursor:'none', transition:'background 0.2s, transform 0.15s' }} onMouseEnter={e=>{e.currentTarget.style.background='#ff9d5c';e.currentTarget.style.transform='translateY(-1px)'}} onMouseLeave={e=>{e.currentTarget.style.background='#FF8A3D';e.currentTarget.style.transform='translateY(0)'}}>
            <img src={logo} alt="" style={{ width:18, height:18, objectFit:'contain' }}/>
            Get Mittens Pro — $4/mo
          </button>
          <p style={{ textAlign:'center', color:'#6E6C7E', fontSize:12, marginTop:14 }}>Via Paystack · ~KES 520/mo</p>
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  const quotes = [
    { q:"Mittens caught a suspicious login email I would've missed. Flagged as SECURITY and pinged my phone immediately.", name:'Amara K.', role:'Freelance designer, Nairobi' },
    { q:"I was drowning in newsletter noise. Now Mittens runs every 30 minutes and I actually see what matters.", name:'Brian O.', role:'Backend engineer, Lagos' },
    { q:"The MCP agentic setup is genuinely impressive. It's not just filtering — it makes decisions. $4/month is nothing.", name:'Priya M.', role:'Product manager, Bangalore' },
  ]
  return (
    <section style={{ background:'#0F0F18', padding:'120px 24px' }}>
      <div style={{ maxWidth:1120, margin:'0 auto' }}>
        <Eyebrow>What people say</Eyebrow>
        <h2 data-reveal style={headingStyle('0.1s')}>Real inboxes.<br/>Real results.</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16, marginTop:64 }}>
          {quotes.map((q,i) => (
            <Card key={q.name} delay={i*0.1} bg="#08080D">
              <img src={logo} alt="" style={{ width:22, height:22, objectFit:'contain', marginBottom:20, opacity:0.45 }}/>
              <p style={{ color:'#F0EBE0', fontSize:14, lineHeight:1.7, fontStyle:'italic', fontWeight:300, marginBottom:24 }}>"{q.q}"</p>
              <div style={{ height:1, background:'#1E1E2E', marginBottom:20 }}/>
              <div style={{ color:'#F0EBE0', fontSize:14, fontWeight:500 }}>{q.name}</div>
              <div style={{ color:'#6E6C7E', fontSize:12, marginTop:4 }}>{q.role}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTABanner({ onCTA }) {
  return (
    <section style={{ padding:'120px 24px', maxWidth:1120, margin:'0 auto' }}>
      <div data-reveal style={{ background:'linear-gradient(135deg,#141420,#0F0F18)', border:'1px solid rgba(255,138,61,0.25)', borderRadius:32, padding:'80px 40px', textAlign:'center', boxShadow:'0 0 80px rgba(255,138,61,0.05)', opacity:0, transition:'opacity 0.7s, transform 0.7s', transform:'scale(0.97)' }}>
        <img src={logo} alt="Mittens AGI" style={{ width:80, height:80, objectFit:'contain', margin:'0 auto 32px', display:'block', filter:'drop-shadow(0 0 24px rgba(255,138,61,0.35))', opacity:0.75 }}/>
        <h2 style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:'clamp(40px,6vw,72px)', color:'#F0EBE0', marginBottom:20, lineHeight:1.05 }}>Your inbox won't<br/>manage itself.</h2>
        <p style={{ color:'#6E6C7E', fontSize:16, marginBottom:40 }}>7 days free, then $4/month. No contracts, no noise.</p>
        <button onClick={onCTA} data-hover style={{ display:'inline-flex', alignItems:'center', gap:10, background:'#FF8A3D', color:'#08080D', fontWeight:700, fontSize:16, padding:'16px 40px', borderRadius:12, border:'none', cursor:'none', transition:'background 0.2s, transform 0.15s' }} onMouseEnter={e=>{e.currentTarget.style.background='#ff9d5c';e.currentTarget.style.transform='translateY(-2px)'}} onMouseLeave={e=>{e.currentTarget.style.background='#FF8A3D';e.currentTarget.style.transform='translateY(0)'}}>
          <img src={logo} alt="" style={{ width:20, height:20, objectFit:'contain' }}/> Connect Gmail — Start free
        </button>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer style={{ borderTop:'1px solid #1E1E2E', padding:'40px 24px' }}>
      <div style={{ maxWidth:1120, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:20 }}>
        <MittensLogo size={30} showText={true}/>
        <div style={{ display:'flex', gap:28 }}>
          {['Privacy','Terms','Docs','GitHub'].map(l => (
            <a key={l} href="#" style={{ color:'#6E6C7E', fontSize:13, textDecoration:'none', transition:'color 0.2s' }} onMouseEnter={e=>e.target.style.color='#F0EBE0'} onMouseLeave={e=>e.target.style.color='#6E6C7E'}>{l}</a>
          ))}
        </div>
        <div style={{ color:'#6E6C7E', fontSize:12 }}>Built by <a href="https://github.com/salamander-tech-hub" style={{ color:'#FF8A3D', textDecoration:'none' }}>Salamander Tech Hub</a> · 2026</div>
      </div>
    </footer>
  )
}

export default function App() {
  useReveal()
  const handleCTA = () => { window.location.href = 'http://localhost:5000/api/auth/google' }
  return (
    <div style={{ background:'#08080D', minHeight:'100vh', fontFamily:"'Inter',system-ui,sans-serif", color:'#F0EBE0' }}>
      <Cursor/>
      <Navbar onCTA={handleCTA}/>
      <Hero onCTA={handleCTA}/>
      <Marquee/>
      <HowItWorks/>
      <Features/>
      <Pricing onCTA={handleCTA}/>
      <Testimonials/>
      <CTABanner onCTA={handleCTA}/>
      <Footer/>
    </div>
  )
}