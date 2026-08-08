import { useCallback, useEffect, useRef, type RefObject } from 'react'
import gsap from 'gsap'

import type { Slide } from '@/shared/content/slides'
import { queryChars } from '@/shared/motion/SplitText'
import { duration, ease, mask, stagger, travel } from '@/shared/motion/tokens'

interface MaskRevealRefs {
  hero: RefObject<HTMLElement | null>
  baseSlide: RefObject<HTMLElement | null>
  frontSlide: RefObject<HTMLElement | null>
  blob: RefObject<SVGCircleElement | null>
  arrow: RefObject<HTMLElement | null>
  headline: RefObject<HTMLElement | null>
}

interface MaskRevealOptions {
  slides: readonly Slide[]
  refs: MaskRevealRefs
  reduced: boolean
  /** Fired once the iris has swallowed the hero and the swap is committed. */
  onAdvance: (nextIndex: number, goingRight: boolean) => void
}

export type Advance = (goingRight: boolean, originX?: number, originY?: number) => void

const setBackground = (element: HTMLElement | null, url: string) => {
  if (element) element.style.backgroundImage = `url(${url})`
}

/**
 * Back layer holds the current slide and is masked. Front layer holds whichever
 * neighbour is being peeked. A black circle punched into the white mask lets
 * the front layer show through around the cursor.
 */
