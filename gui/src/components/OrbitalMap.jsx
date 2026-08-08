/**
 * OrbitalMap — animated SVG showing services as nodes in elliptical orbit
 * around a central Zerops hub. Animated particles flow along orbital paths.
 *
 * Design decision: uses pure SVG + CSS animations — no D3 dependency.
 * Particle motion uses stroke-dashoffset animation.
 */
import React, { useMemo, useRef, useEffect } from 'react'
import { getStatusMeta } from './StatusBadge.jsx'

const NODE_R = 28
const CENTER_X = 280
const CENTER_Y = 220
const ORBIT_RX = 195
const ORBIT_RY = 145

function ellipsePoint(t, cx, cy, rx, ry) {
  const rad = (t * Math.PI * 2)
  return {
    x: cx + rx * Math.cos(rad),
    y: cy + ry * Math.sin(rad),
  }
}

function getTypeAbbrev(serviceType = '') {
  const lower = serviceType.toLowerCase()
  if (lower.includes('postgresql') || lower.includes('postgres')) return 'PG'
  if (lower.includes('python')) return 'PY'
  if (lower.includes('nodejs') || lower.includes('node')) return 'JS'
  if (lower.includes('static')) return 'SV'
  if (lower.includes('go')) return 'GO'
  if (lower.includes('rust')) return 'RS'
  return (serviceType.split('@')[0] || 'SVC').substring(0, 2).toUpperCase()
}

