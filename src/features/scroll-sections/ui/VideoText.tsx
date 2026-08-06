import { useEffect, useRef, type ReactNode, type RefObject } from 'react'

import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion'
import { videoFill } from '@/shared/motion/tokens'

import './video-text.css'

interface VideoTextProps {
  src: string
  /** Intact string for assistive technology. */
  label: string
  /** The visible type. Rendered white, so multiply knocks it out to the video. */
  children: ReactNode
  className?: string
  onError?: () => void
  /** Points at the element carrying the type, for fit-to-container sizing. */
  textRef?: RefObject<HTMLDivElement>
}

/**
 * Video-filled text with no canvas.
 *
 * `background-clip: text` cannot take a video, which is why the previous build
 * captured frames into a canvas, JPEG-encoded them, and pushed the result into
 * `background-image` at a capped frame rate. That cost a main-thread encode per
 * frame and, worse, capped the fill at the canvas size, so a 360px image was
 * being stretched across a title three times wider.
 *
 * Three layers instead:
 *
 *   backdrop   the video, playing natively at its own resolution
 *   knockout   black panel with white text, mix-blend-mode: multiply
 *   result     white text multiplies to the video, black panel to black
 *
 * multiply means `result = backdrop x source`. White is 1, so wherever a glyph
 * is painted the video passes through untouched. Black is 0, so everywhere else
 * collapses to black. Antialiased glyph edges land partway between and fade
 * into the surround, which is exactly right.
 *
 * The whole thing is GPU-composited: nothing on the frame path, full playback
 * rate, and the type stays vector-crisp at any pixel density.
 */
export function VideoText({
  src,
  label,
  children,
  className,
  onError,
  textRef,
}: VideoTextProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const reduced = usePrefersReducedMotion()

  // Reduced motion still gets a filled title, just a still one. Video playback
  // is not a CSS animation, so this cannot be handled in the media query.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!reduced) {
      void video.play().catch(() => {
        /* autoplay blocked; the first frame is already painted */
      })
      return
    }

    video.pause()
    const seekToFrame = () => {
      video.currentTime = Math.min(1, (video.duration || 1) * videoFill.seekFraction)
    }
    if (video.readyState >= 1) seekToFrame()
    else video.addEventListener('loadedmetadata', seekToFrame, { once: true })

    return () => video.removeEventListener('loadedmetadata', seekToFrame)
  }, [reduced])

  return (
    <div className={className ? `video-text ${className}` : 'video-text'}>
      <video
        ref={videoRef}
        className="video-text__media"
        src={src}
        autoPlay={!reduced}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        onError={onError}
      />

      <div className="video-text__knockout" ref={textRef} aria-hidden="true">
        {children}
      </div>

      <span className="sr-only">{label}</span>
    </div>
  )
}
