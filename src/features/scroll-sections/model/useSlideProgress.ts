import { useEffect, useRef, type RefObject } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Scroll progress across a slide, 0 when its top meets the scroller's top and
 * 1 when its bottom meets the scroller's bottom.
 *
 * This replaces framer-motion's `useScroll({ target, container, offset:
 * ['start start', 'end end'] })`. The page previously ran ScrollTrigger and
 * framer-motion simultaneously against the same custom scroller, so two
 * independent measurement systems were observing one element and could
 * disagree. One engine now owns scroll.
 *
 * The callback is read through a ref, so passing an inline function does not
 * tear down and recreate the trigger on every render.
 */
export function useSlideProgress(
  targetRef: RefObject<HTMLElement | null>,
  scrollerRef: RefObject<HTMLElement | null>,
  onProgress: (progress: number) => void
): void {
  const callbackRef = useRef(onProgress)
  callbackRef.current = onProgress

  useEffect(() => {
    const target = targetRef.current
    const scroller = scrollerRef.current
    if (!target || !scroller) return

    const trigger = ScrollTrigger.create({
      trigger: target,
      scroller,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => callbackRef.current(self.progress),
    })

    // ScrollTrigger only fires onUpdate on movement, where framer-motion
    // emitted an initial measurement. Match that so a slide already in view on
    // load still reports its progress.
    callbackRef.current(trigger.progress)

    return () => {
      trigger.kill()
    }
  }, [targetRef, scrollerRef])
}
