/**
 * Layout: idle = vertical wallet stack (each card peeks below the one in front);
 * selected = hero card near top + 4 compressed cards below.
 * Card shell is always 228×288; motion uses transform only (scale / translate / rotate).
 */

export const CARD_COUNT = 5

export const NARROW_BREAKPOINT_PX = 480

export const CARD_WIDTH_PX = 228
export const CARD_HEIGHT_PX = 288

export const FRAME_MAX_WIDTH_PX = 360
/** Idle wallet stack — card 4 top at ~-254, card 0 bottom at ~+254 → 508px + padding */
export const FRAME_MIN_HEIGHT_PX = 580
/** Taller mount when a card is open (hero + compressed stack below) */
export const FRAME_MIN_HEIGHT_SPLIT_PX = 660

export type StackSlotTransform = {
  x: number
  y: number
  rotate: number
  scale: number
  zIndex: number
}

/** Selected state: one hero transform + four slots for the remaining cards (left→right). */
export type SplitLayoutConfig = {
  active: {
    x: number
    y: number
    rotate: number
    scale: number
  }
  peerSlots: StackSlotTransform[]
}

export type LayoutProfile = {
  cardWidth: number
  cardHeight: number
  stagePadding: number
  restStack: StackSlotTransform[]
  splitLayout: SplitLayoutConfig
}

const STAGE_PADDING_DEFAULT = 36
const STAGE_PADDING_NARROW = 20

/**
 * Wallet stack — cards pile vertically, each peeking 55 px below the one in front.
 * id=4 (front, zIndex 5) sits at top; id=0 (back, zIndex 1) peeks at the bottom.
 * No rotation in idle: clean flat stack like a physical card wallet.
 */
export const LAYOUT_DEFAULT: LayoutProfile = {
  cardWidth: CARD_WIDTH_PX,
  cardHeight: CARD_HEIGHT_PX,
  stagePadding: STAGE_PADDING_DEFAULT,
  restStack: [
    // id=0 (back)  — furthest below, lowest zIndex
    { x: 0, y: 110,  rotate: 0, scale: 1, zIndex: 1 },
    { x: 0, y: 55,   rotate: 0, scale: 1, zIndex: 2 },
    { x: 0, y: 0,    rotate: 0, scale: 1, zIndex: 3 },
    { x: 0, y: -55,  rotate: 0, scale: 1, zIndex: 4 },
    // id=4 (front) — top of stack, fully visible
    { x: 0, y: -110, rotate: 0, scale: 1, zIndex: 5 },
  ],
  splitLayout: {
    /** Selected card lifts to top-center, slightly enlarged */
    active: { x: 0, y: -148, rotate: 0, scale: 1.06 },
    /** Remaining cards compress into a tight strip below */
    peerSlots: [
      { x: 0, y: 126, rotate: -3, scale: 0.57, zIndex: 1 },
      { x: 0, y: 150, rotate: -1, scale: 0.57, zIndex: 2 },
      { x: 0, y: 174, rotate:  1, scale: 0.57, zIndex: 3 },
      { x: 0, y: 198, rotate:  3, scale: 0.57, zIndex: 4 },
    ],
  },
}

export const LAYOUT_NARROW: LayoutProfile = {
  cardWidth: CARD_WIDTH_PX,
  cardHeight: CARD_HEIGHT_PX,
  stagePadding: STAGE_PADDING_NARROW,
  restStack: [
    { x: 0, y: 88,   rotate: 0, scale: 1, zIndex: 1 },
    { x: 0, y: 44,   rotate: 0, scale: 1, zIndex: 2 },
    { x: 0, y: 0,    rotate: 0, scale: 1, zIndex: 3 },
    { x: 0, y: -44,  rotate: 0, scale: 1, zIndex: 4 },
    { x: 0, y: -88,  rotate: 0, scale: 1, zIndex: 5 },
  ],
  splitLayout: {
    active: { x: 0, y: -118, rotate: 0, scale: 1.0 },
    peerSlots: [
      { x: 0, y: 104, rotate: -3, scale: 0.50, zIndex: 1 },
      { x: 0, y: 124, rotate: -1, scale: 0.50, zIndex: 2 },
      { x: 0, y: 144, rotate:  1, scale: 0.50, zIndex: 3 },
      { x: 0, y: 164, rotate:  3, scale: 0.50, zIndex: 4 },
    ],
  },
}

/** Spring — CSS-friendly timing via Framer (transform under the hood) */
export const STACK_MOTION_TRANSITION = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 34,
  mass: 0.9,
}

export const STACK_MOTION_TRANSITION_REDUCED = {
  type: 'tween' as const,
  duration: 0.01,
}
