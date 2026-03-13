'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)
  const [mounted, setMounted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevPathname = useRef(pathname)
  const completeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Start progress on pathname change initiation
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname
      // Complete when pathname actually changes
      completeBar()
    }
  }, [pathname])

  function startBar() {
    // Decouple state updates from the navigation event loop
    setTimeout(() => {
      // Clear any existing timers
      if (timerRef.current) clearTimeout(timerRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (completeTimeoutRef.current) clearTimeout(completeTimeoutRef.current)

      setVisible(true)
      setWidth(0)

      // Quickly jump to 15%
      requestAnimationFrame(() => {
        setWidth(15)
        // Gradually inch to ~85%
        intervalRef.current = setInterval(() => {
          setWidth(prev => {
            if (prev >= 85) {
              clearInterval(intervalRef.current!)
              return prev
            }
            // Slow down as it approaches 85
            const increment = (85 - prev) * 0.12 + 0.5
            return Math.min(prev + increment, 85)
          })
        }, 80)
      })
    }, 0)
  }

  function completeBar() {
    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setWidth(100)
      completeTimeoutRef.current = setTimeout(() => {
        setVisible(false)
        setWidth(0)
      }, 350)
    }, 0)
  }

  // Intercept router.push calls by watching for navigation
  useEffect(() => {
    // Patch history.pushState and replaceState to detect navigations
    const originalPush = window.history.pushState.bind(window.history)
    const originalReplace = window.history.replaceState.bind(window.history)

    window.history.pushState = function(...args) {
      startBar()
      return originalPush(...args)
    }

    window.history.replaceState = function(...args) {
      startBar()
      return originalReplace(...args)
    }

    // Handle popstate (browser back/forward)
    function onPopState() { startBar() }
    window.addEventListener('popstate', onPopState)

    // Capture current timer ref value for cleanup
    const currentTimer = timerRef.current;

    return () => {
      window.history.pushState = originalPush
      window.history.replaceState = originalReplace
      window.removeEventListener('popstate', onPopState)
      if (currentTimer) clearTimeout(currentTimer)
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (completeTimeoutRef.current) clearTimeout(completeTimeoutRef.current)
    }
  }, [])

  if (!mounted) return null
  if (!visible && width === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2.5,
        zIndex: 99999,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${width}%`,
          background: 'linear-gradient(90deg, var(--accent), #e8a04e, var(--accent))',
          backgroundSize: '200% 100%',
          borderRadius: '0 2px 2px 0',
          boxShadow: '0 0 8px var(--accent-glow), 0 0 16px var(--accent-glow)',
          transition: width === 100
            ? 'width 0.2s ease-out'
            : width <= 15
            ? 'width 0.15s ease-out'
            : 'width 0.35s ease-out',
          animation: 'nprogress-shimmer 1.5s linear infinite',
          willChange: 'width',
        }}
      />
    </div>
  )
}
