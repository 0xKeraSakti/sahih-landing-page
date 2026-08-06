# Bagi Hasil Warung, landing page

React + Vite + TypeScript. GSAP owns all scroll and animation.

## Run

```bash
npm install
npm run dev        # vite
npm run build      # tsc -b && vite build
npm run typecheck
npm run lint       # includes the architecture boundary rules
```

## Missing asset

`public/your-video.mp4` is not in this repo. Both the framed video on slide 2
and the video-filled title on slide 1 read it. Without it the page still runs:
the frame falls back to a hatched placeholder and the title renders as plain
type. Drop the file in `public/` to switch both on.

## Layers

Imports flow one way only, enforced by `no-restricted-imports` in
`eslint.config.js`:

```
app  ->  pages  ->  features  ->  shared
```

- A feature never imports another feature. If two need the same thing, it
  moves into `shared`.
- Every feature exposes only its `index.ts`. Deep paths into `ui/` or `model/`
  are private.
- `ui/` renders. `model/` holds state and side effects.

```
src/
  app/                        composition root and global styles
    styles/globals.css        tailwind, shadcn theme, base
    styles/tokens.css         design tokens
  pages/LandingPage.tsx       owns the scroll container
  features/
    hero-reveal/              cursor-driven SVG mask hero
    scroll-sections/          sticky rail, video fill, marching ants, physics
    email-capture/            interest-list form
  shared/
    content/slides.ts         copy, owned by neither feature
    motion/tokens.ts          every GSAP number
    motion/SplitText.tsx      the single character splitter
    hooks/                    reduced motion, element size
    ui/                       shadcn primitives
    lib/cn.ts
```

## Tokens

No raw hex and no raw length in a component stylesheet. No bare number in an
animation call.

Colour, type scale and layout rails live in `app/styles/tokens.css`. Durations,
easings, staggers and radii live in `shared/motion/tokens.ts`, because GSAP
takes numbers and cannot read CSS custom properties. CSS only mirrors the two
durations its own keyframes need.
