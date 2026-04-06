import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import {
  motion,
  useReducedMotion,
} from 'framer-motion'
import {
  FRAME_MAX_WIDTH_PX,
  FRAME_MIN_HEIGHT_PX,
  FRAME_MIN_HEIGHT_SPLIT_PX,
  LAYOUT_DEFAULT,
  LAYOUT_NARROW,
  NARROW_BREAKPOINT_PX,
  STACK_MOTION_TRANSITION,
  STACK_MOTION_TRANSITION_REDUCED,
} from '../cardStackConstants'
import { STACK_CARDS } from '../cardsData'
import { drawGraphic, hexToRgbTriplet } from '../graphics'
import { computeCardAnimStates } from '../stackLayout'

function useMatchNarrow() {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${NARROW_BREAKPOINT_PX}px)`)
    const apply = () => setNarrow(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return narrow
}

function useGraphicLoop() {
  const registry = useRef(new Map<number, HTMLCanvasElement>())
  const t0 = useRef(performance.now())

  useEffect(() => {
    let raf = 0
    const loop = (now: number) => {
      const t = (now - t0.current) / 1000
      STACK_CARDS.forEach((card, i) => {
        const cv = registry.current.get(i)
        if (!cv) return
        const w = Math.max(1, Math.round(cv.clientWidth))
        const h = Math.max(1, Math.round(cv.clientHeight))
        drawGraphic(card.graphic, cv, w, h, t, card)
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const setCanvas = useCallback((index: number, el: HTMLCanvasElement | null) => {
    if (el) registry.current.set(index, el)
    else registry.current.delete(index)
  }, [])

  return setCanvas
}

type CardStackStageProps = {
  className?: string
}

export function CardStackStage({ className }: CardStackStageProps) {
  const narrow = useMatchNarrow()
  const profile = narrow ? LAYOUT_NARROW : LAYOUT_DEFAULT
  const reduced = useReducedMotion()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const hasSelection = selectedIndex !== null
  const transition = reduced
    ? STACK_MOTION_TRANSITION_REDUCED
    : {
        ...STACK_MOTION_TRANSITION,
        filter: { type: 'tween' as const, duration: 0.26, ease: [0.4, 0, 0.2, 1] },
        opacity: { type: 'tween' as const, duration: 0.28, ease: [0.4, 0, 0.2, 1] },
      }
  const frameRef = useRef<HTMLDivElement>(null)
  const setCanvas = useGraphicLoop()

  const animById = useMemo(
    () => computeCardAnimStates(selectedIndex, profile),
    [selectedIndex, profile],
  )

  useEffect(() => {
    const onDocPointerDown = (ev: MouseEvent | PointerEvent) => {
      if (selectedIndex === null) return
      const el = ev.target
      if (!(el instanceof Element)) return
      if (el.closest('.card-stack-shell')) return
      setSelectedIndex(null)
    }
    document.addEventListener('pointerdown', onDocPointerDown, true)
    return () => document.removeEventListener('pointerdown', onDocPointerDown, true)
  }, [selectedIndex])

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setSelectedIndex(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const { cardWidth: cw, cardHeight: ch, stagePadding: pad } = profile

  return (
    <section
      className={`flex w-full flex-shrink-0 flex-col items-center justify-center gap-3 px-4 py-8 select-none ${className ?? ''}`}
      aria-labelledby="card-stack-heading"
    >
      <h2
        id="card-stack-heading"
        className="font-card-sans text-[11px] font-medium uppercase tracking-[0.12em] text-white/35"
      >
        Stack
      </h2>

      {/* 1) Stable frame: idle = wide aspect; open = tall enough for hero + bottom strip (no layout jump in document flow) */}
      <div
        ref={frameRef}
        className="relative mx-auto w-full overflow-visible"
        style={{
          maxWidth: `min(100%, ${FRAME_MAX_WIDTH_PX}px)`,
          width: '100%',
          minHeight: hasSelection ? FRAME_MIN_HEIGHT_SPLIT_PX : FRAME_MIN_HEIGHT_PX,
        }}
      >
        {/* 2) Stage: padding safety for scaled active card + shadow bleed */}
        <div
          className="absolute inset-0 box-border overflow-visible"
          style={{ padding: pad }}
        >
          {/* 3) Positioning context: all cards share this origin (center of inner box) */}
          <div className="relative h-full w-full overflow-visible">
            {STACK_CARDS.map((card, id) => {
              const s = animById.get(id)!
              const expanded = selectedIndex === id
              const rgb = hexToRgbTriplet(card.bg)
              const scrimStyle: CSSProperties = {
                background: `linear-gradient(to top, rgba(${rgb}, 0.88) 0%, rgba(${rgb}, 0.45) 55%, rgba(${rgb}, 0) 100%)`,
              }
              return (
                <motion.div
                  key={id}
                  className="card-stack-shell absolute left-1/2 top-1/2 cursor-pointer rounded-[18px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0B]"
                  role="button"
                  tabIndex={0}
                  aria-pressed={expanded}
                  aria-expanded={expanded}
                  style={{
                    width: cw,
                    height: ch,
                    marginLeft: -cw / 2,
                    marginTop: -ch / 2,
                    transformOrigin: 'center center',
                    willChange: 'transform',
                    zIndex: s.zIndex,
                  }}
                  initial={false}
                  animate={{
                    x: s.x,
                    y: s.y,
                    rotate: s.rotate,
                    scale: s.scale,
                    opacity: s.opacity,
                    filter: s.filter,
                  }}
                  transition={transition}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedIndex((cur) => (cur === id ? null : id))
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedIndex((cur) => (cur === id ? null : id))
                    }
                  }}
                >
                  <div
                    className={`relative h-full w-full overflow-hidden rounded-[18px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] ${
                      expanded && hasSelection
                        ? 'shadow-[0_28px_64px_-12px_rgba(0,0,0,0.65),0_12px_24px_-6px_rgba(0,0,0,0.45)]'
                        : 'shadow-[0_22px_48px_-8px_rgba(0,0,0,0.55),0_8px_16px_-4px_rgba(0,0,0,0.35)]'
                    }`}
                    style={{ background: card.bg }}
                  >
                    <div className="pointer-events-none absolute left-6 right-6 top-6 z-[1] h-[138px] overflow-hidden rounded-[10px] py-2.5">
                      <canvas
                        ref={(el) => setCanvas(id, el)}
                        className="block h-full w-full"
                        aria-hidden
                      />
                    </div>
                    <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10">
                      <div className="relative">
                        <div
                          className="pointer-events-none absolute inset-x-[-10px] bottom-[-12px] top-[-40px] z-0 rounded-xl"
                          style={scrimStyle}
                          aria-hidden
                        />
                        <p
                          className="font-card relative z-[1] whitespace-pre-line text-[30px] font-normal leading-[1.1] tracking-[-0.02em]"
                          style={{ color: card.labelColor }}
                        >
                          {card.title}
                        </p>
                        <motion.div
                          className={`relative z-[1] overflow-hidden ${expanded ? `mt-2 overflow-y-auto pointer-events-auto ${hasSelection ? 'max-h-[160px]' : 'max-h-[100px]'}` : 'mt-0 max-h-0 pointer-events-none'}`}
                          initial={false}
                          animate={{
                            opacity: expanded ? 1 : 0,
                          }}
                          transition={
                            reduced
                              ? STACK_MOTION_TRANSITION_REDUCED
                              : { opacity: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } }
                          }
                          aria-hidden={!expanded}
                        >
                          <p
                            className="font-card-sans mt-0 text-[13px] font-normal leading-[1.55]"
                            style={{ color: card.descColor }}
                          >
                            {card.desc}
                          </p>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
