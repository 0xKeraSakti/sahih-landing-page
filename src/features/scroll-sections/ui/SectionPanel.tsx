import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

import type { Slide } from '@/shared/content/slides'

import { SectionSidebar } from './SectionSidebar'
import { SlideStep } from './SlideStep'
import './scroll-sections.css'

gsap.registerPlugin(ScrollTrigger)

interface SectionPanelProps {
  sections: readonly Slide[]
  scrollContainerRef: React.RefObject<HTMLElement | null>
}

/**
 * A sticky rail of section labels over a column of tall slides. The rail is
 * rendered once and pinned; only the slides scroll past it.
 */
export function SectionPanel({ sections, scrollContainerRef }: SectionPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [railOnLight, setRailOnLight] = useState(false)
  const lightSlideRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const slide = lightSlideRef.current
    const scroller = scrollContainerRef.current
    if (!slide || !scroller) return

    const trigger = ScrollTrigger.create({
      trigger: slide,
      scroller,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => setRailOnLight(self.isActive),
    })

    return () => {
      trigger.kill()
    }
  }, [scrollContainerRef])

  const handleActive = useCallback((index: number) => setActiveIndex(index), [])

  return (
    <div className="sections-group">
      <SectionSidebar sections={sections} activeIndex={activeIndex} onLight={railOnLight} />

      <div className="section-slides">
        {sections.map((section, index) => (
          <SlideStep
            key={section.title}
            section={section}
            index={index}
            isVideoFill={index === 0}
            isVideoFrame={index === 1}
            isLight={index === 1}
            isPhysics={index === 2}
            slideRef={index === 1 ? lightSlideRef : undefined}
            onActive={handleActive}
            scrollContainerRef={scrollContainerRef}
          />
        ))}
      </div>
    </div>
  )
}
