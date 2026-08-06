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
    url: 'https://images.unsplash.com/photo-1560972550-aba3456b5564?w=1600&q=80',
    title: 'Invest in real businesses',
    caption:
      'Verified in real time, a sharia-compliant platform connecting everyday investors with growing small-medium businesses. Every transaction is traced back to its source, cross-checked against real activity, and recorded in a way that cannot be altered after the fact, so what you see is exactly what happened.',
  },
  {
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=1600&q=80',
    title: 'Verified, not self-reported',
    caption:
      'Revenue is pulled from real transaction sources and cross-checked, then recorded in a way that cannot be altered after the fact.',
  },
  {
    url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1600&q=80',
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
