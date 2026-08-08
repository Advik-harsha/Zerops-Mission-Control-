/**
 * ServiceModule — glassmorphic "life-support panel" card per Zerops service.
 * Shows: service name, type badge, health status, container count, last event time.
 */
import React, { useState, useEffect } from 'react'
import StatusBadge, { getStatusMeta } from './StatusBadge.jsx'

const TYPE_ICONS = {
  'postgresql': '🗄',
  'python':     '🐍',
  'nodejs':     '💚',
  'static':     '⚡',
  'go':         '🔵',
  'rust':       '🦀',
  'php':        '🐘',
  'dotnet':     '💠',
  'default':    '⬡',
}

function getTypeIcon(serviceType = '') {
  const lower = serviceType.toLowerCase()
  for (const [key, icon] of Object.entries(TYPE_ICONS)) {
    if (lower.includes(key)) return icon
  }
  return TYPE_ICONS.default
}

function timeAgo(isoStr) {
  if (!isoStr) return '—'
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000)
  if (diff < 5)   return 'just now'
  if (diff < 60)  return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function ServiceModule({ service, isNew = false }) {
  const [ticking, setTicking] = useState(0)

  // Update time-ago display every 10 seconds
  useEffect(() => {
    const t = setInterval(() => setTicking(n => n + 1), 10000)
    return () => clearInterval(t)
  }, [])

  const meta = getStatusMeta(service.status)
  const icon = getTypeIcon(service.service_type)

  return (
    <div
      className="glass-bright"
      style={{
        padding: '14px 16px',
        position: 'relative',
        overflow: 'hidden',
        animation: isNew ? 'slide-in-right 0.4s ease-out' : 'none',
        transition: 'box-shadow 0.4s ease, border-color 0.4s ease',
        boxShadow: `0 0 20px ${meta.glow || 'transparent'}, inset 0 1px 0 rgba(0,212,255,0.1)`,
        borderColor: meta.color === 'var(--green)' ? 'rgba(0,255,136,0.25)' :
                     meta.color === 'var(--red)'   ? 'rgba(255,51,85,0.3)' :
                     meta.color === 'var(--amber)' ? 'rgba(255,170,0,0.25)' :
                     'rgba(0,212,255,0.2)',
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 2,
        background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)`,
        opacity: 0.7,
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {service.name}
            </div>
            <div className="label" style={{ marginTop: 2, fontSize: 9 }}>
              {service.service_type}
            </div>
          </div>
        </div>
        <StatusBadge status={service.status} size={9} />
      </div>

      {/* Metrics grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px 12px',
        marginTop: 4,
      }}>
        <Metric label="CONTAINERS" value={service.container_count ?? '—'} />
        <Metric label="UPDATED" value={timeAgo(service.last_updated)} />
      </div>

      {/* Corner decoration */}
      <div style={{
        position: 'absolute',
        bottom: 8, right: 8,
        width: 18, height: 18,
        borderRight: `1px solid ${meta.color}`,
        borderBottom: `1px solid ${meta.color}`,
        opacity: 0.4,
      }} />
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 2 }}>{label}</div>
      <div className="mono-val" style={{ fontSize: 13 }}>{value}</div>
    </div>
  )
}
