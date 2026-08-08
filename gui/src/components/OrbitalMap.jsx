/**
 * OrbitalMap v2 — rich SpaceX/NASA spacecraft flight deck visualization.
 * Nodes orbit central Zerops hub with animated compass rings, coordinates,
 * particle flows, crosshairs, and live orbital mechanics telemetry.
 */
import React, { useMemo, useState, useEffect } from 'react'
import { getStatusMeta } from './StatusBadge.jsx'

const NODE_R = 28
const CENTER_X = 290
const CENTER_Y = 220
const ORBIT_RX = 205
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
  if (lower.includes('valkey') || lower.includes('redis')) return 'VK'
  if (lower.includes('go')) return 'GO'
  if (lower.includes('rust')) return 'RS'
  return (serviceType.split('@')[0] || 'SVC').substring(0, 2).toUpperCase()
}

export default function OrbitalMap({ services = [], projectName = 'mission-control' }) {
  const W = 580
  const H = 440

  const [simTime, setSimTime] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setSimTime(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Dynamic nodes
  const nodes = useMemo(() => {
    const safe = Array.isArray(services) ? services : []
    return safe.map((svc, i) => {
      const t = i / Math.max(safe.length, 1)
      const pos = ellipsePoint(t, CENTER_X, CENTER_Y, ORBIT_RX, ORBIT_RY)
      return { ...svc, ...pos, t }
    })
  }, [services])

  const safeServices = Array.isArray(services) ? services : []
  const totalActive = safeServices.filter(s => s && s.status === 'ACTIVE').length
  const totalServices = safeServices.length

  // Orbital mechanics calculations
  const altitude = 408 + Math.floor(Math.sin(simTime * 0.1) * 3)
  const velocity = (7.66 + Math.cos(simTime * 0.05) * 0.04).toFixed(2)
  const inclination = '51.64°'

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
            <stop offset="0%"   stopColor="#00d4ff" stopOpacity="0.35" />
            <stop offset="50%"  stopColor="#0d1424" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#040810" stopOpacity="1" />
          </radialGradient>
          {/* Orbit path gradient */}
          <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#00d4ff" stopOpacity="0.06" />
            <stop offset="50%"  stopColor="#00d4ff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.06" />
          </linearGradient>
          <filter id="nodeGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Background grid */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,212,255,0.035)" strokeWidth="0.5"/>
          </pattern>
        </defs>

        {/* Background grid */}
        <rect width={W} height={H} fill="url(#grid)" />

        {/* Outer compass ring */}
        <circle cx={CENTER_X} cy={CENTER_Y} r={ORBIT_RX + 15}
          fill="none" stroke="rgba(0,212,255,0.08)" strokeWidth="1" strokeDasharray="2 6"
          style={{ animation: 'spin-slow 60s linear infinite', transformOrigin: `${CENTER_X}px ${CENTER_Y}px` }}
        />

        {/* Elliptical Orbit Track */}
        <ellipse
          cx={CENTER_X} cy={CENTER_Y}
          rx={ORBIT_RX} ry={ORBIT_RY}
          fill="none"
          stroke="url(#orbitGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />

        {/* Particle flows on orbit */}
        {[0, 0.33, 0.66].map((offset, i) => (
          <ellipse
            key={i}
            cx={CENTER_X} cy={CENTER_Y}
            rx={ORBIT_RX} ry={ORBIT_RY}
            fill="none"
            stroke="rgba(0,212,255,0.7)"
            strokeWidth="2"
            strokeDasharray="10 900"
            strokeDashoffset={0}
            style={{
              animationName: 'dataStream',
              animationDuration: `${7 + i * 2}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              animationDelay: `${-i * 2.5}s`,
            }}
          />
        ))}

        {/* Spokes connecting Central Hub to each node */}
        {nodes.map(node => {
          const meta = getStatusMeta(node.status)
          return (
            <g key={`spoke-group-${node.id}`}>
              <line
                x1={CENTER_X} y1={CENTER_Y}
                x2={node.x} y2={node.y}
                stroke={meta.color}
                strokeWidth="1"
                strokeOpacity="0.25"
                strokeDasharray="3 4"
              />
            </g>
          )
        })}

        {/* Central Hub (Zerops Core) */}
        <circle cx={CENTER_X} cy={CENTER_Y} r={60} fill="url(#hubGrad)" />
        <circle
          cx={CENTER_X} cy={CENTER_Y} r={60}
          fill="none"
          stroke="rgba(0,212,255,0.35)"
          strokeWidth="1"
        />
        <circle
          cx={CENTER_X} cy={CENTER_Y} r={52}
          fill="none"
          stroke="rgba(0,212,255,0.18)"
          strokeWidth="0.6"
          strokeDasharray="4 6"
          style={{ animation: 'spin-reverse 20s linear infinite', transformOrigin: `${CENTER_X}px ${CENTER_Y}px` }}
        />

        {/* Hub Text */}
        <text x={CENTER_X} y={CENTER_Y - 16} textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="9" fill="rgba(0,212,255,0.6)" letterSpacing="0.2em">
          ZEROPS CORE
        </text>
        <text x={CENTER_X} y={CENTER_Y + 2} textAnchor="middle"
          fontFamily="'Outfit', sans-serif"
          fontSize="13" fontWeight="700" fill="#eaf5ff" letterSpacing="0.05em">
          {projectName}
        </text>
        <text x={CENTER_X} y={CENTER_Y + 18} textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="9" fill="var(--green)" letterSpacing="0.1em"
          style={{ textShadow: '0 0 8px var(--green)' }}>
          {totalActive}/{totalServices} NOMINAL
        </text>

        {/* Service Nodes */}
        {nodes.map((node, i) => {
          const meta = getStatusMeta(node.status)
          const abbrev = getTypeAbbrev(node.service_type)
          return (
            <g key={node.id || i} filter="url(#nodeGlow)">
              {/* Outer pulsing ring */}
              {node.status === 'ACTIVE' && (
                <circle
                  cx={node.x} cy={node.y} r={NODE_R + 10}
                  fill="none"
                  stroke={meta.color}
                  strokeWidth="0.8"
                  strokeOpacity="0.4"
                  style={{
                    animationName: 'pulse-ring',
                    animationDuration: `${2.4 + i * 0.3}s`,
                    animationTimingFunction: 'ease-out',
                    animationIterationCount: 'infinite',
                    transformOrigin: `${node.x}px ${node.y}px`,
                  }}
                />
              )}

              {/* Node Reticle / Crosshair */}
              <circle cx={node.x} cy={node.y} r={NODE_R + 3}
                fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth="0.5" />
              <line x1={node.x - NODE_R - 5} y1={node.y} x2={node.x - NODE_R + 2} y2={node.y} stroke="rgba(0,212,255,0.3)" strokeWidth="0.8" />
              <line x1={node.x + NODE_R - 2} y1={node.y} x2={node.x + NODE_R + 5} y2={node.y} stroke="rgba(0,212,255,0.3)" strokeWidth="0.8" />

              {/* Main Node Body */}
              <circle
                cx={node.x} cy={node.y} r={NODE_R}
                fill="rgba(6,11,18,0.92)"
                stroke={meta.color}
                strokeWidth="1.5"
              />
              <circle
                cx={node.x} cy={node.y} r={NODE_R - 4}
                fill={`${meta.color}15`}
              />

              {/* Node Text */}
              <text x={node.x} y={node.y - 5} textAnchor="middle"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="11" fontWeight="700" fill={meta.color}>
                {abbrev}
              </text>
              <text x={node.x} y={node.y + 9} textAnchor="middle"
                fontFamily="'Outfit', sans-serif"
                fontSize="9" fill="var(--text-secondary)" letterSpacing="0.05em">
                {node.name}
              </text>

              {/* Status dot */}
              <circle
                cx={node.x + NODE_R - 6}
                cy={node.y - NODE_R + 6}
                r={4}
                fill={meta.color}
                style={{ filter: `drop-shadow(0 0 6px ${meta.color})` }}
              />
            </g>
          )
        })}
      </svg>

      {/* Orbital Mechanics Overlay HUD (Top Right) */}
      <div style={{
        position: 'absolute',
        top: 12, right: 14,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 3,
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 9 }}>
          <span style={{ color: 'var(--text-muted)' }}>ALT: <span style={{ color: 'var(--cyan)' }}>{altitude} km</span></span>
          <span style={{ color: 'var(--text-muted)' }}>VEL: <span style={{ color: 'var(--green)' }}>{velocity} km/s</span></span>
          <span style={{ color: 'var(--text-muted)' }}>INC: <span style={{ color: 'var(--purple)' }}>{inclination}</span></span>
        </div>
      </div>

      {/* Particle animation CSS */}
      <style>{`
        @keyframes dataStream {
          from { stroke-dashoffset: 0; opacity: 1; }
          to   { stroke-dashoffset: -1800; opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}
