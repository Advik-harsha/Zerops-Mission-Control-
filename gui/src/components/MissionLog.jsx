/**
 * MissionLog — auto-scrolling flight-control transcript.
 * Displays the last N mission log entries styled as VT100 terminal output.
 */
import React, { useEffect, useRef } from 'react'

const SEVERITY_COLORS = {
  SUCCESS: 'var(--green)',
  INFO:    'var(--cyan)',
  WARN:    'var(--amber)',
  ERROR:   'var(--red)',
}

const EVENT_PREFIXES = {
  DEPLOY:        '🚀 DEPLOY',
  STATUS_CHANGE: '⚡ STATUS',
  RESTART:       '🔄 RESTART',
  SCALE:         '⬆ SCALE',
  INFO:          '● INFO',
  ERROR:         '✕ ERROR',
}

function formatTime(isoStr) {
  if (!isoStr) return '--:--:--'
  const d = new Date(isoStr)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
}

export default function MissionLog({ entries = [], maxEntries = 80 }) {
  const bottomRef = useRef(null)
  const containerRef = useRef(null)

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    // Only auto-scroll if user is already near the bottom
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (isNearBottom || entries.length < 5) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [entries.length])

  const visible = entries.slice(-maxEntries)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.15em',
          color: 'var(--text-muted)',
        }}>MISSION LOG</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--cyan)',
          marginLeft: 'auto',
        }}>
          {entries.length} ENTRIES
        </span>
      </div>

      {/* Log body */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '6px 0',
        }}
      >
        {visible.length === 0 ? (
          <div style={{
            padding: '20px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            animation: 'blink 1.5s ease-in-out infinite',
          }}>
            AWAITING TRANSMISSIONS_
          </div>
        ) : (
          visible.map((entry, i) => {
            const color = SEVERITY_COLORS[entry.severity] || 'var(--text-secondary)'
            const prefix = EVENT_PREFIXES[entry.event_type] || '● EVT'
            const isNew = i === visible.length - 1

            return (
              <div
                key={entry.id || i}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '3px 14px',
                  borderLeft: `2px solid ${isNew ? color : 'transparent'}`,
                  transition: 'border-color 0.5s ease',
                  animation: isNew ? 'fade-in 0.3s ease-out' : 'none',
                }}
              >
                {/* Timestamp */}
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                  paddingTop: 1,
                }}>
                  {formatTime(entry.occurred_at)}
                </span>

                {/* Type prefix */}
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color,
                  flexShrink: 0,
                  paddingTop: 1,
                  minWidth: 72,
                }}>
                  {prefix}
                </span>

                {/* Message */}
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                }}>
                  {entry.service_name && (
                    <span style={{ color: 'var(--cyan)', marginRight: 6 }}>
                      [{entry.service_name}]
                    </span>
                  )}
                  {entry.message}
                </span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
