/**
 * ServiceModule v2 — premium glassmorphic life-support panel.
 * Animated status ring, resource meters, type-specific colors.
 */
import React, { useState, useEffect } from 'react'
import StatusBadge, { getStatusMeta } from './StatusBadge.jsx'

const TYPE_CONFIG = {
  'postgresql': { icon: '🗄', label: 'DATABASE',  accent: '#4488ff' },
  'python':     { icon: '🐍', label: 'RUNTIME',   accent: '#00d4ff' },
  'nodejs':     { icon: '⬡',  label: 'RUNTIME',   accent: '#00ff88' },
  'static':     { icon: '⚡', label: 'STATIC CDN', accent: '#8b5cf6' },
  'go':         { icon: '◉',  label: 'RUNTIME',   accent: '#00bcd4' },
  'rust':       { icon: '⬢',  label: 'RUNTIME',   accent: '#ff6b35' },
  'default':    { icon: '⬡',  label: 'SERVICE',   accent: '#00d4ff' },
}

function getTypeConfig(serviceType = '') {
  const lower = serviceType.toLowerCase()
  for (const [key, cfg] of Object.entries(TYPE_CONFIG)) {
    if (lower.includes(key)) return cfg
  }
  return TYPE_CONFIG.default
}

function timeAgo(isoStr) {
  if (!isoStr) return '—'
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000)
  if (diff < 5)    return 'just now'
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function ServiceModule({ service, isNew = false }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 10000)
    return () => clearInterval(t)
  }, [])

  const meta = getStatusMeta(service.status)
  const typeCfg = getTypeConfig(service.service_type)
  const isActive = service.status === 'ACTIVE'
  const isError  = ['ERROR', 'FAILED', 'STOPPED'].includes(service.status)

  const borderColor = isActive ? 'rgba(0,255,136,0.2)' :
                      isError  ? 'rgba(255,34,68,0.25)' :
                                 'rgba(255,170,0,0.2)'

  const bgGlow = isActive ? 'rgba(0,255,136,0.03)' :
                 isError  ? 'rgba(255,34,68,0.04)' :
                            'rgba(255,170,0,0.03)'

  return (
    <div
      style={{
        position: 'relative',
        padding: '12px 14px 10px',
        borderRadius: 10,
        border: `1px solid ${borderColor}`,
        background: `linear-gradient(135deg, rgba(10,18,32,0.95), rgba(15,28,53,0.9))`,
        backdropFilter: 'blur(16px)',
        overflow: 'hidden',
        animation: isNew ? 'slide-in-right 0.4s ease-out' : 'none',
        transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
        boxShadow: `0 0 20px ${bgGlow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* Top status bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 2,
        background: `linear-gradient(90deg, transparent 0%, ${meta.color} 40%, ${typeCfg.accent} 60%, transparent 100%)`,
        opacity: isActive ? 0.8 : 0.4,
      }} />

      {/* Main content */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Icon with status ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 38, height: 38,
            borderRadius: 8,
            background: `${typeCfg.accent}12`,
            border: `1px solid ${typeCfg.accent}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}>
            {typeCfg.icon}
          </div>
          {/* Status dot */}
          <div style={{
            position: 'absolute',
            bottom: -2, right: -2,
            width: 10, height: 10,
            borderRadius: '50%',
            background: meta.color,
            border: '1.5px solid rgba(2,6,9,0.9)',
            boxShadow: `0 0 6px ${meta.color}`,
            animation: isActive ? 'blink 3s ease-in-out infinite' : 'none',
          }} />
        </div>

        {/* Service info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 3 }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '0.06em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {service.name}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: meta.color,
              letterSpacing: '0.1em',
              textShadow: `0 0 8px ${meta.color}`,
              flexShrink: 0,
              fontWeight: 600,
            }}>
              {service.status}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: typeCfg.accent,
              opacity: 0.7,
              letterSpacing: '0.06em',
            }}>
              {service.service_type}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
            }}>
              {timeAgo(service.last_updated)}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '6px 10px',
        marginTop: 10,
        paddingTop: 8,
        borderTop: '1px solid rgba(0,212,255,0.07)',
      }}>
        <Metric label="CONTAINERS" value={service.container_count ?? '—'} />
        <Metric label="HEALTH" value={isActive ? '100%' : isError ? 'OFFLINE' : 'STANDBY'} color={meta.color} />
      </div>

      {/* Animated running indicator */}
      {isActive && (
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)`,
          opacity: 0.5,
          animation: 'header-scan 3s ease-in-out infinite',
        }} />
      )}
    </div>
  )
}

function Metric({ label, value, color }) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 2 }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        fontWeight: 600,
        color: color || 'var(--cyan)',
        textShadow: `0 0 8px ${color || 'var(--cyan)'}80`,
      }}>{value}</div>
    </div>
  )
}
