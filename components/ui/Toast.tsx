'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info'

interface ToastRecord {
  id: string
  message: string
  type: ToastType
  duration: number
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Per-type config ──────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ToastType, { accent: string; glyph: ReactNode }> = {
  success: {
    accent: '#5A8C6E',
    glyph: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
  error: {
    accent: '#C45A5A',
    glyph: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M18 6 6 18" /><path d="M6 6l12 12" />
      </svg>
    ),
  },
  info: {
    accent: '#c07a3a',
    glyph: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
  },
}

// ─── Forze hex mark ───────────────────────────────────────────────────────────

function ForzeHex({ accent }: { accent: string }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        flexShrink: 0,
        boxShadow: `0 4px 14px ${accent}50`,
      }}
    >
      {TYPE_CONFIG[accent as ToastType]?.glyph}
    </div>
  )
}

// ─── Single toast ─────────────────────────────────────────────────────────────

function ToastItem({ toast, onRemove }: { toast: ToastRecord; onRemove: (id: string) => void }) {
  const { accent, glyph } = TYPE_CONFIG[toast.type]

  useEffect(() => {
    const t = window.setTimeout(() => onRemove(toast.id), toast.duration)
    return () => window.clearTimeout(t)
  }, [onRemove, toast.duration, toast.id])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 48, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 32, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: 'min(340px, calc(100vw - 28px)',
        borderRadius: 16,
        background: 'rgba(13, 13, 12, 0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: `0 24px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      {/* Subtle top accent line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 1.5,
        background: `linear-gradient(90deg, transparent, ${accent}90, ${accent}, ${accent}90, transparent)`,
      }} />

      {/* Ambient glow behind hex */}
      <div style={{
        position: 'absolute',
        top: -20, left: -10,
        width: 80, height: 80,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px 13px 14px', position: 'relative' }}>
        {/* Hex icon */}
        <div
          style={{
            width: 32,
            height: 32,
            background: `linear-gradient(135deg, ${accent}ee, ${accent}aa)`,
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
            boxShadow: `0 6px 18px ${accent}55`,
          }}
        >
          {glyph}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Forze brand label */}
          <div style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: accent,
            marginBottom: 3,
            fontFamily: 'inherit',
          }}>
            Forze
          </div>
          {/* Message */}
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.4,
            color: 'rgba(255,255,255,0.92)',
            wordBreak: 'break-word',
            letterSpacing: '-0.01em',
          }}>
            {toast.message}
          </div>
        </div>

        {/* Dismiss */}
        <button
          type="button"
          onClick={() => onRemove(toast.id)}
          aria-label="Dismiss"
          style={{
            border: 'none',
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.35)',
            cursor: 'pointer',
            padding: 0,
            width: 22,
            height: 22,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 150ms, color 150ms',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.65)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)'
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
            <path d="M18 6 6 18" /><path d="M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress drain bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: toast.duration / 1000, ease: 'linear' }}
        style={{
          height: 2,
          background: `linear-gradient(90deg, ${accent}80, ${accent})`,
          transformOrigin: 'left center',
          borderRadius: '0 0 0 0',
        }}
      />
    </motion.div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts(prev => [...prev, { id, message, type, duration }])
  }, [])

  const value = useMemo<ToastContextValue>(() => ({
    showToast,
    success: (m, d) => showToast(m, 'success', d),
    error: (m, d) => showToast(m, 'error', d),
    info: (m, d) => showToast(m, 'info', d),
  }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          zIndex: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence initial={false}>
          {toasts.map(toast => (
            <div key={toast.id} style={{ pointerEvents: 'auto' }}>
              <ToastItem toast={toast} onRemove={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
