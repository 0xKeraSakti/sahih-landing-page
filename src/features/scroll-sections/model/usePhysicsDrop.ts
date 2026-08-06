import { useEffect, type RefObject } from 'react'
import Matter from 'matter-js'

import { getPrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion'
import { queryChars } from '@/shared/motion/SplitText'
import { physics, zIndex } from '@/shared/motion/tokens'

/**
 * While active, every `.char` inside the container becomes a Matter.js body at
 * its own current on-screen position and falls under gravity, stopped by an
 * invisible floor pinned to the top edge of the next section. A physics drop
 * rather than a scripted animation.
 *
 * Fully reversible: when `active` goes back to false, every character is
 * restored to normal in-flow rendering so it can drop again next time.
 */
export function usePhysicsDrop(
  containerRef: RefObject<HTMLElement | null>,
  floorSelector: string,
  active: boolean
): void {
  useEffect(() => {
    const container = containerRef.current
    const floorElement = document.querySelector(floorSelector)
    if (!active || !container || !floorElement) return
    if (getPrefersReducedMotion()) return

    const chars = queryChars(container)
    if (!chars.length) return

    const { Engine, Runner, Bodies, Composite, Body } = Matter
    const engine = Engine.create({ gravity: { x: 0, y: physics.gravityY, scale: 0.001 } })

    const floor = Bodies.rectangle(
      window.innerWidth / 2,
      floorElement.getBoundingClientRect().top,
      window.innerWidth * 2,
      physics.floorThickness,
      { isStatic: true }
    )

    // Every rect is read before any element is mutated. Switching even one
    // character to position:fixed pulls it out of flow and reflows its still
    // in-flow siblings, which would corrupt any rect measured after it.
    const rects = chars.map((element) => element.getBoundingClientRect())

    const bodies = chars.map((element, i) => {
      const rect = rects[i]
      element.dataset.baseLeft = String(rect.left)
      element.dataset.baseTop = String(rect.top)
      element.style.position = 'fixed'
      element.style.left = `${rect.left}px`
      element.style.top = `${rect.top}px`
      element.style.margin = '0'
      element.style.zIndex = String(zIndex.fallingChar)

      return Bodies.rectangle(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        Math.max(rect.width, physics.minBodyEdge),
        Math.max(rect.height, physics.minBodyEdge),
        { restitution: physics.restitution, friction: physics.friction, angle: 0 }
      )
    })

    Composite.add(engine.world, [floor, ...bodies])
    const runner = Runner.create()
    Runner.run(runner, engine)

    let frame = 0
    const sync = () => {
      frame = requestAnimationFrame(sync)

      // One layout read per frame, taken before any write, and the floor is
      // only moved once it has actually drifted a visible amount.
      const floorY = floorElement.getBoundingClientRect().top
      if (Math.abs(floorY - floor.position.y) > physics.floorEpsilon) {
        Body.setPosition(floor, { x: floor.position.x, y: floorY })
      }

      for (let i = 0; i < bodies.length; i += 1) {
        const body = bodies[i]
        const element = chars[i]
        const width = body.bounds.max.x - body.bounds.min.x
        const height = body.bounds.max.y - body.bounds.min.y
        const x = body.position.x - width / 2 - Number(element.dataset.baseLeft)
        const y = body.position.y - height / 2 - Number(element.dataset.baseTop)
        element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${body.angle}rad)`
      }
    }
    sync()

    return () => {
      cancelAnimationFrame(frame)
      Runner.stop(runner)
      Composite.clear(engine.world, false)
      Engine.clear(engine)

      chars.forEach((element) => {
        element.style.position = ''
        element.style.left = ''
        element.style.top = ''
        element.style.margin = ''
        element.style.zIndex = ''
        element.style.transform = ''
        delete element.dataset.baseLeft
        delete element.dataset.baseTop
      })
    }
  }, [active, containerRef, floorSelector])
}
