import type { LayoutProfile } from './cardStackConstants'

/** Values consumed by Framer Motion `animate` (layout flow is not animated). */
export type CardAnimState = {
  x: number
  y: number
  rotate: number
  scale: number
  opacity: number
  zIndex: number
  filter: string
}

/**
 * Idle: fan from `restStack`.
 * Selected: hero card uses `splitLayout.active`; other four use `splitLayout.peerSlots`
 * in ascending id order (left → right overlap).
 */
export function computeCardAnimStates(
  selectedIndex: number | null,
  profile: LayoutProfile,
): Map<number, CardAnimState> {
  const { restStack, splitLayout } = profile
  const map = new Map<number, CardAnimState>()
  const n = restStack.length

  if (selectedIndex === null) {
    for (let id = 0; id < n; id++) {
      const s = restStack[id]
      map.set(id, {
        x: s.x,
        y: s.y,
        rotate: s.rotate,
        scale: s.scale,
        opacity: 1,
        zIndex: s.zIndex,
        filter: 'blur(0px)',
      })
    }
    return map
  }

  const { active, peerSlots } = splitLayout
  const remaining = Array.from({ length: n }, (_, i) => i)
    .filter((i) => i !== selectedIndex)
    .sort((a, b) => a - b)

  remaining.forEach((cardId, slot) => {
    const p = peerSlots[slot]
    map.set(cardId, {
      x: p.x,
      y: p.y,
      rotate: p.rotate,
      scale: p.scale,
      opacity: 1,
      zIndex: p.zIndex,
      filter: 'blur(0px)',
    })
  })

  map.set(selectedIndex, {
    x: active.x,
    y: active.y,
    rotate: active.rotate,
    scale: active.scale,
    opacity: 1,
    zIndex: 50,
    filter: 'blur(0px)',
  })

  return map
}
