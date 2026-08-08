import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'

import type { Slide } from '@/shared/content/slides'
import { SplitText, queryChars } from '@/shared/motion/SplitText'
import { duration, ease, stagger, travel } from '@/shared/motion/tokens'
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion'

import { useMaskReveal } from '../model/useMaskReveal'
import { HeroNav } from './HeroNav'
import './hero-reveal.css'

interface HeroRevealProps {
  slides: readonly Slide[]
}

export function HeroReveal({ slides }: HeroRevealProps) {
  const heroRef = useRef<HTMLElement | null>(null)
  const baseSlideRef = useRef<HTMLDivElement | null>(null)
  const frontSlideRef = useRef<HTMLDivElement | null>(null)
  const blobRef = useRef<SVGCircleElement | null>(null)
  const arrowRef = useRef<HTMLDivElement | null>(null)
  const headlineRef = useRef<HTMLSpanElement | null>(null)

  const reduced = usePrefersReducedMotion()

  // Slide index is React state so the headline renders declaratively. The
  // previous build rewrote the headline with innerHTML through a second,
  // subtly different splitter, so the hero text visibly changed shape the
  // first time a slide advanced.
  const [index, setIndex] = useState(0)
  const [hasAdvanced, setHasAdvanced] = useState(false)

  const refs = useMemo(
    () => ({
      hero: heroRef,
      baseSlide: baseSlideRef,
      frontSlide: frontSlideRef,
      blob: blobRef,
      arrow: arrowRef,
      headline: headlineRef,
    }),
    []
  )

  const handleAdvance = useCallback((nextIndex: number) => {
    setHasAdvanced(true)
    setIndex(nextIndex)
  }, [])

  const advance = useMaskReveal({ slides, refs, reduced, onAdvance: handleAdvance })

  useLayoutEffect(() => {
    const chars = queryChars(headlineRef.current)
    if (!chars.length) return

    if (reduced) {
      gsap.set(chars, { opacity: 1, y: 0 })
      return
    }

    const tween = gsap.fromTo(
      chars,
      { opacity: 0, y: travel.headline },
      {
        opacity: 1,
        y: 0,
        duration: hasAdvanced ? duration.headlineInFast : duration.headlineIn,
        stagger: hasAdvanced ? stagger.headlineInFast : stagger.headlineIn,
        ease: ease.out,
      }
    )

    return () => {
      tween.kill()
    }
  }, [index, hasAdvanced, reduced])

  const slide = slides[index]

  return (
    <section
      className="hero"
      ref={heroRef}
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label="Bagi Hasil Warung highlights. Use the left and right arrow keys to change slide."
    >
      <div className="hero-slide hero-slide-base" ref={baseSlideRef} />
      <div className="hero-slide hero-slide-front" ref={frontSlideRef} />

      <HeroNav heroRef={heroRef} />

      <h1 className="hero-headline" key={index}>
        <SplitText text={slide.title} mode="lines" ref={headlineRef} />
      </h1>

      <div className="hero-cursor" ref={arrowRef} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M15 5l-7 7 7 7"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Mask cut into the base layer: a circle that reveals the front layer. */}
      <svg width="0" height="0" className="hero-mask-defs" aria-hidden="true">
        <mask
          id="hero-reveal-mask"
          maskUnits="userSpaceOnUse"
          x="-5000"
          y="-5000"
          width="10000"
          height="10000"
        >
          <rect x="-5000" y="-5000" width="10000" height="10000" fill="white" />
          <circle ref={blobRef} cx="0" cy="0" r="0" fill="black" />
        </mask>
      </svg>

      {/* Coarse pointers cannot hover, so they get explicit halves to tap. */}
      <div className="hero-tap-zones">
        <button type="button" aria-label="Previous slide" onClick={() => advance(false)} />
        <button type="button" aria-label="Next slide" onClick={() => advance(true)} />
      </div>
    </section>
  )
}
