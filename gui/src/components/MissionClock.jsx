/**
 * MissionClock — live UTC clock with mission elapsed time indicator.
 * Styled as HH:MM:SS UTC with a second-level tick animation.
 */
import React, { useState, useEffect } from 'react'

export default function MissionClock({ missionStarted }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const hh = String(now.getUTCHours()).padStart(2, '0')
  const mm = String(now.getUTCMinutes()).padStart(2, '0')
  const ss = String(now.getUTCSeconds()).padStart(2, '0')

  // Mission elapsed time
  let elapsed = ''
  if (missionStarted) {
    const diff = Math.floor((now - new Date(missionStarted)) / 1000)
    const eh = Math.floor(diff / 3600)
    const em = Math.floor((diff % 3600) / 60)
    const es = diff % 60
    elapsed = `T+${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}:${String(es).padStart(2,'0')}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 16,
        fontWeight: 600,
        color: 'var(--cyan)',
        letterSpacing: '0.08em',
        textShadow: '0 0 12px var(--cyan)',
      }}>
        {hh}
        <span style={{ opacity: 0.5, animation: 'blink 1s step-end infinite' }}>:</span>
        {mm}
        <span style={{ opacity: 0.5, animation: 'blink 1s step-end infinite' }}>:</span>
        {ss}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--text-muted)',
          marginLeft: 4,
          letterSpacing: '0.1em',
        }}>UTC</span>
      </div>
      {elapsed && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--green)',
          letterSpacing: '0.1em',
          textShadow: '0 0 8px var(--green)',
        }}>
          {elapsed}
        </div>
      )}
    </div>
  )
}
