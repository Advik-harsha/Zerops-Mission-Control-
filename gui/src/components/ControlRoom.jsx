/**
 * ControlRoom — master layout v2 (upgraded).
 * Full-viewport spacecraft control room with animated starfield background.
 */
import React, { useState, useEffect } from 'react'
import OrbitalMap from './OrbitalMap.jsx'
import ServiceModule from './ServiceModule.jsx'
import LaunchSequence from './LaunchSequence.jsx'
import MissionLog from './MissionLog.jsx'
import StarfieldCanvas from './StarfieldCanvas.jsx'
import MissionClock from './MissionClock.jsx'

export default function ControlRoom({
  services = [],
  pipelineEvents = [],
  logEntries = [],
  projectName = 'mission-control',
  connectionStatus = 'connecting',
  lastUpdated = null,
}) {
  const [scanLine, setScanLine] = useState(false)

  const safeServices = Array.isArray(services) ? services : []
  const safePipeline = Array.isArray(pipelineEvents) ? pipelineEvents : []
  const safeLogs = Array.isArray(logEntries) ? logEntries : []

  // Periodic header scan-line flash
  useEffect(() => {
    const t = setInterval(() => {
      setScanLine(true)
      setTimeout(() => setScanLine(false), 800)
    }, 8000)
    return () => clearInterval(t)
  }, [])

  const connColor =
    connectionStatus === 'live' ? 'var(--green)' :
    connectionStatus === 'reconnecting' ? 'var(--amber)' : 'var(--red)'

  const connLabel =
    connectionStatus === 'live' ? 'TELEMETRY LIVE' :
    connectionStatus === 'reconnecting' ? 'RECONNECTING' : 'SIGNAL LOST'

  const totalNominal = safeServices.filter(s => s && s.status === 'ACTIVE').length
  const systemStatus =
    safeServices.length === 0 ? 'AWAITING TELEMETRY' :
    totalNominal === safeServices.length ? 'ALL SYSTEMS NOMINAL' :
    totalNominal === 0 ? 'CRITICAL — ALL OFFLINE' :
    `${totalNominal}/${safeServices.length} NOMINAL`

  const systemColor =
    safeServices.length === 0 ? 'var(--amber)' :
    totalNominal === safeServices.length ? 'var(--green)' :
    totalNominal === 0 ? 'var(--red)' : 'var(--amber)'

  return (
    <>
      {/* Animated starfield */}
      <StarfieldCanvas />

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100vw',
        height: '100vh',
        display: 'grid',
        gridTemplateRows: '58px 1fr 108px',
        gridTemplateColumns: '1fr 350px',
        gap: 0,
        overflow: 'hidden',
      }}>

        {/* ── Header bar ─────────────────────────────────── */}
        <header style={{
          gridColumn: '1 / -1',
          gridRow: '1',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 16,
          borderBottom: '1px solid var(--border)',
          background: 'rgba(2,6,9,0.92)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Header scan-line animation */}
          {scanLine && (
            <div style={{
              position: 'absolute',
              top: 0, bottom: 0,
              width: '40%',
              background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.06), transparent)',
              animation: 'header-scan 0.8s ease-out forwards',
              pointerEvents: 'none',
            }} />
          )}

          {/* Top accent line */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 1,
            background: 'linear-gradient(90deg, transparent 0%, var(--cyan) 30%, var(--purple) 70%, transparent 100%)',
            opacity: 0.6,
          }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {/* Animated radar icon */}
            <div style={{ position: 'relative', width: 28, height: 28 }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ position: 'absolute' }}>
                <circle cx="14" cy="14" r="12" stroke="rgba(0,212,255,0.2)" strokeWidth="1" />
                <circle cx="14" cy="14" r="7" stroke="rgba(0,212,255,0.15)" strokeWidth="0.5" strokeDasharray="2 3" style={{ animation: 'spin-slow 12s linear infinite', transformOrigin: '14px 14px' }} />
                <circle cx="14" cy="14" r="2.5" fill="var(--cyan)" style={{ filter: 'drop-shadow(0 0 4px var(--cyan))' }} />
                {/* Sweep arm */}
                <line x1="14" y1="14" x2="14" y2="3" stroke="var(--cyan)" strokeWidth="1.5" strokeOpacity="0.8"
                  style={{ animation: 'spin-slow 3s linear infinite', transformOrigin: '14px 14px' }} />
              </svg>
            </div>

            <div>
              <div style={{
                fontFamily: 'var(--font-ui)',
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: '0.15em',
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}>
                MISSION <span style={{
                  color: 'var(--cyan)',
                  textShadow: '0 0 16px var(--cyan)',
                }}>CONTROL</span>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                color: 'var(--text-muted)',
                letterSpacing: '0.2em',
                marginTop: 2,
              }}>
                ZEROPS CHALLENGE 2025
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: 'var(--border)', flexShrink: 0 }} />

          {/* System status badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '5px 14px',
            borderRadius: 4,
            background: `${systemColor === 'var(--green)'
              ? 'rgba(0,255,136,0.06)'
              : systemColor === 'var(--red)'
              ? 'rgba(255,34,68,0.06)'
              : 'rgba(255,170,0,0.06)'}`,
            border: `1px solid ${systemColor === 'var(--green)'
              ? 'rgba(0,255,136,0.2)'
              : systemColor === 'var(--red)'
              ? 'rgba(255,34,68,0.25)'
              : 'rgba(255,170,0,0.2)'}`,
          }}>
            <div style={{
              width: 5, height: 5,
              borderRadius: '50%',
              background: systemColor,
              boxShadow: `0 0 8px ${systemColor}`,
              animation: totalNominal === services.length && services.length > 0
                ? 'blink 2.5s ease-in-out infinite'
                : 'none',
            }} />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: systemColor,
              letterSpacing: '0.12em',
              textShadow: `0 0 8px ${systemColor}`,
              fontWeight: 600,
            }}>
              {systemStatus}
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Project */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span className="label">PROJECT</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--cyan)',
              letterSpacing: '0.06em',
              textShadow: '0 0 10px var(--cyan)',
            }}>
              {projectName || 'mission-control'}
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: 'var(--border)', flexShrink: 0 }} />

          {/* Connection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
            <span className={`conn-dot ${connectionStatus}`} />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: connColor,
              letterSpacing: '0.1em',
              textShadow: `0 0 8px ${connColor}`,
            }}>
              {connLabel}
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: 'var(--border)', flexShrink: 0 }} />

          {/* Mission clock */}
          <MissionClock missionStarted={lastUpdated} />
        </header>

        {/* ── Main area ───────────────────────────────────── */}
        <main style={{
          gridColumn: '1',
          gridRow: '2',
          display: 'grid',
          gridTemplateColumns: '1fr 285px',
          gap: 10,
          padding: '10px 10px 10px 14px',
          overflow: 'hidden',
        }}>
          {/* Orbital map */}
          <div style={{
            position: 'relative',
            borderRadius: 14,
            overflow: 'hidden',
            border: '1px solid var(--border-bright)',
            background: 'rgba(2,6,9,0.7)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 0 40px rgba(0,212,255,0.04), inset 0 0 60px rgba(0,0,0,0.4)',
          }}>
            <OrbitalMap services={services} projectName={projectName} />
            {/* Section label */}
            <div style={{
              position: 'absolute',
              top: 12, left: 14,
              fontFamily: 'var(--font-mono)',
              fontSize: 8,
              color: 'rgba(0,212,255,0.4)',
              letterSpacing: '0.2em',
            }}>ORBITAL TOPOLOGY</div>
            {/* Corner brackets */}
            {[
              { top: 6, left: 6, borderTop: true, borderLeft: true },
              { top: 6, right: 6, borderTop: true, borderRight: true },
              { bottom: 6, left: 6, borderBottom: true, borderLeft: true },
              { bottom: 6, right: 6, borderBottom: true, borderRight: true },
            ].map((b, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: 12, height: 12,
                ...b,
                borderTopWidth: b.borderTop ? 1 : 0,
                borderLeftWidth: b.borderLeft ? 1 : 0,
                borderRightWidth: b.borderRight ? 1 : 0,
                borderBottomWidth: b.borderBottom ? 1 : 0,
                borderStyle: 'solid',
                borderColor: 'rgba(0,212,255,0.3)',
              }} />
            ))}
          </div>

          {/* Service module stack */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            overflowY: 'auto',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: 2,
              marginBottom: 2,
            }}>
              <span className="label">LIFE-SUPPORT SYSTEMS</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--cyan)',
                opacity: 0.6,
              }}>{safeServices.length} MODULES</span>
            </div>

            {safeServices.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                color: 'var(--text-muted)',
              }}>
                {/* Spinner */}
                <div style={{
                  width: 28, height: 28,
                  border: '2px solid rgba(0,212,255,0.1)',
                  borderTop: '2px solid var(--cyan)',
                  borderRadius: '50%',
                  animation: 'spin-slow 1.2s linear infinite',
                }} />
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  animation: 'blink 1.5s ease-in-out infinite',
                }}>SCANNING…</span>
              </div>
            ) : (
              safeServices.map(svc => (
                <ServiceModule key={svc.id || svc.name} service={svc} />
              ))
            )}
          </div>
        </main>

        {/* ── Bottom strip: launch sequence ─────────────── */}
        <div style={{
          gridColumn: '1',
          gridRow: '3',
          margin: '0 10px 12px 14px',
          borderRadius: 14,
          overflow: 'hidden',
          border: '1px solid var(--border-bright)',
          background: 'rgba(2,6,9,0.88)',
          backdropFilter: 'blur(20px)',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3)',
        }}>
          <LaunchSequence pipelineEvents={safePipeline} />
        </div>

        {/* ── Right panel: mission log ───────────────────── */}
        <aside style={{
          gridColumn: '2',
          gridRow: '2 / 4',
          margin: '10px 14px 12px 0',
          borderRadius: 14,
          overflow: 'hidden',
          border: '1px solid var(--border-bright)',
          background: 'rgba(2,6,9,0.9)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 30px rgba(0,0,0,0.4)',
        }}>
          <MissionLog entries={safeLogs} />
        </aside>

        {/* CRT overlay */}
        <div className="crt-overlay" />
      </div>
    </>
  )
}
