/**
 * Helper to dynamically resolve API and WS URLs on Zerops or local dev.
 */
export function getApiUrl() {
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl && !envUrl.includes('${')) {
    return envUrl
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('zerops.app')) {
    // Convert e.g. gui-2b3d.prg1.zerops.app or gui-2b3d-80.prg1.zerops.app
    // into api-2b3d-8000.prg1.zerops.app
    const parts = window.location.hostname.split('.')
    const firstPart = parts[0].replace(/^gui-/, 'api-').replace(/-80$/, '') + '-8000'
    parts[0] = firstPart
    return `https://${parts.join('.')}`
  }
  return 'http://localhost:8000'
}

export function getWsUrl() {
  const envUrl = import.meta.env.VITE_WS_URL
  if (envUrl && !envUrl.includes('${')) {
    return envUrl
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('zerops.app')) {
    const parts = window.location.hostname.split('.')
    const firstPart = parts[0].replace(/^gui-/, 'api-').replace(/-80$/, '') + '-8000'
    parts[0] = firstPart
    return `wss://${parts.join('.')}/ws`
  }
  return 'ws://localhost:8000/ws'
}
