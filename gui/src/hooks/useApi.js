/**
 * useApi — fetch state from REST API on mount and retry every 5s as a fallback.
 */
import { useState, useEffect } from 'react'
import { getApiUrl } from './config.js'

export function useApi() {
  const [initialServices, setInitialServices] = useState([])
  const [initialHistory, setInitialHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    let timer = null

    async function fetchState() {
      const apiUrl = getApiUrl()
      try {
        const [svcRes, histRes] = await Promise.all([
          fetch(`${apiUrl}/api/services`),
          fetch(`${apiUrl}/api/history?limit=80`),
        ])
        if (!svcRes.ok || !histRes.ok) throw new Error('REST API unreachable')
        const svcData = await svcRes.json()
        const histData = await histRes.json()
        if (cancelled) return
        if (Array.isArray(svcData.services) && svcData.services.length > 0) {
          setInitialServices(svcData.services)
        }
        if (Array.isArray(histData.entries) && histData.entries.length > 0) {
          setInitialHistory(histData.entries)
        }
        setError(null)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchState()
    // Continuous REST fallback every 5s
    timer = setInterval(fetchState, 5000)

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
    }
  }, [])

  return { initialServices, initialHistory, loading, error }
}
