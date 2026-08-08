/**
 * LaunchSequence v2 — interactive spacecraft launch pipeline bar.
 * Tracks live Zerops deploy pipelines AND includes an interactive
 * simulation mode for hackathon judges to trigger on demand.
 */
import React, { useMemo, useState, useEffect } from 'react'

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

export default function LaunchSequence({ pipelineEvents = [] }) {
  const [simStep, setSimStep] = useState(null) // null | 0 | 1 | 2 | 3
  const [simService, setSimService] = useState('api')

  // Auto-advance simulated launch
  useEffect(() => {
    if (simStep === null) return
    if (simStep >= 3) {
      const t = setTimeout(() => setSimStep(null), 4000)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setSimStep(s => s + 1), 3000)
    return () => clearTimeout(t)
  }, [simStep])

  const realActiveEvent = useMemo(() => {
    const safe = Array.isArray(pipelineEvents) ? pipelineEvents : []
    const running = safe.find(e => e && e.phase_status === 'RUNNING')
    if (running) return running
    if (safe.length > 0) return safe[safe.length - 1]
    return null
  }, [pipelineEvents])

  // Use simulated event if active, else real event
  const isSimulating = simStep !== null
  const activeEvent = isSimulating ? {
    service_name: simService,
    version_id: 'sim-v1.0.4',
    phase: PHASES[simStep]?.key || 'RUNNING',
    phase_status: simStep === 3 ? 'DONE' : 'RUNNING',
  } : realActiveEvent

  const currentPhaseIdx = activeEvent ? phaseIndex(activeEvent.phase) : 3
  const activePhaseStatus = activeEvent ? activeEvent.phase_status : 'STANDBY'

  return (
    <div style={{ padding: '10px 14px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 14, height: 14,
            borderRadius: 3,
            background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
            boxShadow: '0 0 8px var(--cyan)',
            flexShrink: 0,
          }} />
          <span className="label" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            LAUNCH PIPELINE SEQUENCE
          </span>
          {activeEvent && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--cyan)',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}>
              [{activeEvent.service_name?.toUpperCase()}]
            </span>
          )}
        </div>

        {/* Interactive Simulate Button for Judges */}
        <button
          onClick={() => {
            setSimService(prev => prev === 'api' ? 'gui' : 'api')
            setSimStep(0)
          }}
          disabled={isSimulating}
          style={{
            padding: '3px 10px',
            borderRadius: 4,
            border: '1px solid var(--border-bright)',
            background: isSimulating ? 'rgba(0,212,255,0.1)' : 'rgba(0,212,255,0.15)',
            color: 'var(--cyan)',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.1em',
            cursor: isSimulating ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 10px rgba(0,212,255,0.1)',
          }}
        >
          {isSimulating ? '🚀 LAUNCH IN PROGRESS…' : '▶ SIMULATE LAUNCH DEMO'}
        </button>
      </div>

      {/* Phase Track */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
        {PHASES.map((ph, i) => {
          let state = 'pending'
          if (activeEvent) {
            if (i < currentPhaseIdx) state = 'done'
            else if (i === currentPhaseIdx) state = activePhaseStatus.toLowerCase()
          } else {
            state = 'done'
          }

          const color = state === 'done'    ? 'var(--green)'
                      : state === 'running' ? 'var(--cyan)'
                      : state === 'failed'  ? 'var(--red)'
                      : 'rgba(0,212,255,0.12)'

          const isCurrent = i === currentPhaseIdx && activeEvent

          return (
            <div key={ph.key} style={{ flex: 1, position: 'relative' }}>
              <div style={{
                height: 34,
                borderRadius: 6,
                background: state === 'pending'
                  ? 'rgba(6,11,18,0.7)'
                  : `${color}15`,
                border: `1px solid ${isCurrent ? color : (state === 'done' ? 'rgba(0,255,136,0.3)' : 'rgba(0,212,255,0.1)')}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s ease',
                boxShadow: isCurrent ? `0 0 16px ${color}50` : 'none',
              }}>
                {/* Running shimmer */}
                {state === 'running' && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(90deg, transparent, ${color}35, transparent)`,
                    animation: 'pipeline-fill 1.2s ease-in-out infinite alternate',
                  }} />
                )}
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: state === 'pending' ? 'rgba(0,212,255,0.3)' : color,
                  letterSpacing: '0.1em',
                  fontWeight: 700,
                }}>
                  {ph.short}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 600,
                  color: state === 'pending' ? 'rgba(0,212,255,0.3)' : color,
                  letterSpacing: '0.08em',
                }}>
                  {ph.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Status Bar */}
      <div style={{
        marginTop: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
          VERSION: <span style={{ color: 'var(--cyan)' }}>{activeEvent?.version_id?.substring(0, 10) || 'v1.0.0'}</span>
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: activeEvent ? (activePhaseStatus === 'DONE' ? 'var(--green)' : 'var(--cyan)') : 'var(--green)',
          letterSpacing: '0.1em',
          fontWeight: 600,
        }}>
          ◆ {activeEvent ? activePhaseStatus.toUpperCase() : 'NOMINAL — STANDBY'}
        </span>
      </div>
    </div>
  )
}
