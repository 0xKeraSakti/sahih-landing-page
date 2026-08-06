import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

import type { Slide } from '@/shared/content/slides'
import { SplitText, queryChars } from '@/shared/motion/SplitText'
import { useElementSize } from '@/shared/hooks/useElementSize'
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion'
import { activeBand, duration, ease, revealWindow, stagger, travel } from '@/shared/motion/tokens'

import { useMarchingAnts } from '../model/useMarchingAnts'
import { usePhysicsDrop } from '../model/usePhysicsDrop'
import { useSlideProgress } from '../model/useSlideProgress'
import { VideoText } from './VideoText'

gsap.registerPlugin(ScrollTrigger)

const VIDEO_SRC = '/your-video.mp4'
const PHYSICS_FLOOR_SELECTOR = '.email-section'

export interface SlideStepProps {
  section: Slide
  index: number
  /** Title is filled with video frames rather than revealed on scroll. */
  isVideoFill: boolean
  /** Slide paints its own light background and shows the framed video. */
  isVideoFrame: boolean
  isLight: boolean
  /** Characters fall under gravity once the reveal completes. */
  isPhysics: boolean
  slideRef?: React.MutableRefObject<HTMLElement | null>
  onActive: (index: number) => void
  scrollContainerRef: React.RefObject<HTMLElement | null>
}

