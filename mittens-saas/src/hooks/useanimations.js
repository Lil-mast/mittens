import { useEffect } from 'react'

// Custom cat-eye cursor
export const useCursor = () => {
  useEffect(() => {
    const dot  = document.querySelector('.cursor-dot')
    const ring = document.querySelector('.cursor-ring')
    if (!dot || !ring) return

    let mouseX = 0, mouseY = 0
    let ringX  = 0, ringY  = 0
    let raf

    const onMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
      dot.style.transform = `translate(${mouseX - 5}px, ${mouseY - 5}px)`
    }

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.12
      ringY += (mouseY - ringY) * 0.12
      ring.style.transform = `translate(${ringX - 18}px, ${ringY - 18}px)`
      raf = requestAnimationFrame(animateRing)
    }

    const onEnter = () => ring.classList.add('hovering')
    const onLeave = () => ring.classList.remove('hovering')

    document.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(animateRing)

    const hoverEls = document.querySelectorAll('a, button, .card-glow, .btn-primary, .btn-ghost')
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    })

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])
}

// Intersection observer scroll reveals
export const useScrollReveal = () => {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

// Typewriter effect
export const useTypewriter = (elementId, words, speed = 80, pause = 1800) => {
  useEffect(() => {
    const el = document.getElementById(elementId)
    if (!el) return

    let wordIndex = 0
    let charIndex = 0
    let deleting  = false
    let timeout

    const type = () => {
      const current = words[wordIndex]
      if (deleting) {
        el.textContent = current.substring(0, charIndex - 1)
        charIndex--
        if (charIndex === 0) {
          deleting   = false
          wordIndex  = (wordIndex + 1) % words.length
          timeout    = setTimeout(type, 400)
          return
        }
        timeout = setTimeout(type, speed / 2)
      } else {
        el.textContent = current.substring(0, charIndex + 1)
        charIndex++
        if (charIndex === current.length) {
          deleting = true
          timeout  = setTimeout(type, pause)
          return
        }
        timeout = setTimeout(type, speed)
      }
    }

    timeout = setTimeout(type, 600)
    return () => clearTimeout(timeout)
  }, [elementId, words, speed, pause])
}

// Counter animation
export const useCounter = (elementId, target, duration = 1800) => {
  useEffect(() => {
    const el = document.getElementById(elementId)
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()

      const start = performance.now()
      const update = (now) => {
        const progress = Math.min((now - start) / duration, 1)
        const eased    = 1 - Math.pow(1 - progress, 3)
        el.textContent = Math.round(eased * target)
        if (progress < 1) requestAnimationFrame(update)
      }
      requestAnimationFrame(update)
    }, { threshold: 0.5 })

    observer.observe(el)
    return () => observer.disconnect()
  }, [elementId, target, duration])
}