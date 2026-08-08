/**
 * App — root component with ErrorBoundary for crash-proof rendering.
 */
import React, { useState, useCallback, useEffect, Component } from 'react'
import ControlRoom from './components/ControlRoom.jsx'
import { useWebSocket } from './hooks/useWebSocket.js'
import { useApi } from './hooks/useApi.js'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Mission Control UI Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 40,
          background: '#040810',
          color: '#ff3355',
          fontFamily: 'monospace',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          textAlign: 'center',
        }}>
          <h2 style={{ letterSpacing: '0.1em' }}>⚠️ TELEMETRY VIEWPORT EXCEPTION</h2>
          <div style={{
            color: '#00d4ff',
            background: 'rgba(13,20,36,0.9)',
            border: '1px solid rgba(0,212,255,0.3)',
            padding: 16,
            borderRadius: 8,
            maxWidth: 600,
            fontSize: 12,
            lineHeight: 1.5,
            wordBreak: 'break-word',
          }}>
            {String(this.state.error?.message || this.state.error)}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#00d4ff',
              color: '#040810',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            🔄 REBOOT SYSTEM
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const [services, setServices] = useState([])
  const [pipelineEvents, setPipelineEvents] = useState([])
  const [logEntries, setLogEntries] = useState([])
  const [projectName, setProjectName] = useState('mission-control')
  const [lastUpdated, setLastUpdated] = useState(null)

  // Load initial data from REST (before WS connects)
  const { initialServices, initialHistory } = useApi()

  useEffect(() => {
    if (Array.isArray(initialServices) && initialServices.length > 0) {
      setServices(initialServices)
    }
  }, [initialServices])

  useEffect(() => {
    if (Array.isArray(initialHistory) && initialHistory.length > 0) {
      setLogEntries(initialHistory)
    }
  }, [initialHistory])

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((msg) => {
    if (!msg || !msg.type) return

    if (msg.type === 'full_sync' || msg.type === 'state_update') {
      if (msg.project_name) setProjectName(msg.project_name)
      if (msg.timestamp)    setLastUpdated(msg.timestamp)

      if (Array.isArray(msg.services) && msg.services.length > 0) {
        setServices(msg.services)
      }

      if (Array.isArray(msg.pipeline_events) && msg.pipeline_events.length > 0) {
        setPipelineEvents(prev => {
          const safePrev = Array.isArray(prev) ? prev : []
          const merged = [...safePrev, ...msg.pipeline_events]
          return merged.slice(-20)
        })
      }

      if (Array.isArray(msg.log_entries) && msg.log_entries.length > 0) {
        setLogEntries(prev => {
          const safePrev = Array.isArray(prev) ? prev : []
          const merged = [...safePrev, ...msg.log_entries]
          return merged.slice(-200)
        })
      }
    }
  }, [])

  const { connectionStatus } = useWebSocket(handleMessage)

  return (
    <ErrorBoundary>
      <ControlRoom
        services={services}
        pipelineEvents={pipelineEvents}
        logEntries={logEntries}
        projectName={projectName}
        connectionStatus={connectionStatus}
        lastUpdated={lastUpdated}
      />
    </ErrorBoundary>
  )
}
