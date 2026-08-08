import { useEffect, useState, type RefObject } from 'react'

import { NAV_LINKS } from '@/shared/content/slides'
import { slugify } from '@/shared/lib/slugify'

interface HeroNavProps {
  /** Watched to decide when the bar has outlived the hero. */
  heroRef: RefObject<HTMLElement | null>
}

export function HeroNav({ heroRef }: HeroNavProps) {
  const [stuck, setStuck] = useState(false)

  // The bar is fixed, so it survives the hero either way. This only decides
  // which shape it wears: inset pill while any of the hero is still on screen,
  // full-width header once none of it is. IntersectionObserver rather than a
  // scroll handler, so nothing runs per frame — and root: null still accounts
  // for the clipping the scroll container applies to the hero.
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      threshold: 0,
    })
    observer.observe(hero)

    return () => observer.disconnect()
  }, [heroRef])

  return (
    <nav className={stuck ? 'pill-nav is-stuck' : 'pill-nav'} aria-label="Main">
      <div className="pill-nav-links">
        {NAV_LINKS.map((label) => (
          <a key={label} href={`#${slugify(label)}`}>
            {label}
          </a>
        ))}
      </div>

      <a className="pill-nav-brand" href="#top">
        SAHIH
      </a>

      <div className="pill-nav-actions">
        <a className="pill-nav-cta" href="#stay-updated">
          Get Started
        </a>
      </div>
    </nav>
  )
}