export function SlideStep({
  section,
  index,
  isVideoFill,
  isVideoFrame,
  isLight,
  isPhysics,
  slideRef,
  onActive,
  scrollContainerRef,
}: SlideStepProps) {
  const slideElementRef = useRef<HTMLElement | null>(null)
  const titleRef = useRef<HTMLSpanElement | null>(null)
  const videoFillRef = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLSpanElement | null>(null)
  const strokeSvgRef = useRef<SVGSVGElement | null>(null)
  const strokeRectRef = useRef<SVGRectElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  const [physicsActive, setPhysicsActive] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const titleFired = useRef(false)

  const reduced = usePrefersReducedMotion()
  const strokeSize = useElementSize(strokeSvgRef)

  const setAntsProgress = useMarchingAnts(strokeRectRef, strokeSize, isVideoFrame)

  useSlideProgress(slideElementRef, scrollContainerRef, (progress) => {
    setAntsProgress(progress)

    if (progress > activeBand.enter && progress < activeBand.exit) onActive(index)

    // One-shot title reveal, fired at the end of the reveal window.
    if (!isVideoFill && !titleFired.current && progress >= revealWindow.end) {
      titleFired.current = true
      const chars = queryChars(titleRef.current)
      if (chars.length) {
        gsap.fromTo(
          chars,
          { opacity: 0, y: travel.sectionTitle },
          {
            opacity: 1,
            y: 0,
            duration: duration.sectionTitleIn,
            stagger: stagger.sectionTitle,
            ease: ease.soft,
          }
        )
      }
    }
  })

  // The video-filled title is a single nowrap block, so its natural width can
  // exceed the sticky container at large viewport-scaled sizes. Shrink to fit
  // rather than clipping.
  useEffect(() => {
    if (!isVideoFill) return
    const element = videoFillRef.current
    const container = slideElementRef.current
    if (!element || !container) return

    const fit = () => {
      element.style.fontSize = ''
      const available = container.getBoundingClientRect().width
      const natural = element.scrollWidth
      if (natural > available) {
        const current = parseFloat(getComputedStyle(element).fontSize)
        element.style.fontSize = `${(current * available) / natural}px`
      }
    }
    fit()

    const observer = new ResizeObserver(fit)
    observer.observe(container)
    return () => observer.disconnect()
  }, [isVideoFill, section.title])

  useLayoutEffect(() => {
    if (isVideoFill) return
    const chars = queryChars(titleRef.current)
    if (!chars.length) return
    gsap.set(chars, reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: travel.sectionTitle })
  }, [isVideoFill, reduced])

  // The caption is scrubbed by scroll rather than played once, so it stays
  // tied to the scrollbar. Once the timeline completes it is left at its end
  // state, so scrolling further in either direction never fades it back out.
  useEffect(() => {
    const caption = captionRef.current
    const scroller = scrollContainerRef.current
    const slide = slideElementRef.current
    if (!caption || !scroller || !slide) return

    const chars = queryChars(caption)

    if (reduced) {
      gsap.set(chars, { opacity: 1, y: 0 })
      return
    }

    gsap.set(chars, { opacity: 0, y: travel.sectionCaption })

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: slide,
        scroller,
        start: `${revealWindow.start * 100}% top`,
        end: `${revealWindow.end * 100}% top`,
        scrub: 0.3,
        onLeave: () => isPhysics && setPhysicsActive(true),
        onLeaveBack: () => isPhysics && setPhysicsActive(false),
      },
    })
    timeline.to(chars, {
      opacity: 1,
      y: 0,
      stagger: stagger.sectionCaption,
      ease: ease.gentle,
    })

    return () => {
      timeline.scrollTrigger?.kill()
      timeline.kill()
    }
  }, [section.caption, isPhysics, reduced, scrollContainerRef])

  usePhysicsDrop(contentRef, PHYSICS_FLOOR_SELECTOR, physicsActive)

  const setRefs = (element: HTMLElement | null) => {
    slideElementRef.current = element
    if (slideRef) slideRef.current = element
  }

  const stickyClass = [
    'section-sticky',
    (isVideoFill || isVideoFrame) && 'section-sticky-centered',
  ]
    .filter(Boolean)
    .join(' ')

  const contentClass = [
    'section-content',
    isVideoFrame && 'section-content-video',
    isVideoFill && 'section-content-wide',
  ]
    .filter(Boolean)
    .join(' ')

  const slideClass = [
    'section-slide',
    isLight && 'section-slide-light',
    isVideoFill && 'section-slide-video-fill',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section ref={setRefs} className={slideClass} aria-label={section.title}>
      <div className={stickyClass}>
        <div ref={contentRef} className={contentClass}>
          {isVideoFrame ? (
            <div className="section-video-stack">
              <div
                className={videoFailed ? 'section-video-frame is-empty' : 'section-video-frame'}
              >
                {!videoFailed && (
                  <video
                    src={VIDEO_SRC}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                    onError={() => setVideoFailed(true)}
                  />
                )}
              </div>

              <div className="section-video-title-box">
                <svg
                  ref={strokeSvgRef}
                  className="section-video-title-stroke"
                  viewBox={`0 0 ${strokeSize.width || 1} ${strokeSize.height || 1}`}
                  aria-hidden="true"
                >
                  <rect
                    ref={strokeRectRef}
                    x="0.5"
                    y="0.5"
                    width={Math.max(1, strokeSize.width - 1)}
                    height={Math.max(1, strokeSize.height - 1)}
                  />
                </svg>
                <h2 className="section-title section-video-title" data-text={section.title}>
                  <SplitText text={section.title} mode="words" ref={titleRef} />
                </h2>
              </div>
            </div>
          ) : isVideoFill ? (
            <h2 className="section-title section-title-video-fill">
              {videoFailed ? (
                <>
                  {section.title.slice(0, section.title.indexOf(' '))}
                  <br />
                  {section.title.slice(section.title.indexOf(' ') + 1)}
                </>
              ) : (
                <VideoText
                  src={VIDEO_SRC}
                  label={section.title}
                  textRef={videoFillRef}
                  onError={() => setVideoFailed(true)}
                >
                  {section.title.slice(0, section.title.indexOf(' '))}
                  <br />
                  {section.title.slice(section.title.indexOf(' ') + 1)}
                </VideoText>
              )}
            </h2>
          ) : (
            <h2 className="section-title">
              <SplitText text={section.title} mode="chars" ref={titleRef} />
            </h2>
          )}

          {!isVideoFrame && (
            <p className="section-subtitle">
              <SplitText text={section.caption} mode="words" ref={captionRef} />
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
