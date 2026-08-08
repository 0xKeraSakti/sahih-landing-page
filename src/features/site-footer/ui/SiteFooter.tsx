import { NAV_LINKS } from '@/shared/content/slides'
import { slugify } from '@/shared/lib/slugify'

import './site-footer.css'

const BRAND = 'SAHIH'

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="site-footer-top">
        <a className="site-footer-brand" href="#top">
          {BRAND}
        </a>

        <nav className="site-footer-nav" aria-label="Footer">
          {NAV_LINKS.map((label) => (
            <a key={label} href={`#${slugify(label)}`}>
              {label}
            </a>
          ))}
          <a href="#stay-updated">Get Started</a>
        </nav>
      </div>

      <div className="site-footer-base">
        <p>
          &copy; {year} {BRAND}. All rights reserved.
        </p>
        <p>Sharia-compliant profit sharing for Indonesian warungs.</p>
      </div>
    </footer>
  )
}
