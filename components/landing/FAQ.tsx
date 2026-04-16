'use client'

import { useEffect, useRef, useState } from 'react'

const FAQS = [
  {
    q: 'How is Forze different from ChatGPT?',
    a: 'ChatGPT gives you disconnected answers. Forze gives you a connected validation system. Research informs branding, branding informs the landing page, feasibility stress-tests the thesis, Shadow Board attacks your assumptions, and Investor Kit packages the case. The value is the continuity, not just the text generation.',
  },
  {
    q: 'Do I need technical skills to use Forze?',
    a: 'None. You describe your idea in plain English. Forze handles the research, positioning, validation page, feasibility modeling, and investor materials. If you can explain the problem clearly, you can use Forze.',
  },
  {
    q: 'How long does a Full Launch actually take?',
    a: 'Typically 3-7 minutes depending on idea complexity and model latency. Research, branding, landing page generation, and feasibility analysis run together, so you get a usable validation package in one pass instead of stitching outputs together manually.',
  },
  {
    q: 'Can I edit the outputs?',
    a: 'Yes. Every agent supports edit mode. Ask for the specific change you want and Forze updates only the relevant fields instead of regenerating everything. That makes it practical to tighten a thesis, rerun positioning, or refine a landing page without losing context.',
  },
  {
    q: 'What does the Shadow Board actually do?',
    a: 'Three AI personas - a Silicon Skeptic, UX Evangelist, and Growth Alchemist - simulate a hard board review of your venture. They challenge CAC assumptions, onboarding risk, and strategic weakness so you find the cracks early. You get a Venture Survival Score, pivot recommendations, and synthetic user feedback.',
  },
  {
    q: 'How should I use the feasibility analysis?',
    a: 'Use it as a high-quality decision tool, not audited finance. Forze combines market context, competitor information, and structured assumption testing to tell you whether the idea looks investable, fragile, or worth changing. It is strongest as a way to decide what to test next and what to stop believing too early.',
  },
  {
    q: 'Is the Investor Kit based on the real venture outputs?',
    a: 'Yes. Investor Kit is not a generic deck generator. It pulls from the venture research, feasibility findings, brand context, and launch materials already produced inside Forze, then turns that into a coherent memo, deck outline, ask details, and data room summary.',
  },
  {
    q: 'What are credits and how do they work?',
    a: 'Credits are consumed per agent run. Simple agents like Co-pilot cost 1 credit. Complex agents like Full Launch cost 30 credits. Your plan includes a monthly credit allowance. Credits roll over within your billing cycle, and top-ups are available if you need more.',
  },
  {
    q: 'What happens to my venture data?',
    a: 'Your data is stored securely in your account and is not shared with other users. You own the outputs, including the research, landing page assets, and investor materials generated from your venture. Delete your account at any time to remove the data.',
  },
]

export function FAQ() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={sectionRef} style={{
      padding: 'clamp(64px, 8vw, 112px) 24px',
      maxWidth: '760px',
      margin: '0 auto',
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '56px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>
        <p style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--accent)', textTransform: 'uppercase', margin: '0 0 12px' }}>
          FAQ
        </p>
        <h2 style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Questions answered
        </h2>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {FAQS.map((faq, i) => {
          const isOpen = openIdx === i
          return (
            <div
              key={faq.q}
              style={{
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                borderLeft: isOpen ? '3px solid var(--accent)' : '3px solid transparent',
                background: isOpen ? 'var(--glass-bg)' : 'transparent',
                backdropFilter: isOpen ? 'blur(var(--glass-blur))' : 'none',
                WebkitBackdropFilter: isOpen ? 'blur(var(--glass-blur))' : 'none',
                overflow: 'hidden',
                transition: 'background var(--transition-smooth), border-color var(--transition-smooth), border-left-color var(--transition-smooth), transform var(--transition-fast), box-shadow var(--transition-fast)',
                borderColor: isOpen ? 'hsla(28,62%,42%,0.25)' : 'var(--border)',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                transitionDelay: visible ? `${i * 0.07}s` : '0s',
                boxShadow: isOpen ? '0 8px 24px -4px hsla(28,62%,42%,0.12)' : 'none',
                animation: isOpen ? 'border-glow 3s ease-in-out infinite' : 'none',
              }}
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                onMouseEnter={e => {
                  if (!isOpen) (e.currentTarget.parentElement as HTMLElement).style.borderColor = 'hsla(28,62%,42%,0.25)'
                }}
                onMouseLeave={e => {
                  if (!isOpen) (e.currentTarget.parentElement as HTMLElement).style.borderColor = 'var(--border)'
                }}
                style={{
                  width: '100%',
                  padding: '18px 20px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  textAlign: 'left',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: isOpen ? 'var(--accent)' : 'var(--text)',
                  transition: 'color var(--transition-fast)',
                  lineHeight: 1.4,
                }}>
                  {faq.q}
                </span>
                <span style={{
                  fontSize: '18px',
                  color: isOpen ? 'var(--accent)' : 'var(--muted)',
                  flexShrink: 0,
                  transition: 'transform var(--transition-smooth), color var(--transition-fast)',
                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                  display: 'inline-block',
                  lineHeight: 1,
                }}>
                  +
                </span>
              </button>

              {isOpen && (
                <div style={{
                  padding: '0 20px 20px',
                  animation: 'slide-down 0.25s ease both',
                }}>
                  <p style={{
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    fontSize: '14px',
                    color: 'var(--text-soft)',
                    margin: 0,
                    lineHeight: 1.7,
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border)',
                  }}>
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
