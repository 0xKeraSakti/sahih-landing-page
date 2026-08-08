import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion'

import './team-section.css'

gsap.registerPlugin(SplitText)

const DEFAULT_TITLE = 'The Squad'

/** Thumbnails map 1:1, in order, to the name blocks after the default one. */
const TEAM = [
  { name: 'Azka', src: '/azka.jpg' },
  { name: 'Ardial', src: '/ardial.jpg' },
] as const

const EASE = 'power4.out'
const STAGGER = { each: 0.025, from: 'center' } as const

/** Below this width nothing is wired up and the section renders statically. */
const DESKTOP_MIN_WIDTH = 900

export function TeamSection() {
  const rootRef = useRef<HTMLElement | null>(null)
  const rowRef = useRef<HTMLDivElement | null>(null)

  const reduced = usePrefersReducedMotion()

  useLayoutEffect(() => {
    const root = rootRef.current
    const row = rowRef.current
    if (!root || !row) return

    // Splitting happens outside gsap.context: context.revert() undoes tweens
    // but leaves the split DOM in place, so the splits are tracked by hand.
    const headings = Array.from(root.querySelectorAll<HTMLHeadingElement>('.name h1'))
    const splits = headings.map((heading) => {
      const split = new SplitText(heading, { type: 'chars' })
      split.chars.forEach((char) => char.classList.add('letter'))
      return split
    })

    const [defaultSplit, ...memberSplits] = splits
    if (!defaultSplit) return

    // Letters at +100% inside a -100% parent net to zero: the title is
    // visible on load, and it is the letters that move from here on.
    gsap.set(defaultSplit.chars, { y: '100%' })

    const grow = reduced ? 0 : 0.5
    const slide = reduced ? 0 : 0.75
    const thumbs = Array.from(row.querySelectorAll<HTMLElement>('.img'))
    const teardown: Array<() => void> = []

    if (window.innerWidth >= DESKTOP_MIN_WIDTH) {
      thumbs.forEach((thumb, index) => {
        const letters = memberSplits[index]?.chars
        if (!letters) return

        const enter = () => {
          gsap.to(thumb, { width: 140, height: 140, duration: grow, ease: EASE })
          gsap.to(letters, { y: '-100%', duration: slide, ease: EASE, stagger: STAGGER })
        }
        const leave = () => {
          gsap.to(thumb, { width: 70, height: 70, duration: grow, ease: EASE })
          gsap.to(letters, { y: '0%', duration: slide, ease: EASE, stagger: STAGGER })
        }

        thumb.addEventListener('mouseenter', enter)
        thumb.addEventListener('mouseleave', leave)
        teardown.push(() => {
          thumb.removeEventListener('mouseenter', enter)
          thumb.removeEventListener('mouseleave', leave)
        })
      })

      // Fires alongside the per-thumbnail handlers — entering a tile is also
      // entering the row — which is what swaps the group title out from
      // above while the member name arrives from below.
      const rowEnter = () =>
        gsap.to(defaultSplit.chars, { y: '0%', duration: slide, ease: EASE, stagger: STAGGER })
      const rowLeave = () =>
        gsap.to(defaultSplit.chars, { y: '100%', duration: slide, ease: EASE, stagger: STAGGER })

      row.addEventListener('mouseenter', rowEnter)
      row.addEventListener('mouseleave', rowLeave)
      teardown.push(() => {
        row.removeEventListener('mouseenter', rowEnter)
        row.removeEventListener('mouseleave', rowLeave)
      })
    }

    return () => {
      teardown.forEach((off) => off())
      gsap.killTweensOf(thumbs)
      splits.forEach((split) => split.revert())
    }
  }, [reduced])

  return (
    <section className="team" id="team" ref={rootRef}>
      <div className="profile-images" ref={rowRef}>
        {TEAM.map((member) => (
          <div className="img" key={member.name}>
            <img src={member.src} alt={member.name} />
          </div>
        ))}
      </div>

      <div className="profile-names">
        <div className="name default">
          <h1>{DEFAULT_TITLE}</h1>
        </div>
        {TEAM.map((member) => (
          <div className="name" key={member.name}>
            <h1>{member.name}</h1>
          </div>
        ))}
      </div>
    </section>
  )
}
