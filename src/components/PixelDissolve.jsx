import { useEffect, useRef, useCallback } from 'react'
import '../style/PixelDissolve.css'

const BLOCK_SIZE = 10       // px per block (logical)
const SWAP_INTERVAL = 4000  // ms between image advances
const SWEEP_SPEED = 0.018   // radians per frame (~60fps → ~1.7s full rotation)
const SHIMMER_PROB = 0.004  // probability any block shimmers per frame

// Compute object-fit:cover crop params so an image fills (dw × dh) without distortion
function coverCrop(imgW, imgH, dw, dh) {
  const imgAspect = imgW / imgH
  const boxAspect = dw / dh
  let sw, sh, sx, sy
  if (imgAspect > boxAspect) {
    // image wider than box → crop sides
    sh = imgH
    sw = imgH * boxAspect
    sx = (imgW - sw) / 2
    sy = 0
  } else {
    // image taller than box → crop top/bottom
    sw = imgW
    sh = imgW / boxAspect
    sx = 0
    sy = (imgH - sh) / 2
  }
  return { sx, sy, sw, sh }
}

function drawBlock(ctx, img, bx, by, bw, bh, canvasW, canvasH) {
  if (!img || !img.complete || img.naturalWidth === 0) return
  const { sx, sy, sw, sh } = coverCrop(img.naturalWidth, img.naturalHeight, canvasW, canvasH)
  // Scale factors: map block pixel position → source image crop region
  const scaleX = sw / canvasW
  const scaleY = sh / canvasH
  ctx.drawImage(
    img,
    sx + bx * scaleX,
    sy + by * scaleY,
    bw * scaleX,
    bh * scaleY,
    bx, by, bw, bh
  )
}

