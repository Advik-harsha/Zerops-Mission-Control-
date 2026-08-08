/**
 * StatusBadge — green/amber/red ring + label indicator.
 * Used on both ServiceModule cards and OrbitalMap nodes.
 */
import React from 'react'

const STATUS_MAP = {
  ACTIVE:        { color: 'var(--green)', label: 'NOMINAL',   glow: 'var(--green-glow)' },
  STOPPED:       { color: 'var(--red)',   label: 'OFFLINE',   glow: 'var(--red-glow)' },
  BUILDING:      { color: 'var(--amber)', label: 'BUILDING',  glow: 'var(--amber-glow)' },
  DEPLOYING:     { color: 'var(--amber)', label: 'DEPLOYING', glow: 'var(--amber-glow)' },
  ERROR:         { color: 'var(--red)',   label: 'ERROR',     glow: 'var(--red-glow)' },
  FAILED:        { color: 'var(--red)',   label: 'FAILED',    glow: 'var(--red-glow)' },
  UNKNOWN:       { color: 'var(--amber)', label: 'UNKNOWN',   glow: 'var(--amber-glow)' },
  PREPARE_RUNTIME: { color: 'var(--amber)', label: 'PREP', glow: 'var(--amber-glow)' },
}

export function getStatusMeta(status = 'UNKNOWN') {
  return STATUS_MAP[status.toUpperCase()] || STATUS_MAP.UNKNOWN
}

export default function StatusBadge({ status = 'UNKNOWN', size = 10, showLabel = true }) {
  const meta = getStatusMeta(status)

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {/* Pulsing ring */}
      <span style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        {/* Pulse ring */}
        <span style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `1.5px solid ${meta.color}`,
          animation: status === 'ACTIVE' ? 'pulse-ring 2.5s ease-out infinite' : 'none',
          opacity: 0.7,
        }} />
        {/* Solid dot */}
        <span style={{
          position: 'absolute',
          inset: '20%',
          borderRadius: '50%',
          background: meta.color,
          boxShadow: `0 0 ${size}px ${meta.color}`,
        }} />
      </span>
      {showLabel && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.1em',
          color: meta.color,
          textShadow: `0 0 8px ${meta.color}`,
        }}>
          {meta.label}
        </span>
      )}
    </span>
  )
}
