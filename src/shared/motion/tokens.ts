/**
 * Motion tokens.
 *
 * GSAP reads plain numbers, so these cannot live in CSS custom properties.
 * Every duration, stagger, easing and magic radius the animations use is
 * declared here so a component file never contains a bare number.
 *
 * Durations are seconds, matching GSAP's unit.
 */

export const duration = {
  /** Hero headline entering on first paint */
  headlineIn: 0.5,
  /** Hero headline entering after a slide change */
  headlineInFast: 0.4,
  /** Hero headline leaving as the iris opens */
  headlineOut: 0.25,
  /** Hero caption fading in on its new side */
  captionIn: 0.5,
  captionDelay: 0.1,

  /** Cursor arrow rotating between left and right */
  arrowRotate: 0.3,
  arrowFade: 0.2,

  /** Mask blob opacity */
  blobFade: 0.2,
  /** Mask blob opening to hover size */
  blobOpen: 0.35,
  /** Mask blob closing when the pointer leaves */
  blobClose: 0.25,
  /** Mask blob closing as the pointer crosses the midpoint */
  blobSwitchClose: 0.22,
  /** Mask blob reopening once the peeked neighbour has been swapped */
  blobSwitchOpen: 0.32,
  /** Mask blob swallowing the whole hero on click */
  iris: 0.7,
  /** One half of the idle breathing cycle */
  blobWobble: 2.4,

  /** Section title characters entering */
  sectionTitleIn: 0.4,
  /** One full lap of the marching-ants outline at timeScale 1 */
  antsLap: 1.6,

  /** Email section headline and form entering */
  emailHeadlineIn: 0.5,
  emailFormIn: 0.5,
  emailFormOverlap: 0.25,
} as const

export const stagger = {
  headlineIn: 0.02,
  headlineInFast: 0.015,
  headlineOut: 0.008,
  sectionTitle: 0.012,
  sectionCaption: 0.006,
  emailHeadline: 0.015,
} as const

export const ease = {
  out: 'power3.out',
  in: 'power2.in',
  inOut: 'power2.inOut',
  soft: 'power2.out',
  gentle: 'power1.out',
  breathe: 'sine.inOut',
  none: 'none',
} as const

/** Distance characters travel while fading in, in pixels. */
export const travel = {
  headline: 20,
  sectionTitle: 14,
  sectionCaption: 10,
  emailForm: 20,
} as const

export const mask = {
  /** Radius of the cursor hole while hovering, in pixels. */
  hoverRadius: 140,
  /** Peak of the idle breathing cycle, as a multiplier on the radius. */
  wobblePeak: 1.08,
} as const

export const ants = {
  minSpeed: 0.05,
  maxSpeed: 50,
  /** Scroll progress at which the outline reaches maxSpeed. */
  speedThreshold: 0.9,
  /** Exponent on normalised progress. Higher keeps the ramp late. */
  speedCurve: 4,
  minSegmentRatio: 0.02,
  maxSegmentRatio: 0.12,
} as const

export const videoFill = {
  /** Fraction of the clip to seek to when playback is suppressed, so a still
   *  title shows a real frame rather than whatever frame zero happens to be. */
  seekFraction: 0.25,
} as const

export const physics = {
  gravityY: 1.2,
  restitution: 0.35,
  friction: 0.4,
  floorThickness: 20,
  /** Minimum body edge, so a thin glyph still gets a usable collider. */
  minBodyEdge: 4,
  /** Floor is only repositioned once it has drifted this far, in pixels. */
  floorEpsilon: 0.5,
} as const

/** Scroll progress window across a section slide within which the title and
 *  caption reveal plays out. Shared by the GSAP scrub and the one-shot title. */
export const revealWindow = {
  start: 0.22,
  end: 0.4,
} as const

/** Progress band within which a slide claims the sidebar's active marker. */
export const activeBand = {
  enter: 0.02,
  exit: 0.98,
} as const

export const zIndex = {
  frontSlide: 1,
  baseSlide: 2,
  headline: 5,
  cursor: 6,
  caption: 7,
  touchNav: 8,
  fallingChar: 999,
  footer: 1000,
  /** Fixed header, so it has to clear everything it scrolls over. */
  nav: 1001,
} as const
