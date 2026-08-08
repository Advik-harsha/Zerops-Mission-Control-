/**
 * StarfieldCanvas — animated procedural starfield rendered on a <canvas>.
 */
import React, { useEffect, useRef } from 'react'

export default function StarfieldCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId
    let W, H, stars, nebulae

    function resize() {
      if (!canvas) return
      W = canvas.width = window.innerWidth || 1000
      H = canvas.height = window.innerHeight || 800
      init()
    }

    function init() {
      stars = Array.from({ length: 220 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.2,
        alpha: Math.random() * 0.6 + 0.1,
        twinkleSpeed: Math.random() * 0.008 + 0.002,
        twinkleOffset: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.85 ? (Math.random() > 0.5 ? 195 : 240) : 0,
        sat: Math.random() > 0.85 ? 80 : 0,
      }))

      nebulae = [
        { x: W * 0.15, y: H * 0.25, r: 180, color: 'rgba(0,80,180,', alpha: 0.06 },
        { x: W * 0.75, y: H * 0.65, r: 220, color: 'rgba(80,0,160,', alpha: 0.05 },
        { x: W * 0.5,  y: H * 0.1,  r: 150, color: 'rgba(0,140,255,', alpha: 0.04 },
      ]
    }

    function draw(t) {
      if (!ctx) return
      ctx.clearRect(0, 0, W, H)

      if (nebulae) {
        nebulae.forEach((neb, i) => {
          const pulse = 0.5 + 0.5 * Math.sin(t * 0.0003 + i * 2.1)
          const grad = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.r * (0.8 + 0.2 * pulse))
          grad.addColorStop(0, `${neb.color}${neb.alpha * pulse})`)
          grad.addColorStop(1, `${neb.color}0)`)
          ctx.beginPath()
          ctx.arc(neb.x, neb.y, neb.r, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        })
      }

      if (stars) {
        stars.forEach(star => {
          const twinkle = 0.5 + 0.5 * Math.sin(t * star.twinkleSpeed + star.twinkleOffset)
          const alpha = star.alpha * (0.4 + 0.6 * twinkle)
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
          if (star.hue === 0) {
            ctx.fillStyle = `rgba(255,255,255,${alpha})`
          } else {
            ctx.fillStyle = `hsla(${star.hue},${star.sat}%,90%,${alpha})`
          }
          ctx.fill()
        })
      }

      animId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      id="starfield"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
