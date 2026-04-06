import type { GraphicId } from './cardsData'
import type { StackCardData } from './cardsData'

export function hexToRgbTriplet(hex: string): string {
  let h = String(hex).replace(/^#/, '')
  if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('')
  const n = parseInt(h, 16)
  if (Number.isNaN(n)) return '0, 0, 0'
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

export function setupCanvas(canvas: HTMLCanvasElement, cssW: number, cssH: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.round(cssW * dpr))
  canvas.height = Math.max(1, Math.round(cssH * dpr))
  canvas.style.width = `${cssW}px`
  canvas.style.height = `${cssH}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, w: cssW, h: cssH, dpr }
}

function clearCanvas(ctx: CanvasRenderingContext2D, w: number, h: number, bg: string) {
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
}

function drawRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rw: number,
  rh: number,
  color: string,
  alpha = 1,
) {
  const a = ctx.globalAlpha
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.fillRect(x, y, rw, rh)
  ctx.globalAlpha = a
}

/** Uniform inset for all graphic types so artwork aligns in the card strip. */
function artFramePadding(w: number, h: number): number {
  return Math.max(2, Math.min(14, Math.min(w, h) * 0.04))
}

function createSeededRandom(seed: number) {
  let t = seed >>> 0
  return function () {
    t |= 0
    t = (t + 0x6d2b79f5) | 0
    let e = Math.imul(t ^ (t >>> 15), 1 | t)
    e ^= e + Math.imul(e ^ (e >>> 7), 61 | e)
    return ((e ^ (e >>> 14)) >>> 0) / 0x100000000
  }
}

function wave(t: number, type: string) {
  const r = t % 1
  switch (type) {
    case 'triangle':
      if (r < 0.25) return 4 * r
      if (r < 0.75) return 1 - (r - 0.25) * 4
      return -1 + (r - 0.75) * 4
    case 'sawtooth':
      return 2 * r - 1
    case 'square':
      return r < 0.5 ? 1 : -1
    case 'bounce':
      return Math.abs(Math.sin(r * Math.PI * 2))
    case 'elastic': {
      const n = Math.exp(-3 * r)
      return Math.sin(r * Math.PI * 8) * n
    }
    case 'sine':
    default:
      return Math.sin(r * Math.PI * 2)
  }
}

function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rw: number,
  rh: number,
  radius: number,
  color: string,
  lineW: number,
  alpha = 1,
  inset = false,
) {
  const a = ctx.globalAlpha
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.lineWidth = lineW
  ctx.beginPath()
  if (inset) {
    const o = lineW / 2
    ctx.roundRect(x + o, y + o, rw - lineW, rh - lineW, Math.max(0, radius - o))
  } else {
    ctx.roundRect(x, y, rw, rh, radius)
  }
  ctx.stroke()
  ctx.globalAlpha = a
}

const PRESETS: Record<
  GraphicId,
  Record<string, string | number | boolean | undefined>
> = {
  /* 52 bars: even = static, odd = wave; one rect per column */
  waveformBars: {
    waveType: 'sine',
    waveAmplitude: 0.4,
    waveFrequency: 0.9,
    phaseOffset: 0.4,
    columns: 52,
    barWidth: 2,
    gap: 1,
    barThicknessScale: 0.5,
    minHeight: 1,
    maxHeightFrac: 0.78,
    anchorInterval: 2,
    topAligned: true,
    stagger: 0.1,
    verticalShift: 0,
    shiftCurve: 3,
    shiftOrigin: 0.99,
    speed: 0.1,
  },
  gridBlocks: {
    waveType: 'elastic',
    waveAmplitude: 1,
    waveFrequency: 1,
    phaseOffset: 0.35,
    itemWidth: 10,
    itemHeight: 10,
    gapX: 3,
    gapY: 3,
    opacityMin: 0,
    opacityMax: 1,
    speed: 0.05,
    autoFit: true,
    inset: 0,
  },
  noiseLines: {
    waveType: 'sine',
    waveAmplitude: 0.9,
    waveFrequency: 0.9,
    phaseOffset: 0.4,
    rows: 24,
    baseThickness: 0.45,
    maxThickness: 3.2,
    gapY: 1.5,
    noiseAmount: 0,
    speed: 0.2,
  },
  fluidGrid: {
    waveType: 'elastic',
    waveAmplitude: 1,
    waveFrequency: 1,
    phaseOffset: 1,
    rows: 4,
    cols: 22,
    minWidth: 0,
    maxWidth: 8,
    itemHeight: 16,
    gapX: 2,
    gapY: 2,
    stagger: 0.12,
    speed: 0.05,
  },
  interfaceBlueprint: {
    gridSize: 10,
    gridOpacity: 0.14,
    strokeWidth: 1.1,
    cornerRadius: 5,
    speed: 0.4,
    animated: true,
  },
}

function drawWaveformBars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  _seed: number,
  fg: string,
  bg: string,
  o: Record<string, number | string | boolean>,
) {
  clearCanvas(ctx, w, h, bg)
  const pad = artFramePadding(w, h)
  const vPad = pad
  const innerW = Math.max(1, w - 2 * pad)
  const innerH = Math.max(1, h - 2 * vPad)
  const F = (o.maxHeightFrac as number) * innerH
  let barW = o.barWidth as number
  const gapBase = o.gap as number
  const targetCols = o.columns as number
  let cols: number
  let gapX: number
  if (targetCols === 52) {
    cols = 52
    gapX = Math.max(0, Math.min(gapBase, 1))
    barW = (innerW - (cols - 1) * gapX) / cols
    if (barW < 0.4) {
      gapX = 0
      barW = innerW / cols
    }
  } else {
    cols = Math.min(targetCols, Math.max(8, Math.floor((innerW + gapBase) / (barW + gapBase))))
    gapX = cols > 1 ? (innerW - cols * barW) / (cols - 1) : gapBase
  }
  const offsetX = pad
  const bottom = h - vPad
  const scale =
    o.barThicknessScale !== undefined && o.barThicknessScale !== null
      ? (o.barThicknessScale as number)
      : 1
  const tw = Math.max(0.5, barW * scale)

  for (let col = 0; col < cols; col++) {
    const x = offsetX + col * (barW + gapX)
    const anchor = (o.anchorInterval as number) > 0 && col % (o.anchorInterval as number) === 0
    let barH: number
    if (anchor) barH = F
    else {
      const stagger =
        ((o.anchorInterval as number) > 0 ? col % (o.anchorInterval as number) : col) *
        (o.stagger as number)
      const phase =
        (col / cols) * (o.waveFrequency as number) +
        (o.phaseOffset as number) +
        stagger +
        t * (o.speed as number)
      const n =
        (wave(phase, o.waveType as string) * (o.waveAmplitude as number) + 1) / 2
      const base = (o.minHeight as number) + (1 - n) * (F - (o.minHeight as number))
      barH = Math.max(o.minHeight as number, base)
    }
    let y0 = vPad + ((o.topAligned as boolean) ? 0 : (innerH - barH) / 2)
    if (!anchor && (o.verticalShift as number) !== 0) {
      const ti =
        (o.anchorInterval as number) > 0 ? Math.floor(col / (o.anchorInterval as number)) : col
      const r =
        (o.anchorInterval as number) > 0
          ? Math.floor(cols / (o.anchorInterval as number))
          : cols
      const center = (o.shiftOrigin as number) * (r - 1)
      const dist = Math.abs(ti - center)
      const maxd = Math.max(1, Math.max(center, r - 1 - center))
      let i = dist / maxd
      const s = Math.abs(o.shiftCurve as number) || 1
      const factor =
        (o.shiftCurve as number) >= 0 ? Math.pow(i, s) : 1 - Math.pow(1 - i, s)
      y0 += maxd * (o.verticalShift as number) * factor
    }
    barH = Math.min(barH, Math.max(0, bottom - y0))
    y0 = Math.max(vPad, Math.min(y0, bottom - barH))
    barH = Math.min(barH, Math.max(0, bottom - y0))
    if (barH < (o.minHeight as number)) continue
    const xb = x + (barW - tw) / 2
    drawRect(ctx, xb, y0, tw, barH, fg)
  }
}

function drawGridBlocks(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  seed: number,
  fg: string,
  bg: string,
  o: Record<string, number | string | boolean>,
) {
  const rnd = createSeededRandom(seed)
  clearCanvas(ctx, w, h, bg)
  const presetInset = o.inset as number | undefined
  const inset =
    presetInset !== undefined && presetInset > 0 ? presetInset : artFramePadding(w, h)
  const iw = Math.max(1, w - 2 * inset)
  const ih = Math.max(1, h - 2 * inset)
  const cellH = Math.max(o.itemHeight as number, Math.min(16, ih * 0.13))
  const rows = o.autoFit
    ? Math.max(1, Math.floor((ih + (o.gapY as number)) / (cellH + (o.gapY as number))))
    : (o.rows as number)
  const cols = o.autoFit
    ? Math.max(1, Math.floor((iw + (o.gapX as number)) / ((o.itemWidth as number) + (o.gapX as number))))
    : (o.cols as number)
  const itemW = o.autoFit ? (iw - (cols - 1) * (o.gapX as number)) / cols : (o.itemWidth as number)
  const itemH = o.autoFit ? cellH : (o.itemHeight as number)
  const gridW = cols * itemW + (cols - 1) * (o.gapX as number)
  const gridH = rows * itemH + (rows - 1) * (o.gapY as number)
  const padX = inset + (o.autoFit ? (iw - gridW) / 2 : 0)
  const padY = inset + (ih - gridH) / 2
  for (let row = 0; row < rows; row++) {
    const y = padY + row * (itemH + (o.gapY as number))
    const rowPhase = (o.phaseOffset as number) * row
    for (let c = 0; c < cols; c++) {
      const x = padX + c * (itemW + (o.gapX as number))
      const p =
        (cols > 1 ? c / (cols - 1) : 0) * (o.waveFrequency as number) +
        rowPhase +
        t * (o.speed as number)
      const op =
        (o.opacityMin as number) +
        (((wave(p, o.waveType as string) * (o.waveAmplitude as number) + 1) / 2 + 0.15 * rnd()) *
          ((o.opacityMax as number) - (o.opacityMin as number)))
      drawRect(
        ctx,
        x,
        y,
        itemW,
        itemH,
        fg,
        Math.max(o.opacityMin as number, Math.min(o.opacityMax as number, op)),
      )
    }
  }
}

function drawNoiseLines(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  seed: number,
  fg: string,
  bg: string,
  o: Record<string, number | string>,
) {
  const rnd = createSeededRandom(seed)
  clearCanvas(ctx, w, h, bg)
  const vm = artFramePadding(w, h)
  const innerH = h - 2 * vm
  const innerW = Math.max(1, w - 2 * vm)
  const pad = vm + Math.max(0, (innerH - (o.rows as number) * ((o.maxThickness as number) + (o.gapY as number))) / 2)
  ctx.fillStyle = fg
  for (let row = 0; row < (o.rows as number); row++) {
    const n = (o.rows as number) > 1 ? row / ((o.rows as number) - 1) : 0
    const yBase = pad + row * ((o.maxThickness as number) + (o.gapY as number))
    const thick =
      (o.baseThickness as number) + n * ((o.maxThickness as number) - (o.baseThickness as number))
    const u = 1 - 0.8 * n
    for (let s = 0; s < 100; s++) {
      const x0 = vm + (s / 100) * innerW
      const segW = innerW / 100 + 1
      const g = s / 100
      let vthick = o.baseThickness as number
      if (g > u) vthick = (o.baseThickness as number) + ((g - u) / (1 - u)) * (thick - (o.baseThickness as number))
      const phase = (g + n) * (o.waveFrequency as number) + (o.phaseOffset as number) + t * (o.speed as number)
      const wy = wave(phase, o.waveType as string) * (o.waveAmplitude as number) * Math.min(3, innerH * 0.028)
      const nx = (rnd() - 0.5) * (o.noiseAmount as number) * vthick
      const yy = Math.max(
        vm + vthick / 2,
        Math.min(h - vm - vthick / 2, yBase + wy + nx),
      )
      ctx.fillRect(x0, yy - vthick / 2, segW, vthick)
    }
  }
}

function drawFluidGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  seed: number,
  fg: string,
  bg: string,
  o: Record<string, number | string>,
) {
  const rnd = createSeededRandom(seed)
  clearCanvas(ctx, w, h, bg)
  const pad = artFramePadding(w, h)
  const innerW = Math.max(1, w - 2 * pad)
  const innerH = Math.max(1, h - 2 * pad)
  const rows = o.rows as number
  const colsN = o.cols as number
  const gapX = o.gapX as number
  const gapY = o.gapY as number
  const itemH = Math.max(12, Math.min(22, (innerH - (rows - 1) * gapY) / rows))
  const padY = pad + (innerH - (rows * (itemH + gapY) - gapY)) / 2
  for (let row = 0; row < rows; row++) {
    const y = padY + row * (itemH + gapY)
    const stagger = row * (o.stagger as number)
    const widths: number[] = []
    for (let c = 0; c < colsN; c++) {
      const phase =
        (c / colsN) * (o.waveFrequency as number) +
        stagger +
        (o.phaseOffset as number) +
        t * (o.speed as number)
      let bw =
        (o.minWidth as number) +
        (0.5 +
          (((wave(phase, o.waveType as string) + 1) / 2 - 0.5) * (o.waveAmplitude as number))) *
          ((o.maxWidth as number) - (o.minWidth as number)) +
        (rnd() - 0.5) * 0.5
      bw = Math.max(Math.max(0.5, o.minWidth as number), Math.min(o.maxWidth as number, bw))
      widths.push(bw)
    }
    const totalGap = (colsN - 1) * gapX
    const sumW = widths.reduce((a, b) => a + b, 0)
    const avail = Math.max(0.001, innerW - totalGap)
    const scale = avail / sumW
    let x = pad
    for (let c = 0; c < colsN; c++) {
      const bw = widths[c] * scale
      drawRect(ctx, x, y, bw, itemH, fg)
      x += bw + gapX
    }
  }
}

function drawInterfaceBlueprint(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  fg: string,
  bg: string,
  o: Record<string, number | boolean>,
) {
  clearCanvas(ctx, w, h, bg)
  const u = Math.max(
    artFramePadding(w, h),
    Math.max(7, Math.min(14, ((o.gridSize as number) * Math.min(w, h)) / 120)),
  )
  const lineW = Math.max(0.55, Math.min(1.35, (o.strokeWidth as number) * (Math.min(w, h) / 120)))
  ctx.strokeStyle = fg
  ctx.lineWidth = lineW
  ctx.globalAlpha = o.gridOpacity as number
  for (let x = 0; x <= w; x += u) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let y = 0; y <= h; y += u) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  const snap = (v: number) => Math.round(v / u) * u
  const innerW = w - 2 * u
  const innerH = h - 2 * u
  strokeRoundRect(ctx, u, u, innerW, innerH, 2 * (o.cornerRadius as number), fg, lineW, 0.4, true)

  const b = u + u
  const bw0 = u + u
  const xInner = innerW - 2 * u
  const yInner = innerH - 2 * u
  const leftColW = snap(0.28 * xInner)
  strokeRoundRect(ctx, b, bw0, leftColW, yInner, o.cornerRadius as number, fg, lineW, 0.6, true)

  const k = b + leftColW + u
  const rightW = xInner - leftColW - u
  strokeRoundRect(ctx, k, bw0, rightW, yInner, o.cornerRadius as number, fg, lineW, 0.6, true)

  const S = Math.max(u, snap((rightW - 2 * u - 2 * u) / 3))
  const F = 2 * u
  const T = Math.max(u, yInner - 2 * F)
  const E = bw0 + F
  const j = Math.max(S + u, 1)
  const P = o.animated ? (((t * (o.speed as number) * 25) % j) + j) % j : 0

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(k + lineW, bw0 + lineW, rightW - 2 * lineW, yInner - 2 * lineW, (o.cornerRadius as number) - 1)
  ctx.clip()

  const I = k + u - P
  for (let i = 0; i < 5; i++) {
    strokeRoundRect(
      ctx,
      I + i * j,
      E,
      S,
      T,
      (o.cornerRadius as number) - 1,
      fg,
      lineW,
      0.5,
      true,
    )
  }
  ctx.restore()
}

export function drawGraphic(
  type: GraphicId,
  canvas: HTMLCanvasElement,
  cssW: number,
  cssH: number,
  t: number,
  card: StackCardData,
) {
  const setup = setupCanvas(canvas, cssW, cssH)
  if (!setup) return
  const { ctx, w, h } = setup
  const fg = card.fg
  const bg = card.bg
  const seed = card.seed
  const o = { ...PRESETS[type] } as Record<string, number | string | boolean>

  switch (type) {
    case 'waveformBars':
      drawWaveformBars(ctx, w, h, t, seed, fg, bg, o as Record<string, number | string>)
      break
    case 'gridBlocks':
      drawGridBlocks(ctx, w, h, t, seed, fg, bg, o as Record<string, number | string | boolean>)
      break
    case 'noiseLines':
      drawNoiseLines(ctx, w, h, t, seed, fg, bg, o as Record<string, number | string>)
      break
    case 'fluidGrid':
      drawFluidGrid(ctx, w, h, t, seed, fg, bg, o as Record<string, number | string>)
      break
    case 'interfaceBlueprint':
      drawInterfaceBlueprint(ctx, w, h, t, fg, bg, o as Record<string, number | boolean>)
      break
    default:
      clearCanvas(ctx, w, h, bg)
  }
}
