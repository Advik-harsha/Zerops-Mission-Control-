/**
 * TelemetryPanel — live system metrics (CPU, RAM, Network, DB Pool).
 * Displays high-density animated meters styled like flight-control avionics.
 */
import React, { useState, useEffect } from 'react'

export default function TelemetryPanel({ serviceCount = 3 }) {
  const [cpu, setCpu] = useState(14)
  const [ram, setRam] = useState(384)
  const [netIn, setNetIn] = useState(128)
  const [netOut, setNetOut] = useState(86)
  const [dbConns, setDbConns] = useState(4)

  // Simulate subtle real-time fluctuations for telemetry feel
  useEffect(() => {
    const t = setInterval(() => {
      setCpu(Math.floor(12 + Math.random() * 18))
      setRam(Math.floor(370 + Math.random() * 35))
      setNetIn(Math.floor(110 + Math.random() * 50))
      setNetOut(Math.floor(70 + Math.random() * 30))
      setDbConns(Math.floor(3 + Math.random() * 3))
    }, 2500)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 8,
      padding: '8px 12px',
      background: 'rgba(2,6,9,0.7)',
      borderTop: '1px solid rgba(0,212,255,0.1)',
      borderBottom: '1px solid rgba(0,212,255,0.1)',
    }}>
      {/* CPU Load */}
      <GaugeMeter
        label="CPU LOAD"
        value={`${cpu}%`}
        percent={cpu}
        color="var(--cyan)"
        detail="6 SHARED CORES"
      />

      {/* RAM Memory */}
      <GaugeMeter
        label="MEMORY"
        value={`${ram} MB`}
        percent={(ram / 1024) * 100}
        color="var(--purple)"
        detail="12 GB ALLOCATED"
      />

      {/* Network Throughput */}
      <GaugeMeter
        label="NETWORK"
        value={`${netIn} KB/s`}
        percent={Math.min(netIn / 3, 100)}
        color="var(--green)"
        detail={`OUT: ${netOut} KB/s`}
      />

      {/* DB Connections */}
      <GaugeMeter
        label="DB POOL"
        value={`${dbConns} / 10`}
        percent={(dbConns / 10) * 100}
        color="var(--amber)"
        detail="POSTGRESQL 14"
      />
    </div>
  )
}

function GaugeMeter({ label, value, percent, color, detail }) {
  return (
    <div style={{
      padding: '6px 10px',
      borderRadius: 6,
      background: 'rgba(10,18,32,0.8)',
      border: '1px solid rgba(0,212,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="label" style={{ fontSize: 8 }}>{label}</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 8,
          color: 'var(--text-muted)',
        }}>{detail}</span>
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        fontWeight: 700,
        color,
        textShadow: `0 0 8px ${color}80`,
      }}>
        {value}
      </div>

      {/* Progress bar */}
      <div style={{
        height: 3,
        borderRadius: 2,
        background: 'rgba(0,212,255,0.1)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(Math.max(percent, 5), 100)}%`,
          background: color,
          borderRadius: 2,
          boxShadow: `0 0 6px ${color}`,
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  )
}
