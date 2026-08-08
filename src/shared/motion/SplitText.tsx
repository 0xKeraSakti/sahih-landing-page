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

export type SplitMode = 'chars' | 'words' | 'lines'

interface SplitTextProps {
  text: string
  /**
   * `chars` turns the first space into a line break and splits everything
   * else per character.
   *
   * `words` keeps each word atomic so its characters can never be broken
   * across a line, with a sized spacer element between words.
   *
   * `lines` is `chars` plus a real element per line, so each line can be
   * aligned independently. A `<br>` cannot be text-aligned on its own.
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

/**
 * Break at the space nearest the middle rather than the first one. Splitting
 * "Invest in real businesses" at the first space leaves a one-word line above
 * a three-word line, which reads as a mistake once the two halves are pushed
 * to opposite edges.
 */
function balancedBreak(text: string) {
  const middle = text.length / 2
  let best = -1

  for (let i = text.indexOf(' '); i !== -1; i = text.indexOf(' ', i + 1)) {
    if (best === -1 || Math.abs(i - middle) < Math.abs(best - middle)) best = i
  }

  return best
}

function renderLine(text: string, key: string, className: string) {
  return (
    <span key={key} className={className}>
      {text.split('').map((char, i) => (
        <span key={i} className="char">
          {char === ' ' ? NBSP : char}
        </span>
      ))}
    </span>
  )
}

function renderLines(text: string) {
  const breakAt = balancedBreak(text)
  if (breakAt === -1) return [renderLine(text, 'l-0', 'line line-lead')]

  return [
    renderLine(text.slice(0, breakAt), 'l-0', 'line line-lead'),
    renderLine(text.slice(breakAt + 1), 'l-1', 'line line-trail'),
  ]
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
          {mode === 'chars'
            ? renderChars(text)
            : mode === 'lines'
              ? renderLines(text)
              : renderWords(text)}
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