export default function PixelDissolve({ images, onIndexChange }) {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)

  // Check reduced-motion preference
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Stable callback ref
  const onIndexChangeRef = useRef(onIndexChange)
  useEffect(() => { onIndexChangeRef.current = onIndexChange }, [onIndexChange])

  const notifyIndex = useCallback((i) => {
    onIndexChangeRef.current?.(i)
  }, [])

  useEffect(() => {
    if (!canvasRef.current || images.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId = null
    let dead = false

    // State
    const s = {
      loadedImgs: [],        // HTMLImageElement[]
      cols: 0,
      rows: 0,
      blockW: 0,
      blockH: 0,
      // blockShown[r * cols + c] = which image index is drawn there
      blockShown: null,
      currentIndex: 0,
      targetIndex: 0,
      sweepAngle: -Math.PI / 2, // start at top (12 o'clock)
      sweeping: false,
      shimmerState: null,    // Float32Array — tracks per-block shimmer phase
    }
    stateRef.current = s

    // Preload images
    const loaded = []
    let loadedCount = 0

    function onLoad() {
      loadedCount++
      if (loadedCount === images.length) {
        s.loadedImgs = loaded
        setupGrid()
        startLoop()
      }
    }

    images.forEach((item, i) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { loaded[i] = img; onLoad() }
      img.onerror = () => { loaded[i] = null; onLoad() }
      img.src = item.image_url
    })

    function setupGrid() {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const cssW = rect.width || canvas.offsetWidth || 200
      const cssH = rect.height || canvas.offsetHeight || 218

      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      ctx.scale(dpr, dpr)

      const logW = cssW
      const logH = cssH

      s.cols = Math.max(1, Math.ceil(logW / BLOCK_SIZE))
      s.rows = Math.max(1, Math.ceil(logH / BLOCK_SIZE))
      s.blockW = logW / s.cols
      s.blockH = logH / s.rows

      const total = s.cols * s.rows
      s.blockShown = new Int32Array(total)  // all showing image 0
      s.shimmerState = new Float32Array(total)

      // Draw initial frame (image 0)
      drawAll(0)
      notifyIndex(0)
    }

    function drawAll(imgIdx) {
      const logW = canvas.width / (window.devicePixelRatio || 1)
      const logH = canvas.height / (window.devicePixelRatio || 1)
      const img = s.loadedImgs[imgIdx]
      if (!img) {
        ctx.clearRect(0, 0, logW, logH)
        return
      }
      ctx.clearRect(0, 0, logW, logH)
      drawBlock(ctx, img, 0, 0, logW, logH, logW, logH)
    }

    // ResizeObserver
    const ro = new ResizeObserver(() => {
      if (!dead && s.loadedImgs.length > 0) {
        // reset DPR scaling
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        setupGrid()
        redrawAllBlocks()
      }
    })
    ro.observe(canvas.parentElement || canvas)

    function redrawAllBlocks() {
      const logW = canvas.width / (window.devicePixelRatio || 1)
      const logH = canvas.height / (window.devicePixelRatio || 1)
      for (let r = 0; r < s.rows; r++) {
        for (let c = 0; c < s.cols; c++) {
          const idx = r * s.cols + c
          const imgIdx = s.blockShown[idx]
          const img = s.loadedImgs[imgIdx]
          const bx = c * s.blockW
          const by = r * s.blockH
          drawBlock(ctx, img, bx, by, s.blockW, s.blockH, logW, logH)
        }
      }
    }

    // Swap timer
    let swapTimer = null
    function scheduleSwap() {
      swapTimer = setTimeout(() => {
        if (dead || images.length < 2) return
        s.targetIndex = (s.currentIndex + 1) % images.length
        s.sweeping = true
        s.sweepAngle = -Math.PI / 2  // reset to 12 o'clock
        scheduleSwap()
      }, SWAP_INTERVAL)
    }

    if (images.length >= 2) scheduleSwap()

    function frame() {
      if (dead) return
      if (document.hidden) { animId = requestAnimationFrame(frame); return }

      const logW = canvas.width / (window.devicePixelRatio || 1)
      const logH = canvas.height / (window.devicePixelRatio || 1)
      const cx = logW / 2
      const cy = logH / 2

      if (s.sweeping) {
        // Advance sweep angle
        s.sweepAngle += SWEEP_SPEED

        // Flip blocks the hand has passed
        let allFlipped = true
        for (let r = 0; r < s.rows; r++) {
          for (let c = 0; c < s.cols; c++) {
            const idx = r * s.cols + c
            if (s.blockShown[idx] === s.targetIndex) continue

            // Angle from center to block center
            const bx = c * s.blockW + s.blockW / 2
            const by = r * s.blockH + s.blockH / 2
            const blockAngle = Math.atan2(by - cy, bx - cx)

            // Normalize: compare from start angle (-π/2)
            const startAngle = -Math.PI / 2
            let diff = blockAngle - startAngle
            if (diff < 0) diff += Math.PI * 2
            let swept = s.sweepAngle - startAngle
            if (swept < 0) swept = 0

            if (diff <= swept) {
              s.blockShown[idx] = s.targetIndex
              const img = s.loadedImgs[s.targetIndex]
              drawBlock(ctx, img, c * s.blockW, r * s.blockH, s.blockW, s.blockH, logW, logH)
            } else {
              allFlipped = false
            }
          }
        }

        if (allFlipped) {
          s.sweeping = false
          s.currentIndex = s.targetIndex
          notifyIndex(s.currentIndex)
        }
      } else {
        // Shimmer: a few random blocks briefly show a neighbor image then flip back
        if (images.length >= 2) {
          for (let idx = 0; idx < s.blockShown.length; idx++) {
            if (Math.random() < SHIMMER_PROB) {
              const r = Math.floor(idx / s.cols)
              const c = idx % s.cols
              // Pick a neighbor image (not the same)
              const neighborIdx = (s.currentIndex + 1) % images.length
              const img = s.loadedImgs[neighborIdx]
              // Draw neighbor briefly
              drawBlock(ctx, img, c * s.blockW, r * s.blockH, s.blockW, s.blockH, logW, logH)
              // Schedule reset back (next couple of frames)
              const resetImg = s.loadedImgs[s.currentIndex]
              const capC = c, capR = r
              setTimeout(() => {
                if (!dead) {
                  drawBlock(ctx, resetImg, capC * s.blockW, capR * s.blockH, s.blockW, s.blockH, logW, logH)
                }
              }, 80 + Math.random() * 120)
            }
          }
        }
      }

      animId = requestAnimationFrame(frame)
    }

    function startLoop() {
      if (reducedMotion) {
        // Just draw the current image statically
        drawAll(s.currentIndex)
        return
      }
      animId = requestAnimationFrame(frame)
    }

    return () => {
      dead = true
      if (animId) cancelAnimationFrame(animId)
      if (swapTimer) clearTimeout(swapTimer)
      ro.disconnect()
    }
  }, [images, reducedMotion, notifyIndex])

  if (images.length === 0) return null

  if (reducedMotion) {
    // Render plain img tags stacked, crossfade via CSS
    return (
      <div className="pixel-dissolve" style={{ position: 'relative', height: '218px' }}>
        {images.map((item, i) => (
          <img
            key={item.image_url}
            className="pixel-dissolve__img"
            src={item.image_url}
            alt={item.caption || ''}
            style={{ opacity: i === 0 ? 1 : 0 }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="pixel-dissolve">
      <canvas ref={canvasRef} />
    </div>
  )
}
