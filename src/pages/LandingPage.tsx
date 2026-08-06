import { useRef } from 'react'

import { SLIDES } from '@/shared/content/slides'
import { HeroReveal } from '@/features/hero-reveal'
import { SectionPanel } from '@/features/scroll-sections'
import { EmailSection } from '@/features/email-capture'

/**
 * Owns the scroll container, since both the hero and the section panel need to
 * measure against it, and features never reach across to each other.
 */
export function LandingPage() {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  return (
    <div className="scroll-container" id="top" ref={scrollContainerRef}>
      <HeroReveal slides={SLIDES} />
      <SectionPanel sections={SLIDES} scrollContainerRef={scrollContainerRef} />
      <EmailSection />
    </div>
  )
}
