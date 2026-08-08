export interface Slide {
  /** Background image for the hero layer. */
  url: string
  title: string
  caption: string
}

/**
 * Owned by shared rather than by either feature, because hero-reveal and
 * scroll-sections both render it and features never import each other.
 */
export const SLIDES: readonly Slide[] = [
  {
    url: '/umkm1.jpg',
    title: 'Invest in real businesses',
    caption:
      'Verified in real time, a sharia-compliant platform connecting everyday investors with growing small-medium businesses. Every transaction is traced back to its source, cross-checked against real activity, and recorded in a way that cannot be altered after the fact, so what you see is exactly what happened.',
  },
  {
    url: '/umkm2.jpg',
    title: 'Verified, not self-reported',
    caption:
      'Revenue is pulled from real transaction sources and cross-checked, then recorded in a way that cannot be altered after the fact.',
  },
  {
    url: '/umkm3.jpg',
    title: 'Profit shared automatically',
    caption:
      'Distributions are triggered by verified performance each cycle, not by fixed interest that erodes margin.',
  },
] as const

export const NAV_LINKS = [
  'About',
  'How It Works',
  'For Investors',
  'Trust & Security',
] as const
