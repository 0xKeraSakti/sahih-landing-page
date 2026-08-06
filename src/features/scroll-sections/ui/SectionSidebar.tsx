import type { Slide } from '@/shared/content/slides'

interface SectionSidebarProps {
  sections: readonly Slide[]
  activeIndex: number
  /** The sticky rail sits over whichever slide is behind it, so its colour
   *  follows that slide rather than being tracked per item. */
  onLight: boolean
}

export function SectionSidebar({ sections, activeIndex, onLight }: SectionSidebarProps) {
  return (
    <ul className={onLight ? 'section-rail is-on-light' : 'section-rail'}>
      {sections.map((section, index) => (
        <li
          key={section.title}
          className={index === activeIndex ? 'is-active' : undefined}
          aria-current={index === activeIndex ? 'true' : undefined}
        >
          <span className="section-dot" aria-hidden="true" />
          {section.title}
        </li>
      ))}
    </ul>
  )
}
