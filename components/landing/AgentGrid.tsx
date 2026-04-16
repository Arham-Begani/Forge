'use client'

import { useEffect, useRef, useState } from 'react'

const FEATURED = {
  icon: 'FL',
  accent: '#C4975A',
  title: 'Full Launch',
  tagline: 'Validation, launch assets, and investor context in one run.',
  description: 'Research informs your positioning. Positioning informs the landing page. Feasibility pressure-tests the numbers. Investor Kit packages the story. Full Launch keeps the chain intact so you are not pitching disconnected AI fragments.',
  subAgents: [
    { icon: 'R', label: 'Research', accent: '#5A8C6E' },
    { icon: 'B', label: 'Branding', accent: '#5A6E8C' },
    { icon: 'L', label: 'Landing Page', accent: '#8C7A5A' },
    { icon: 'F', label: 'Feasibility', accent: '#7A5A8C' },
  ],
}

const AGENTS = [
  {
    icon: 'R',
    accent: '#5A8C6E',
    title: 'Research',
    description: 'Validate demand, map the market, and identify where the opening really is.',
    outputs: ['TAM / SAM / SOM', 'Top competitors + gaps', 'Recommended next test'],
  },
  {
    icon: 'B',
    accent: '#5A6E8C',
    title: 'Branding',
    description: 'Create positioning and identity that actually match the market you are entering.',
    outputs: ['Names + positioning', 'Color + typography guide', 'Brand voice system'],
  },
  {
    icon: 'M',
    accent: '#8C5A7A',
    title: 'Marketing',
    description: 'Turn validated insight into a launch plan your market can actually respond to.',
    outputs: ['GTM playbook', 'Launch content system', 'Email launch sequence'],
  },
  {
    icon: 'L',
    accent: '#8C7A5A',
    title: 'Landing Page',
    description: 'Deploy a live validation page that turns positioning into an actual market test.',
    outputs: ['Live deployed URL', 'Full page copy', 'Lead capture ready'],
  },
  {
    icon: 'F',
    accent: '#7A5A8C',
    title: 'Feasibility',
    description: 'Stress-test the opportunity with numbers, assumptions, and a clear decision.',
    outputs: ['Revenue forecast', 'Profitability timeline', 'GO/NO-GO verdict'],
  },
  {
    icon: 'C',
    accent: '#6B8F71',
    title: 'Advisor',
    description: 'Ask follow-up questions across every output without losing venture context.',
    outputs: ['Contextual answers', 'Strategic pivots', 'Refinement ideas'],
  },
  {
    icon: 'SB',
    accent: '#E04848',
    title: 'Reality Check',
    description: 'Pressure-test assumptions before they become expensive mistakes.',
    outputs: ['Survival Score (0-100)', 'Critical blind spots', 'Pivot recommendations'],
  },
  {
    icon: 'MVP',
    accent: '#C45A5A',
    title: 'MVP Scope',
    description: 'Cut the product down to the smallest version that can validate the thesis.',
    outputs: ['Must-have features', 'Weekend sprint spec', 'First success metric'],
  },
]

