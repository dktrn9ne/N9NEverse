import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error)
    console.error(info)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            padding: 18,
            background: '#020308',
            color: 'white',
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
          }}
        >
          <div style={{ maxWidth: 920, margin: '0 auto' }}>
            <div style={{ opacity: 0.7, letterSpacing: '0.22em', fontSize: 12 }}>
              N9NEVERSE — DIAGNOSTIC
            </div>
            <h1 style={{ margin: '10px 0 8px', fontSize: 18 }}>
              Something crashed while loading.
            </h1>
            <p style={{ margin: 0, opacity: 0.85, lineHeight: 1.45 }}>
              If you screenshot this and send it to me, I’ll fix it fast.
            </p>
            <pre
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
