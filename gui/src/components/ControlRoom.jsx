/**
 * ControlRoom — master layout.
 * Assembles all panels into the full spacecraft control-room viewport.
 *
 * Layout (CSS Grid):
 *   ┌──────────────────────────────────┬──────────────┐
 *   │  Header bar (full width)         │              │
 *   ├───────────────┬──────────────────┤              │
 *   │  OrbitalMap   │  Service modules │  Mission Log │
 *   │  (center)     │  (right stack)   │  (far right) │
 *   ├───────────────┴──────────────────┤              │
 *   │  LaunchSequence (bottom strip)   │              │
 *   └──────────────────────────────────┴──────────────┘
 */
import React from 'react'
import OrbitalMap from './OrbitalMap.jsx'
import ServiceModule from './ServiceModule.jsx'
import LaunchSequence from './LaunchSequence.jsx'
import MissionLog from './MissionLog.jsx'

export default function ControlRoom({
  services,
  pipelineEvents,
  logEntries,
  projectName,
  connectionStatus,
  lastUpdated,
}) {
  const connColor = connectionStatus === 'live'
    ? 'var(--green)' : connectionStatus === 'reconnecting'
    ? 'var(--amber)' : 'var(--red)'
  const connLabel = connectionStatus === 'live'
    ? 'LIVE' : connectionStatus === 'reconnecting'
    ? 'RECONNECTING' : 'OFFLINE'

  const totalNominal = services.filter(s => s.status === 'ACTIVE').length
  const systemStatus = totalNominal === services.length && services.length > 0
    ? 'ALL SYSTEMS NOMINAL'
    : totalNominal === 0 && services.length > 0
    ? 'CRITICAL — ALL OFFLINE'
    : services.length === 0
    ? 'AWAITING TELEMETRY'
    : `${totalNominal}/${services.length} NOMINAL`

  const systemColor = totalNominal === services.length && services.length > 0
    ? 'var(--green)'
    : totalNominal === 0 && services.length > 0
    ? 'var(--red)'
    : 'var(--amber)'

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'grid',
      gridTemplateRows: '52px 1fr 100px',
      gridTemplateColumns: '1fr 340px',
      gap: 0,
      background: 'var(--void)',
      overflow: 'hidden',
    }}>
      {/* ── Header bar ─────────────────────────────────── */}
      <header style={{
        gridColumn: '1 / -1',
        gridRow: '1',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 20,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(8,12,20,0.95)',
        backdropFilter: 'blur(8px)',
      }}>
        {/* Logo / title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--cyan)" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="5" fill="none" stroke="var(--cyan)" strokeWidth="1" strokeDasharray="2 3" />
            <circle cx="12" cy="12" r="2" fill="var(--cyan)" />
            <line x1="12" y1="2" x2="12" y2="22" stroke="var(--cyan)" strokeWidth="0.5" strokeOpacity="0.4" />
            <line x1="2" y1="12" x2="22" y2="12" stroke="var(--cyan)" strokeWidth="0.5" strokeOpacity="0.4" />
          </svg>
          <span style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: '0.12em',
            color: 'var(--text-primary)',
          }}>
            MISSION <span style={{ color: 'var(--cyan)' }}>CONTROL</span>
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            marginLeft: 4,
          }}>
            / ZEROPS CHALLENGE 2025
          </span>
        </div>

        {/* System status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 12px',
          borderRadius: 4,
          background: `${systemColor}10`,
          border: `1px solid ${systemColor}30`,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: systemColor,
            letterSpacing: '0.1em',
          }}>
            ◆ {systemStatus}
          </span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Project name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="label">PROJECT</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--cyan)',
            letterSpacing: '0.06em',
          }}>
            {projectName || 'mission-control'}
          </span>
        </div>

        {/* Connection status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className={`conn-dot ${connectionStatus}`} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: connColor,
            letterSpacing: '0.1em',
          }}>
            {connLabel}
          </span>
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
          }}>
            T+{new Date(lastUpdated).toLocaleTimeString('en-US', { hour12: false })}
          </span>
        )}
      </header>

      {/* ── Main area: orbital map + service modules ────── */}
      <main style={{
        gridColumn: '1',
        gridRow: '2',
        display: 'grid',
        gridTemplateColumns: '1fr 280px',
        gap: 12,
        padding: '12px 12px 12px 16px',
        overflow: 'hidden',
      }}>
        {/* Orbital map */}
        <div className="glass-bright" style={{
          borderRadius: 12,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <OrbitalMap services={services} projectName={projectName} />
          {/* Corner label */}
          <div style={{
            position: 'absolute',
            top: 10, left: 12,
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--text-muted)',
            letterSpacing: '0.15em',
          }}>
            ORBITAL TOPOLOGY
          </div>
        </div>

        {/* Service module stack */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          overflowY: 'auto',
        }}>
          <div className="label" style={{ paddingLeft: 2, marginBottom: 2 }}>
            LIFE-SUPPORT PANELS — {services.length} MODULES
          </div>
          {services.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.1em',
              animation: 'blink 1.5s ease-in-out infinite',
            }}>
              SCANNING…
            </div>
          ) : (
            services.map(svc => (
              <ServiceModule key={svc.id} service={svc} />
            ))
          )}
        </div>
      </main>

      {/* ── Bottom strip: launch sequence ──────────────── */}
      <div style={{
        gridColumn: '1',
        gridRow: '3',
        margin: '0 12px 12px 16px',
      }}>
        <div className="glass-bright" style={{ height: '100%' }}>
          <LaunchSequence pipelineEvents={pipelineEvents} />
        </div>
      </div>

      {/* ── Right panel: mission log ───────────────────── */}
      <aside style={{
        gridColumn: '2',
        gridRow: '2 / 4',
        margin: '12px 16px 12px 0',
        overflow: 'hidden',
      }}>
        <div className="glass-bright" style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <MissionLog entries={logEntries} />
        </div>
      </aside>

      {/* CRT overlay */}
      <div className="crt-overlay" />
    </div>
  )
}
