'use client'

import { motion } from 'framer-motion'
import { type ReactNode, useEffect, useState } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

const variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

export function PageTransition({ children, className, style }: PageTransitionProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}
