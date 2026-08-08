/**
 * useWebSocket — persistent WebSocket connection with auto-reconnect.
 *
 * Returns: { connected, lastMessage, connectionStatus }
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { getWsUrl } from './config.js'

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000] // back-off

export function useWebSocket(onMessage) {
  const [connectionStatus, setConnectionStatus] = useState('connecting') // connecting | live | reconnecting | offline
  const wsRef = useRef(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setConnectionStatus(reconnectAttemptRef.current > 0 ? 'reconnecting' : 'connecting')

    const wsUrl = getWsUrl()
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setConnectionStatus('live')
      reconnectAttemptRef.current = 0
      // Keep-alive ping every 20s
      ws._pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping')
      }, 20000)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'pong' || data.type === 'ping') return
        onMessageRef.current(data)
      } catch (_) {}
    }

    ws.onerror = () => {
      setConnectionStatus('reconnecting')
    }

    ws.onclose = () => {
      clearInterval(ws._pingInterval)
      setConnectionStatus('reconnecting')
      const delay =
        RECONNECT_DELAYS[
          Math.min(reconnectAttemptRef.current, RECONNECT_DELAYS.length - 1)
        ]
      reconnectAttemptRef.current++
      reconnectTimerRef.current = setTimeout(connect, delay)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null // prevent reconnect on unmount
        wsRef.current.close()
      }
    }
  }, [connect])

  return { connectionStatus }
}
