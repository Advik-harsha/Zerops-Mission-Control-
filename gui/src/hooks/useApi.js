/**
 * useApi — fetch initial state from REST before WebSocket connects.
 */
import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function useApi() {
  const [initialServices, setInitialServices] = useState([])
  const [initialHistory, setInitialHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchInitial() {
      try {
        const [svcRes, histRes] = await Promise.all([
          fetch(`${API_URL}/api/services`),
          fetch(`${API_URL}/api/history?limit=80`),
        ])
        if (!svcRes.ok || !histRes.ok) throw new Error('API error')
        const svcData = await svcRes.json()
        const histData = await histRes.json()
        if (cancelled) return
        setInitialServices(svcData.services || [])
        setInitialHistory(histData.entries || [])
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchInitial()
    return () => { cancelled = true }
  }, [])

  return { initialServices, initialHistory, loading, error }
}