// Generate an SVG ellipse path string
function ellipsePath(cx, cy, rx, ry) {
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`
}

export default function OrbitalMap({ services = [], projectName = 'mission-control' }) {
  const W = 560
  const H = 440

  // Spread services evenly around the ellipse
  const nodes = useMemo(() => {
    return services.map((svc, i) => {
      const t = i / Math.max(services.length, 1)
      const pos = ellipsePoint(t, CENTER_X, CENTER_Y, ORBIT_RX, ORBIT_RY)
      return { ...svc, ...pos, t }
    })
  }, [services])

  const totalActive = services.filter(s => s.status === 'ACTIVE').length
  const totalServices = services.length

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
        aria-label="Mission Control orbital map"
      >
        <defs>
          {/* Radial gradient for central hub */}
          <radialGradient id="hubGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#00d4ff" stopOpacity="0.3" />
            <stop offset="60%"  stopColor="#0d1424" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#040810" stopOpacity="1" />
          </radialGradient>
          {/* Orbit path gradient */}
          <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#00d4ff" stopOpacity="0.04" />
            <stop offset="50%"  stopColor="#00d4ff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.04" />
          </linearGradient>
          {/* Particle dash */}
          <filter id="nodeGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Grid pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,212,255,0.04)" strokeWidth="0.5"/>
          </pattern>
        </defs>

        {/* Background grid */}
        <rect width={W} height={H} fill="url(#grid)" />

        {/* Orbital ring */}
        <ellipse
          cx={CENTER_X} cy={CENTER_Y}
          rx={ORBIT_RX} ry={ORBIT_RY}
          fill="none"
          stroke="url(#orbitGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />

        {/* Animated particles on orbit */}
        {[0, 0.33, 0.66].map((offset, i) => (
          <ellipse
            key={i}
            cx={CENTER_X} cy={CENTER_Y}
            rx={ORBIT_RX} ry={ORBIT_RY}
            fill="none"
            stroke="rgba(0,212,255,0.6)"
            strokeWidth="2"
            strokeDasharray="8 1000"
            strokeDashoffset={0}
            style={{
              animationName: 'orbitParticle',
              animationDuration: `${8 + i * 2}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              animationDelay: `${-i * 2.7}s`,
            }}
          />
        ))}

        {/* Spokes from hub to each service node */}
        {nodes.map(node => {
          const meta = getStatusMeta(node.status)
          return (
            <line
              key={`spoke-${node.id}`}
              x1={CENTER_X} y1={CENTER_Y}
              x2={node.x} y2={node.y}
              stroke={meta.color}
              strokeWidth="0.8"
              strokeOpacity="0.25"
              strokeDasharray="4 4"
            />
          )
        })}

        {/* Central hub */}
        <circle cx={CENTER_X} cy={CENTER_Y} r={56} fill="url(#hubGrad)" />
        <circle
          cx={CENTER_X} cy={CENTER_Y} r={56}
          fill="none"
          stroke="rgba(0,212,255,0.3)"
          strokeWidth="1"
        />
        <circle
          cx={CENTER_X} cy={CENTER_Y} r={48}
          fill="none"
          stroke="rgba(0,212,255,0.15)"
          strokeWidth="0.5"
          strokeDasharray="3 5"
        />

        {/* Hub text */}
        <text x={CENTER_X} y={CENTER_Y - 14} textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="9" fill="rgba(0,212,255,0.5)" letterSpacing="0.15em">
          ZEROPS
        </text>
        <text x={CENTER_X} y={CENTER_Y + 2} textAnchor="middle"
          fontFamily="'Outfit', sans-serif"
          fontSize="12" fontWeight="600" fill="#e8f4ff">
          {projectName}
        </text>
        <text x={CENTER_X} y={CENTER_Y + 18} textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="9" fill="rgba(0,255,136,0.7)" letterSpacing="0.1em">
          {totalActive}/{totalServices} NOMINAL
        </text>

        {/* Service nodes */}
        {nodes.map((node, i) => {
          const meta = getStatusMeta(node.status)
          const abbrev = getTypeAbbrev(node.service_type)
          return (
            <g key={node.id} filter="url(#nodeGlow)">
              {/* Outer glow ring */}
              <circle
                cx={node.x} cy={node.y} r={NODE_R + 8}
                fill="none"
                stroke={meta.color}
                strokeWidth="0.6"
                strokeOpacity="0.3"
                style={node.status === 'ACTIVE' ? {
                  animationName: 'pulse-ring',
                  animationDuration: `${2 + i * 0.4}s`,
                  animationTimingFunction: 'ease-out',
                  animationIterationCount: 'infinite',
                  transformOrigin: `${node.x}px ${node.y}px`,
                } : {}}
              />
              {/* Main node circle */}
              <circle
                cx={node.x} cy={node.y} r={NODE_R}
                fill={`rgba(13,20,36,0.9)`}
                stroke={meta.color}
                strokeWidth="1.5"
              />
              {/* Inner fill */}
              <circle
                cx={node.x} cy={node.y} r={NODE_R - 4}
                fill={`${meta.color}12`}
              />
              {/* Type abbrev */}
              <text x={node.x} y={node.y - 5} textAnchor="middle"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="11" fontWeight="600" fill={meta.color}>
                {abbrev}
              </text>
              {/* Service name */}
              <text x={node.x} y={node.y + 9} textAnchor="middle"
                fontFamily="'Outfit', sans-serif"
                fontSize="9" fill="var(--text-secondary)" letterSpacing="0.05em">
                {node.name}
              </text>

              {/* Status dot */}
              <circle
                cx={node.x + NODE_R - 5}
                cy={node.y - NODE_R + 5}
                r={4}
                fill={meta.color}
              />
            </g>
          )
        })}

        {/* Decorative corner brackets */}
        {[
          [8, 8], [W - 8, 8], [8, H - 8], [W - 8, H - 8]
        ].map(([cx, cy], i) => {
          const sx = i % 2 === 0 ? 1 : -1
          const sy = i < 2 ? 1 : -1
          return (
            <g key={i} stroke="rgba(0,212,255,0.3)" strokeWidth="1" fill="none">
              <line x1={cx} y1={cy} x2={cx + sx * 14} y2={cy} />
              <line x1={cx} y1={cy} x2={cx} y2={cy + sy * 14} />
            </g>
          )
        })}
      </svg>

      {/* Orbit particle CSS (injected inline because it references SVG coordinates) */}
      <style>{`
        @keyframes orbitParticle {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -2000; }
        }
      `}</style>
    </div>
  )
}
