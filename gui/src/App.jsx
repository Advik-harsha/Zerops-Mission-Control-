/**
 * App — root component.
 * Manages global state: merges REST initial load + WebSocket live updates.
 */
import React, { useState, useCallback, useEffect } from 'react'
import ControlRoom from './components/ControlRoom.jsx'
import { useWebSocket } from './hooks/useWebSocket.js'
import { useApi } from './hooks/useApi.js'

export default function App() {
  const [services, setServices] = useState([])
  const [pipelineEvents, setPipelineEvents] = useState([])
  const [logEntries, setLogEntries] = useState([])
  const [projectName, setProjectName] = useState('mission-control')
  const [lastUpdated, setLastUpdated] = useState(null)

  // Load initial data from REST (before WS connects)
  const { initialServices, initialHistory } = useApi()

  useEffect(() => {
    if (initialServices.length > 0) setServices(initialServices)
  }, [initialServices])

  useEffect(() => {
    if (initialHistory.length > 0) setLogEntries(initialHistory)
  }, [initialHistory])

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((msg) => {
    if (!msg || !msg.type) return

    // Full sync (first message after connection)
    if (msg.type === 'full_sync' || msg.type === 'state_update') {
      if (msg.project_name) setProjectName(msg.project_name)
      if (msg.timestamp)    setLastUpdated(msg.timestamp)

      if (Array.isArray(msg.services) && msg.services.length > 0) {
        setServices(msg.services)
      }

      if (Array.isArray(msg.pipeline_events) && msg.pipeline_events.length > 0) {
        setPipelineEvents(prev => {
          // Keep most recent 20 pipeline events
          const merged = [...prev, ...msg.pipeline_events]
          return merged.slice(-20)
        })
      }

      if (Array.isArray(msg.log_entries) && msg.log_entries.length > 0) {
        setLogEntries(prev => {
          const merged = [...prev, ...msg.log_entries]
          return merged.slice(-200) // Keep last 200 entries
        })
      }
    }
  }, [])

  const { connectionStatus } = useWebSocket(handleMessage)

  return (
    <ControlRoom
      services={services}
      pipelineEvents={pipelineEvents}
      logEntries={logEntries}
      projectName={projectName}
      connectionStatus={connectionStatus}
      lastUpdated={lastUpdated}
    />
  )
}
