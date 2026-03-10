'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.fallback) return this.fallback

      return (
        <div style={errorContainerStyle}>
          <div style={errorCardStyle} className="glass">
            <div style={iconStyle}>⚠️</div>
            <h2 style={titleStyle}>Something went wrong</h2>
            <p style={descStyle}>
              {this.state.error?.message || 'An unexpected error occurred in this component.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={btnStyle}
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }

  private get fallback() {
    return this.props.fallback
  }
}

const errorContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
  width: '100%',
}

const errorCardStyle: React.CSSProperties = {
  maxWidth: 400,
  width: '100%',
  padding: 32,
  borderRadius: 20,
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
}

const iconStyle: React.CSSProperties = {
  fontSize: 40,
  marginBottom: 8,
}

const titleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  margin: 0,
  color: 'var(--text)',
}

const descStyle: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--muted)',
  lineHeight: 1.6,
  margin: 0,
}

const btnStyle: React.CSSProperties = {
  marginTop: 8,
  padding: '10px 20px',
  borderRadius: 12,
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
}
