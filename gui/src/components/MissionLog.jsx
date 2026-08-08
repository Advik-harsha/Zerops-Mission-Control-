/**
 * MissionLog v2 — premium auto-scrolling flight transcript.
 * With severity-colored left border highlights, type icons, and hover effects.
 */
import React, { useEffect, useRef } from 'react'

const SEVERITY_STYLES = {
  SUCCESS: { color: 'var(--green)', bg: 'rgba(0,255,136,0.04)', icon: '●' },
  INFO:    { color: 'var(--cyan)',  bg: 'rgba(0,212,255,0.03)', icon: '◆' },
  WARN:    { color: 'var(--amber)', bg: 'rgba(255,170,0,0.04)', icon: '▲' },
  ERROR:   { color: 'var(--red)',   bg: 'rgba(255,34,68,0.05)', icon: '✕' },
}

const EVENT_LABELS = {
  DEPLOY:        'DEPLOY',
  STATUS_CHANGE: 'STATUS',
  RESTART:       'RESTART',
  SCALE:         'SCALE',
  INFO:          'INFO',
  ERROR:         'ERROR',
}

function formatTime(isoStr) {
  if (!isoStr) return '--:--:--'
  const d = new Date(isoStr)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}

export default function MissionLog({ entries = [], maxEntries = 100 }) {
  const bottomRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    if (nearBottom || entries.length < 5) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [entries.length])

  const visible = entries.slice(-maxEntries)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px 8px',
        borderBottom: '1px solid rgba(0,212,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
        background: 'rgba(0,0,0,0.2)',
      }}>
        {/* Pulsing record indicator */}
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--red)',
          boxShadow: '0 0 8px var(--red)',
          animation: 'blink 1.2s ease-in-out infinite',
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          letterSpacing: '0.2em',
          color: 'rgba(0,212,255,0.5)',
        }}>MISSION LOG</span>
        <div style={{ flex: 1 }} />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--text-muted)',
        }}>
          {entries.length} ENTRIES
        </span>
      </div>

      {/* Log body */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}
      >
        {visible.length === 0 ? (
          <div style={{
            padding: '28px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-muted)',
              letterSpacing: '0.15em',
              animation: 'blink 2s ease-in-out infinite',
            }}>AWAITING TRANSMISSIONS_</div>
          </div>
        ) : (
          visible.map((entry, i) => {
            const sty = SEVERITY_STYLES[entry.severity] || SEVERITY_STYLES.INFO
            const isLatest = i === visible.length - 1

            return (
              <div
                key={entry.id || i}
                style={{
                  display: 'flex',
                  gap: 0,
                  borderLeft: `2px solid ${isLatest ? sty.color : 'transparent'}`,
                  background: isLatest ? sty.bg : 'transparent',
                  animation: isLatest ? 'fade-in 0.3s ease-out' : 'none',
                  transition: 'background 0.5s ease',
                }}
              >
                {/* Left severity column */}
                <div style={{
                  width: 28,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  paddingTop: 5,
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: sty.color,
                    opacity: 0.8,
                  }}>{sty.icon}</span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: '4px 10px 4px 0', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                    }}>{formatTime(entry.occurred_at)}</span>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 8,
                      color: sty.color,
                      letterSpacing: '0.1em',
                      opacity: 0.8,
                      flexShrink: 0,
                    }}>{EVENT_LABELS[entry.event_type] || 'EVT'}</span>
                    {entry.service_name && (
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: 'var(--cyan)',
                        opacity: 0.8,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>[{entry.service_name}]</span>
                    )}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                  }}>
                    {entry.message}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
