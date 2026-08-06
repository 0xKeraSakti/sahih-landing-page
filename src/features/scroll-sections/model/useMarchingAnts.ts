import { useCallback, useEffect, useRef, type RefObject } from 'react'
import gsap from 'gsap'

import { getPrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion'
import type { Size } from '@/shared/hooks/useElementSize'
import { ants, duration, ease } from '@/shared/motion/tokens'

/**
 * A dash chases around the outline's own real perimeter, forever. Playback
 * speed starts near a standstill and is driven by scroll progress through the
 * slide rather than by elapsed time.
 *
 * Returns a setter for scroll progress. The caller feeds it from
 * `useSlideProgress`.
 *
 * Requires the SVG viewBox to be in pixel units. The previous version used
 * `preserveAspectRatio="none"` on a fixed `0 0 100 100` box, so one user unit
 * meant something different horizontally than vertically. `getTotalLength()`
 * returns user units, which meant dashes on the top edge rendered at a
 * completely different length from dashes on the sides.
 */
export function useMarchingAnts(
  rectRef: RefObject<SVGRectElement | null>,
  size: Size,
  enabled: boolean
): (progress: number) => void {
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    const rect = rectRef.current
    if (!enabled || !rect) return
    if (!size.width || !size.height) return
    if (getPrefersReducedMotion()) return

    const perimeter = rect.getTotalLength()
    if (!perimeter) return

    // Randomised dash and gap segments, a mix of long and short with a floor
    // so nothing shrinks to an invisible dot, repeated around the perimeter.
    const minSegment = perimeter * ants.minSegmentRatio
    const maxSegment = perimeter * ants.maxSegmentRatio
    const segments: number[] = []
    let used = 0

    while (used < perimeter) {
      const length = minSegment + Math.random() * (maxSegment - minSegment)
      const clamped = Math.min(length, perimeter - used)
      segments.push(clamped)
      used += clamped
    }

    // SVG repeats a dash list that has an odd number of values in order to make
    // it even, which doubles the pattern length. Animating strokeDashoffset by
    // exactly one perimeter then landed halfway through the doubled pattern and
    // the loop visibly jumped on every repeat. Merging the final two segments
    // when the count is odd keeps the pattern exactly one perimeter long.
    if (segments.length % 2 === 1 && segments.length > 1) {
      const last = segments.pop() as number
      segments[segments.length - 1] += last
    }

    gsap.set(rect, { strokeDasharray: segments.join(' '), strokeDashoffset: 0 })

    const tween = gsap.to(rect, {
      strokeDashoffset: -perimeter,
      duration: duration.antsLap,
      ease: ease.none,
      repeat: -1,
      paused: true,
    })
    tween.timeScale(ants.minSpeed)
    tween.play()
    tweenRef.current = tween

    return () => {
      tween.kill()
      tweenRef.current = null
    }
  }, [enabled, rectRef, size.width, size.height])

  // Max speed is only reached near the very end of the slide. The exponent
  // keeps speed low for most of the scroll and reserves the ramp for the
  // final stretch.
  return useCallback((progress: number) => {
    const tween = tweenRef.current
    if (!tween) return
    const normalised = Math.min(1, progress / ants.speedThreshold)
    const eased = normalised ** ants.speedCurve
    tween.timeScale(ants.minSpeed + eased * (ants.maxSpeed - ants.minSpeed))
  }, [])
}
