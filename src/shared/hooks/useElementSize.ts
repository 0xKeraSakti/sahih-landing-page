import { useLayoutEffect, useState, type RefObject } from 'react'

export interface Size {
  width: number
  height: number
}

const EPSILON = 0.5

/**
 * Rendered pixel size of an element, kept current by ResizeObserver.
 * State only updates on a change larger than half a pixel, so subpixel
 * jitter during a scroll does not re-render the tree.
 */
export function useElementSize(ref: RefObject<Element | null>): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const measure = () => {
      const rect = element.getBoundingClientRect()
      setSize((prev) =>
        Math.abs(prev.width - rect.width) < EPSILON &&
        Math.abs(prev.height - rect.height) < EPSILON
          ? prev
          : { width: rect.width, height: rect.height }
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return size
}
