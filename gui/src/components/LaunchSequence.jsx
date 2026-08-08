/**
 * LaunchSequence — animated staged progress bar showing the active deploy pipeline.
 * Phases: BUILD → PREPARE_RUNTIME → DEPLOY → RUNNING
 * Styled as a spacecraft launch countdown sequence.
 */
import React, { useMemo } from 'react'

const PHASES = [
  { key: 'BUILD',           label: 'BUILD',   short: '01' },
  { key: 'PREPARE_RUNTIME', label: 'PREPARE', short: '02' },
  { key: 'DEPLOY',          label: 'DEPLOY',  short: '03' },
  { key: 'RUNNING',         label: 'ORBIT',   short: '04' },
]

function phaseIndex(phase = '') {
  const idx = PHASES.findIndex(p => p.key === phase.toUpperCase())
  return idx === -1 ? 0 : idx
}

function phaseColor(phaseStatus = '') {
  const s = phaseStatus.toUpperCase()
  if (s === 'DONE')    return 'var(--green)'
  if (s === 'RUNNING') return 'var(--cyan)'
  if (s === 'FAILED')  return 'var(--red)'
  if (s === 'QUEUED')  return 'var(--amber)'
  return 'var(--space-light)'
}

export default function LaunchSequence({ pipelineEvents = [] }) {
  // Get the most recent event per service, then the one currently in progress
  const activeEvent = useMemo(() => {
    // Find the most recent RUNNING event, or fallback to most recent event
    const running = pipelineEvents.find(e => e.phase_status === 'RUNNING')
    if (running) return running
    if (pipelineEvents.length > 0) return pipelineEvents[pipelineEvents.length - 1]
    return null
  }, [pipelineEvents])

  if (!activeEvent) {
    return (
      <div style={{ padding: '12px 16px' }}>
        <SectionHeader />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 48,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.1em',
        }}>
          STANDING BY — NO ACTIVE PIPELINES
        </div>
      </div>
    )
  }

  const currentPhaseIdx = phaseIndex(activeEvent.phase)
  const activePhaseStatus = activeEvent.phase_status

  return (
    <div style={{ padding: '12px 16px' }}>
      <SectionHeader serviceName={activeEvent.service_name} />

      {/* Phase track */}
      <div style={{ display: 'flex', gap: 4, marginTop: 10, alignItems: 'stretch' }}>
        {PHASES.map((ph, i) => {
          let state = 'pending'
          if (i < currentPhaseIdx) state = 'done'
          else if (i === currentPhaseIdx) state = activePhaseStatus.toLowerCase()

          const color = state === 'done'    ? 'var(--green)'
                      : state === 'running' ? 'var(--cyan)'
                      : state === 'failed'  ? 'var(--red)'
                      : state === 'queued'  ? 'var(--amber)'
                      : 'rgba(0,212,255,0.15)'

          const isCurrent = i === currentPhaseIdx

          return (
            <div key={ph.key} style={{ flex: 1, position: 'relative' }}>
              {/* Phase block */}
              <div style={{
                height: 36,
                borderRadius: 4,
                background: state === 'pending'
                  ? 'rgba(0,0,0,0.3)'
                  : `${color}18`,
                border: `1px solid ${isCurrent ? color : (state === 'done' ? 'rgba(0,255,136,0.3)' : 'rgba(0,212,255,0.1)')}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s ease',
                boxShadow: isCurrent ? `0 0 12px ${color}40` : 'none',
              }}>
                {/* Running fill animation */}
                {state === 'running' && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(90deg, transparent, ${color}20, transparent)`,
                    animation: 'pipeline-fill 1.5s ease-in-out infinite alternate',
                  }} />
                )}
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: state === 'pending' ? 'rgba(0,212,255,0.3)' : color,
                  letterSpacing: '0.1em',
                  position: 'relative',
                }}>
                  {ph.short}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 600,
                  color: state === 'pending' ? 'rgba(0,212,255,0.25)' : color,
                  letterSpacing: '0.08em',
                  position: 'relative',
                }}>
                  {ph.label}
                </span>
              </div>

              {/* Arrow connector */}
              {i < PHASES.length - 1 && (
                <div style={{
                  position: 'absolute',
                  right: -5, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(0,212,255,0.3)',
                  fontSize: 10,
                  zIndex: 1,
                }}>▸</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Status line */}
      <div style={{
        marginTop: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-muted)',
        }}>
          VERSION: <span style={{ color: 'var(--cyan)' }}>
            {activeEvent.version_id?.substring(0, 8)}…
          </span>
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: phaseColor(activePhaseStatus),
          letterSpacing: '0.1em',
        }}>
          ◆ {activePhaseStatus}
        </span>
      </div>
    </div>
  )
}

function SectionHeader({ serviceName }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          display: 'inline-block',
          width: 16, height: 16,
          borderRadius: 3,
          background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.15em',
          color: 'var(--text-muted)',
        }}>
          LAUNCH SEQUENCE
        </span>
      </div>
      {serviceName && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--cyan)',
          letterSpacing: '0.08em',
        }}>
          {serviceName.toUpperCase()}
        </span>
      )}
    </div>
  )
}
