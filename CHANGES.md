# What changed from the previous build

Behaviour is unchanged. Every animation, timing, easing and interaction is the
same. What follows is structure, correctness and performance only.

## Bugs fixed

1. **Collapsed spaces in split text.** Spaces were rendered as a bare U+0020
   inside a `display:inline-block` span, which collapses to zero width. Any
   three-word title rendered as `inrealbusinesses`. There were also two
   splitters, a JSX one and an `innerHTML` one, and only the second used
   `&nbsp;`, so the hero text visibly changed shape the first time a slide
   advanced. One `SplitText` component now serves both paths.

2. **Video-fill canvas never resized.** The guard was `if (canvas.width === 0)`,
   but a freshly created canvas is 300x150, never 0. It never ran once, so every
   frame was drawn squashed into a 2:1 box regardless of the source aspect ratio.

3. **`toDataURL` blocking the main thread.** JPEG was encoded synchronously at
   15fps. Replaced with `toBlob` plus an object URL, with revoke and an
   in-flight guard so a slow encode cannot queue behind itself.

4. **Odd `strokeDasharray` length.** SVG repeats a dash list with an odd number
   of values to make it even, doubling the pattern. Animating `strokeDashoffset`
   by exactly one perimeter then landed halfway through the doubled pattern, so
   the marching-ants loop jumped on every repeat. The last two segments are now
   merged when the count is odd.

5. **Distorted dashes.** `preserveAspectRatio="none"` on a fixed `0 0 100 100`
   viewBox meant one user unit was a different physical length horizontally than
   vertically, while `getTotalLength()` returns user units. Dashes on the top
   edge rendered nothing like dashes on the sides. The viewBox is now in pixels,
   tracked by ResizeObserver.

6. **Tween accumulation.** Three `gsap.to` calls fired per `pointermove` with
   GSAP 3's default `overwrite: false`. A few seconds of hovering left hundreds
   of live tweens competing. Now `overwrite: 'auto'`, plus an open/closed guard
   so the hover tween only fires on a state change.

7. **Blob drift.** A looping `scale` tween ran on the same `<circle>` whose `r`
   was being tweened. GSAP routes SVG scale through its own transform path,
   which computes its own origin and ignores `transform-box: fill-box`. The two
   inputs are now combined in JS on separate token objects, with no transform.

8. **Nav inside the click target.** The pill nav sits inside the hero, so every
   click on "Join the interest list" also advanced the slide.

9. **Static scroll container.** Both GSAP and framer-motion walk `offsetParent`
   up to the scroll container to measure a target, and a static container is
   skipped in that walk. It is now `position: relative`.

10. **Cleanup gaps.** The `loadeddata` listener was anonymous and never removed,
    tweens were not killed on unmount, and the Matter world was cleared without
    `Composite.clear`.

## Structure

- JavaScript to TypeScript, strict, with `noUnusedLocals` and
  `verbatimModuleSyntax`. `components.json` now has `"tsx": true`.
- Feature-based layers with the import direction enforced by ESLint rather than
  written down and hoped for.
- `SectionPanel.jsx` was 515 lines mixing three animation systems with JSX. It
  is now four `model/` hooks and three `ui/` components.
- Every colour, length, duration, easing and stagger moved into the two token
  files.

## Libraries

- **framer-motion removed.** It and GSAP ScrollTrigger were both observing the
  same custom scroller, so two independent measurement systems could disagree.
  `useScroll` is replaced by `useSlideProgress`, one ScrollTrigger per slide.
  Bundle went from 379.7 kB to 364.3 kB, and 444 modules to 62.
- **`@fontsource-variable/geist` removed**, it was never imported.
- **`skiper19.jsx` removed**, an unused vendor demo that was the only other
  framer-motion consumer.
- `@gsap/react` was considered and skipped. `useGSAP` auto-reverts everything
  created in its scope including `gsap.set`, which fights the stateful mask
  logic. Core `gsap` with explicit teardown is the smaller, more predictable
  choice.

## Quality floor

Keyboard control on the hero, tap zones for coarse pointers, intact text for
screen readers alongside the shattered spans, visible focus rings,
`prefers-reduced-motion` honoured throughout, and a 1024px breakpoint, below
which the 380px sidebar gutter had left almost no room for content.

## Video-filled title, second pass

The canvas pipeline is gone. `useVideoTextFill.ts` is deleted and replaced by
`ui/VideoText.tsx`.

`background-clip: text` cannot accept a video, which is the whole reason the
canvas existed. The new component stacks three layers instead:

    backdrop   the <video>, playing natively
    knockout   black panel, white text, mix-blend-mode: multiply
    result     white text multiplies to the video, black panel to black

multiply is `result = backdrop x source`. White is 1, so the video passes
through the glyphs untouched. Black is 0, so the rest collapses to black.
Antialiased edges land between the two and fade into the surround.

What this changes in practice:

- **Resolution.** The old fill was capped at a 360px canvas and then stretched
  across a title roughly three times wider. It was a 360px JPEG upscaled 3x.
  The video now plays at its own resolution and the type is vector-crisp at any
  pixel density.
- **Frame rate.** 15fps ceiling becomes the video's real rate.
- **Main thread.** One JPEG encode plus one style write per frame becomes zero
  work per frame. The layer is GPU-composited.
- **Selection and search.** The title is real DOM text again rather than a
  background image, so it is selectable and findable.

`isolation: isolate` on the wrapper is load-bearing; without it the blend
reaches past the box and multiplies against the rest of the page.

The knockout collapses to pure black, so the video-fill slide now paints
`--color-knockout-base` rather than the section's near-black
`--color-canvas-void`. Otherwise the panel reads as a slightly different
rectangle sitting on the section.

Reduced motion is handled in the component rather than the stylesheet, because
video playback is not a CSS animation. The title still fills, it just holds a
still frame.