export function AgentGrid() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [hoveredAgent, setHoveredAgent] = useState<number | null>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="agents" ref={sectionRef} style={{
      padding: 'clamp(64px, 8vw, 112px) 24px',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '56px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>
        <p style={{
          fontFamily: 'var(--font-dm-sans), sans-serif',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.12em',
          color: 'var(--accent)',
          textTransform: 'uppercase',
          margin: '0 0 12px',
        }}>
          Inside Forze
        </p>
        <h2 style={{
          fontFamily: 'var(--font-dm-sans), sans-serif',
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 800,
          color: 'var(--text)',
          margin: '0 0 16px',
          letterSpacing: '-0.02em',
        }}>
          The Validation Stack
        </h2>
        <p style={{
          fontFamily: 'var(--font-dm-sans), sans-serif',
          fontSize: '17px',
          color: 'var(--text-soft)',
          maxWidth: '560px',
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          Each module does one hard job. Together they turn conviction into evidence.
        </p>
      </div>

      <div
        style={{
          borderRadius: 'var(--radius-xl)',
          background: `linear-gradient(135deg, ${FEATURED.accent}12, ${FEATURED.accent}06)`,
          border: `1px solid ${FEATURED.accent}30`,
          padding: 'clamp(20px, 4vw, 36px)',
          marginBottom: '24px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 'clamp(16px, 3vw, 32px)',
          alignItems: 'center',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.6s 0.1s ease, transform 0.6s 0.1s ease, border-color var(--transition-fast), box-shadow var(--transition-fast)',
          cursor: 'default',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = `${FEATURED.accent}60`
          e.currentTarget.style.boxShadow = `0 24px 48px -12px ${FEATURED.accent}20`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = `${FEATURED.accent}30`
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(to right, transparent, ${FEATURED.accent}80, transparent)`,
          animation: 'scan-line 3s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-md)',
              background: `${FEATURED.accent}20`,
              border: `1px solid ${FEATURED.accent}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 700,
              color: FEATURED.accent,
              flexShrink: 0,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}>
              {FEATURED.icon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'var(--text)',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}>
                  {FEATURED.title}
                </h3>
                <span style={{
                  padding: '2px 10px',
                  borderRadius: '999px',
                  background: `${FEATURED.accent}20`,
                  color: FEATURED.accent,
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                }}>
                  RECOMMENDED
                </span>
              </div>
              <p style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: '13px',
                color: 'var(--muted)',
                margin: '2px 0 0',
              }}>
                {FEATURED.tagline}
              </p>
            </div>
          </div>
          <p style={{
            fontFamily: 'var(--font-dm-sans), sans-serif',
            fontSize: '15px',
            color: 'var(--text-soft)',
            margin: 0,
            lineHeight: 1.65,
            maxWidth: '620px',
          }}>
            {FEATURED.description}
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexShrink: 0,
        }}>
          {FEATURED.subAgents.map((sub, i) => (
            <div key={sub.label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              background: `${sub.accent}12`,
              border: `1px solid ${sub.accent}25`,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(16px)',
              transition: `opacity 0.5s ${0.3 + i * 0.1}s ease, transform 0.5s ${0.3 + i * 0.1}s ease`,
            }}>
              <span style={{
                fontSize: '12px',
                color: sub.accent,
                fontWeight: 700,
                minWidth: '18px',
                textAlign: 'center',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}>
                {sub.icon}
              </span>
              <span style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-soft)',
                whiteSpace: 'nowrap',
              }}>
                {sub.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="agent-grid-cards" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '16px',
      }}>
        {AGENTS.map((agent, i) => (
          <div
            key={agent.title}
            onMouseEnter={() => setHoveredAgent(i)}
            onMouseLeave={() => setHoveredAgent(null)}
            style={{
              borderRadius: 'var(--radius-lg)',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(var(--glass-blur))',
              WebkitBackdropFilter: 'blur(var(--glass-blur))',
              border: '1px solid var(--glass-border)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              opacity: visible ? 1 : 0,
              transform: visible
                ? (hoveredAgent === i ? 'translateY(-5px) scale(1.01)' : 'translateY(0) scale(1)')
                : 'translateY(32px) scale(1)',
              transition: `opacity 0.5s ${0.15 + i * 0.05}s ease, transform 0.5s ${0.15 + i * 0.05}s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease, border-color 0.2s ease`,
              boxShadow: hoveredAgent === i ? `0 16px 40px -8px ${agent.accent}30` : 'none',
              borderLeft: `3px solid ${hoveredAgent === i ? agent.accent : `${agent.accent}80`}`,
              cursor: 'default',
              position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: agent.accent,
              animation: `pulse 2s ease-in-out ${i * 0.3}s infinite`,
              opacity: 0.7,
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '12px',
                  color: agent.accent,
                  fontWeight: 700,
                  minWidth: '26px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}>
                  {agent.icon}
                </span>
                <span style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--text)',
                }}>
                  {agent.title}
                </span>
              </div>
              <span style={{
                padding: '2px 8px',
                borderRadius: '999px',
                background: `${agent.accent}15`,
                color: agent.accent,
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                flexShrink: 0,
              }}>
                AI
              </span>
            </div>

            <p style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: '14px',
              color: 'var(--text-soft)',
              margin: 0,
              lineHeight: 1.55,
            }}>
              {agent.description}
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border)',
            }}>
              {agent.outputs.map((out) => (
                <div key={out} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  fontSize: '12px',
                  color: 'var(--muted)',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                }}>
                  <span style={{ color: agent.accent, fontSize: '10px', flexShrink: 0 }}>•</span>
                  {out}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 640px) {
          #agents > div:nth-child(2) {
            grid-template-columns: 1fr !important;
          }
          .agent-grid-cards {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