export function useMaskReveal({
  slides,
  refs,
  reduced,
  onAdvance,
}: MaskRevealOptions): Advance {
  // Radius has two independent inputs: the tweened base size and the idle
  // breathing multiplier. They live on separate objects so a tween on one can
  // never overwrite the other, and they are combined in JS rather than layering
  // a GSAP `scale` on top of an `r` tween. GSAP routes SVG scale through its own
  // transform path, which computes its own origin and ignores
  // `transform-box: fill-box`, so the old approach drifted the blob off-centre.
  const baseRadius = useRef({ value: 0 })
  const wobble = useRef({ value: 1 })
  const wobbleTween = useRef<gsap.core.Tween | null>(null)

  const slideIndex = useRef(0)
  const revealed = useRef(false)
  const animating = useRef(false)
  const switching = useRef(false)
  const blobOpen = useRef(false)
  const previewSide = useRef<'left' | 'right' | null>('right')

  const advanceRef = useRef<Advance>(() => {})
  const onAdvanceRef = useRef(onAdvance)
  onAdvanceRef.current = onAdvance

  const neighbourIndex = useCallback(
    (index: number, goingRight: boolean) =>
      goingRight
        ? (index + 1) % slides.length
        : (index - 1 + slides.length) % slides.length,
    [slides.length]
  )

  useEffect(() => {
    const radius = baseRadius.current
    const breathe = wobble.current

    const hero = refs.hero.current
    const baseSlide = refs.baseSlide.current
    const frontSlide = refs.frontSlide.current
    const blob = refs.blob.current
    const arrow = refs.arrow.current
    if (!hero || !blob) return

    const applyRadius = () => {
      blob.setAttribute('r', String(Math.max(0, radius.value * breathe.value)))
    }

    setBackground(baseSlide, slides[slideIndex.current].url)
    setBackground(frontSlide, slides[neighbourIndex(slideIndex.current, true)].url)
    previewSide.current = 'right'

    radius.value = 0
    breathe.value = 1
    applyRadius()
    gsap.set(blob, { opacity: 0 })

    if (!reduced) {
      wobbleTween.current = gsap.to(breathe, {
        value: mask.wobblePeak,
        duration: duration.blobWobble,
        ease: ease.breathe,
        repeat: -1,
        yoyo: true,
        onUpdate: applyRadius,
      })
    }

    // `overwrite: 'auto'` rather than `true`: it kills only tweens that touch
    // the same property. The previous build queued three fresh tweens on every
    // pointermove with GSAP's default `overwrite: false`, so a few seconds of
    // hovering left hundreds of live tweens competing for the same values.
    const tweenRadius = (value: number, vars: gsap.TweenVars = {}) =>
      gsap.to(radius, {
        value,
        overwrite: 'auto',
        onUpdate: applyRadius,
        ...vars,
      })

    const openBlob = () => {
      if (blobOpen.current) return
      blobOpen.current = true
      gsap.to(blob, { opacity: 1, duration: duration.blobFade, overwrite: 'auto' })
      tweenRadius(mask.hoverRadius, { duration: duration.blobOpen, ease: ease.out })
    }

    // Open immediately so the reveal is visible on first paint instead of
    // waiting for a pointermove that may never come before the first click.
    // Coarse pointers use the tap zones instead and never see the custom
    // cursor (see the `pointer: fine` guard in hero-reveal.css), so they
    // skip this — opening it there would show a blob nothing ever moves.
    // Deferred a frame so the hero has committed layout (a 100vh section can
    // still measure 0 on the same tick it mounts).
    let openFrame = 0
    if (window.matchMedia('(pointer: fine)').matches) {
      openFrame = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect()
        blob.setAttribute('cx', String(rect.width * 0.75))
        blob.setAttribute('cy', String(rect.height / 2))
        gsap.set(arrow, { left: rect.width * 0.75, top: rect.height / 2, rotate: 180 })
        gsap.to(arrow, { opacity: 1, duration: duration.arrowFade, overwrite: 'auto' })
        openBlob()
      })
    }

    const localPoint = (event: PointerEvent | MouseEvent) => {
      const rect = hero.getBoundingClientRect()
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        width: rect.width,
      }
    }

    const closeReveal = () => {
      switching.current = false
      blobOpen.current = false
      gsap.to([blob, arrow], { opacity: 0, duration: duration.blobClose, overwrite: 'auto' })
      tweenRadius(0, { duration: duration.blobClose })
    }

    // Latched so crossing into the nav collapses the reveal once, rather than
    // queueing a fresh close tween on every move while the pointer sits there.
    let overNav = false

    const handlePointerMove = (event: PointerEvent) => {
      if (animating.current) return
      // Touch gets the tap zones instead; a coarse pointer cannot hover, so
      // tracking it here would leave the blob stranded wherever the finger lifted.
      if (event.pointerType === 'touch') return

      // The nav sits inside the hero, so its pointer events bubble to here.
      // The reveal collapses rather than tracks: the arrow points at a slide
      // change that a click on the nav will not perform, and the nav has its
      // own hover treatment that the iris would fight with. Moving back off
      // the nav reopens it through the normal path below.
      if ((event.target as Element | null)?.closest('.pill-nav')) {
        if (!overNav) {
          overNav = true
          closeReveal()
        }
        return
      }
      overNav = false

      const { x, y, width } = localPoint(event)
      const goingRight = x > width / 2
      const side = goingRight ? 'right' : 'left'

      if (revealed.current) {
        revealed.current = false
        blobOpen.current = false
        gsap.killTweensOf(radius)
        radius.value = 0
        applyRadius()
      }

      // Position tracks the pointer exactly; only rotation and opacity are eased.
      gsap.set(arrow, { left: x, top: y })
      gsap.to(arrow, {
        rotate: goingRight ? 180 : 0,
        duration: duration.arrowRotate,
        ease: ease.out,
        overwrite: 'auto',
      })
      gsap.to(arrow, { opacity: 1, duration: duration.arrowFade, overwrite: 'auto' })

      blob.setAttribute('cx', String(x))
      blob.setAttribute('cy', String(y))

      if (previewSide.current === null) {
        previewSide.current = side
        setBackground(frontSlide, slides[neighbourIndex(slideIndex.current, goingRight)].url)
      } else if (previewSide.current !== side && !switching.current) {
        // Crossed the midpoint. Close the hole, swap the peeked neighbour
        // underneath, then reopen. Position keeps tracking throughout.
        switching.current = true
        previewSide.current = side
        blobOpen.current = false

        tweenRadius(0, {
          duration: duration.blobSwitchClose,
          ease: ease.in,
          onComplete: () => {
            setBackground(
              frontSlide,
              slides[neighbourIndex(slideIndex.current, goingRight)].url
            )
            blobOpen.current = true
            tweenRadius(mask.hoverRadius, {
              duration: duration.blobSwitchOpen,
              ease: ease.out,
              onComplete: () => {
                switching.current = false
              },
            })
          },
        })
        return
      }

      if (!switching.current) openBlob()
    }

    const handlePointerLeave = () => {
      overNav = false
      if (revealed.current) return
      closeReveal()
    }

    const advance: Advance = (goingRight, originX, originY) => {
      if (animating.current || switching.current) return
      animating.current = true
      wobbleTween.current?.pause()

      const rect = hero.getBoundingClientRect()
      const x = originX ?? (goingRight ? rect.width * 0.75 : rect.width * 0.25)
      const y = originY ?? rect.height / 2
      const nextIndex = neighbourIndex(slideIndex.current, goingRight)

      // Explicit rather than relying on whatever the last hover left behind,
      // so keyboard and tap advance from a known state.
      setBackground(frontSlide, slides[nextIndex].url)
      blob.setAttribute('cx', String(x))
      blob.setAttribute('cy', String(y))
      gsap.set(blob, { opacity: 1 })

      gsap.to(arrow, { opacity: 0, duration: duration.arrowFade, overwrite: 'auto' })

      const commit = () => {
        slideIndex.current = nextIndex
        setBackground(baseSlide, slides[nextIndex].url)

        gsap.set(blob, { opacity: 0 })
        radius.value = 0
        breathe.value = 1
        applyRadius()
        wobbleTween.current?.restart()

        revealed.current = true
        previewSide.current = null
        blobOpen.current = false
        animating.current = false

        onAdvanceRef.current(nextIndex, goingRight)
      }

      if (reduced) {
        commit()
        return
      }

      const chars = queryChars(refs.headline.current)
      if (chars.length) {
        gsap.to(chars, {
          opacity: 0,
          y: travel.headline,
          duration: duration.headlineOut,
          stagger: stagger.headlineOut,
          overwrite: 'auto',
        })
      }

      const maxRadius = Math.hypot(
        Math.max(x, rect.width - x),
        Math.max(y, rect.height - y)
      )

      tweenRadius(maxRadius, {
        duration: duration.iris,
        ease: ease.inOut,
        onComplete: commit,
      })
    }

    advanceRef.current = advance

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      // The nav and the tap zones live inside the hero, so without this every
      // click on "Join the interest list" also advanced the slide.
      if (target?.closest('.pill-nav, .hero-tap-zones')) return
      const { x, y, width } = localPoint(event)
      advance(x > width / 2, x, y)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as Element | null
      if (target?.closest('.pill-nav, .hero-tap-zones')) return

      if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        advance(true)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        advance(false)
      }
    }

    hero.addEventListener('pointermove', handlePointerMove)
    hero.addEventListener('pointerleave', handlePointerLeave)
    hero.addEventListener('click', handleClick)
    hero.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(openFrame)
      hero.removeEventListener('pointermove', handlePointerMove)
      hero.removeEventListener('pointerleave', handlePointerLeave)
      hero.removeEventListener('click', handleClick)
      hero.removeEventListener('keydown', handleKeyDown)
      wobbleTween.current?.kill()
      wobbleTween.current = null
      gsap.killTweensOf([radius, breathe])
      gsap.killTweensOf([blob, arrow].filter(Boolean) as Element[])
    }
  }, [slides, refs, reduced, neighbourIndex])

  return useCallback<Advance>(
    (goingRight, originX, originY) => advanceRef.current(goingRight, originX, originY),
    []
  )
}
