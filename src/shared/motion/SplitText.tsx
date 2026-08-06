import { forwardRef } from 'react'
import './split-text.css'

/**
 * Spaces must be U+00A0.
 *
 * A `.char` is display:inline-block, and a plain U+0020 inside an
 * inline-block collapses to zero width, so the previous splitter rendered
 * any three-word title as "inrealbusinesses".
 */
const NBSP = '\u00A0'

export type SplitMode = 'chars' | 'words'

interface SplitTextProps {
  text: string
  /**
   * `chars` turns the first space into a line break and splits everything
   * else per character.
   *
   * `words` keeps each word atomic so its characters can never be broken
   * across a line, with a sized spacer element between words.
   */
  mode?: SplitMode
  className?: string
}

function renderChars(text: string) {
  const breakAt = text.indexOf(' ')

  return text
    .split('')
    .map((char, i) =>
      i === breakAt ? (
        <br key={`br-${i}`} />
      ) : (
        <span key={i} className="char">
          {char === ' ' ? NBSP : char}
        </span>
      )
    )
}

function renderWords(text: string) {
  const words = text.split(' ')
  const nodes: React.ReactNode[] = []

  words.forEach((word, wordIndex) => {
    nodes.push(
      <span key={`w-${wordIndex}`} className="word">
        {word.split('').map((char, charIndex) => (
          <span key={charIndex} className="char">
            {char}
          </span>
        ))}
      </span>
    )

    if (wordIndex < words.length - 1) {
      nodes.push(
        <span key={`s-${wordIndex}`} className="char-space">
          {NBSP}
        </span>
      )
    }
  })

  return nodes
}

/**
 * Renders the text twice: once intact for assistive technology, once shattered
 * into per-character spans for GSAP. The forwarded ref points at the shattered
 * span, so callers query `.char` from it.
 */
export const SplitText = forwardRef<HTMLSpanElement, SplitTextProps>(
  function SplitText({ text, mode = 'chars', className }, ref) {
    return (
      <>
        <span className="sr-only">{text}</span>
        <span className={className} ref={ref} aria-hidden="true">
          {mode === 'chars' ? renderChars(text) : renderWords(text)}
        </span>
      </>
    )
  }
)

/** Every `.char` inside a container, in document order. */
export function queryChars(root: Element | null | undefined): HTMLElement[] {
  if (!root) return []
  return Array.from(root.querySelectorAll<HTMLElement>('.char'))
}
