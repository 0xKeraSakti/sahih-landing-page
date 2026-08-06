import { NAV_LINKS } from '@/shared/content/slides'

const slugify = (label: string) => label.toLowerCase().replace(/[^a-z]+/g, '-')

export function HeroNav() {
  return (
    <nav className="pill-nav" aria-label="Main">
      <a className="pill-nav-brand" href="#top">
        Bagi Hasil Warung
      </a>

      <div className="pill-nav-links">
        {NAV_LINKS.map((label) => (
          <a key={label} href={`#${slugify(label)}`}>
            {label}
          </a>
        ))}
      </div>

      <a className="pill-nav-cta" href="#stay-updated">
        Join the interest list
      </a>
    </nav>
  )
}
