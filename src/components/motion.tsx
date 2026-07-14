'use client';

/**
 * Motion primitives for Vaizer's quiet animation language: quiet, once-only
 * reveals and gently staggered grids. Server components compose these via
 * children. Movement is small (16-24px), eased to match the CSS easings in
 * globals.css, and fully disabled for prefers-reduced-motion users (opacity
 * fades remain, transforms are dropped).
 */

import type { CSSProperties, ReactNode } from 'react';
import { MotionConfig, motion, useReducedMotion, type Transition, type Variants } from 'motion/react';

/** Matches cubic-bezier(0.22, 1, 0.36, 1) used throughout globals.css. */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Trigger slightly before elements are fully visible; animate once only. */
const VIEWPORT = { once: true, margin: '-80px' as const };

/** A soft, non-cartoonish settle for hero graphics. */
const SOFT_SPRING = { type: 'spring', stiffness: 80, damping: 13, mass: 0.9 } as const;

type Direction = 'up' | 'down' | 'left' | 'right';

const TAGS = {
  div: motion.div,
  span: motion.span,
  p: motion.p,
  header: motion.header,
  section: motion.section,
  ul: motion.ul,
  ol: motion.ol,
  li: motion.li,
} as const;

type Tag = keyof typeof TAGS;

/** "up" rises into place, "down" drops in, "left"/"right" slide in from that side. */
function offsetFor(direction: Direction, distance: number): { x?: number; y?: number } {
  switch (direction) {
    case 'up':
      return { y: distance };
    case 'down':
      return { y: -distance };
    case 'left':
      return { x: -distance };
    case 'right':
      return { x: distance };
  }
}

/**
 * Site-wide motion configuration: honor the user's prefers-reduced-motion
 * setting so all transform animations are dropped (opacity-only) for them.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/**
 * Fades + slides an element into place, once. Scroll-triggered by default;
 * pass `load` to animate on mount instead (e.g. above-the-fold heroes).
 * `spring` swaps the movement for a soft spring settle (opacity still eases).
 */
export function Reveal({
  children,
  className,
  style,
  as = 'div',
  direction = 'up',
  distance = 20,
  delay = 0,
  duration = 0.65,
  rotate = 0,
  spring = false,
  load = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: Tag;
  direction?: Direction;
  /** Travel distance in px; keep small (16-24). */
  distance?: number;
  delay?: number;
  duration?: number;
  /** Initial rotation in degrees, settling to 0 (use tiny values). */
  rotate?: number;
  spring?: boolean;
  /** Animate on mount instead of on scroll into view. */
  load?: boolean;
}) {
  const reduced = useReducedMotion();
  const Component = TAGS[as] as typeof motion.div;

  const hidden = reduced
    ? { opacity: 0 }
    : { opacity: 0, ...offsetFor(direction, distance), ...(rotate ? { rotate } : {}) };
  const visible = { opacity: 1, x: 0, y: 0, rotate: 0 };

  const movement: Transition = spring && !reduced ? { ...SOFT_SPRING, delay } : { duration, ease: EASE, delay };
  const transition: Transition = {
    ...movement,
    opacity: { duration: spring ? 0.5 : duration, ease: EASE, delay },
  };

  return (
    <Component
      className={className}
      style={style}
      initial={hidden}
      transition={transition}
      {...(load ? { animate: visible } : { whileInView: visible, viewport: VIEWPORT })}
    >
      {children}
    </Component>
  );
}

/**
 * Container for a cascading grid/list: children wrapped in StaggerItem fade
 * up ~80ms apart once the container scrolls into view (or on mount with
 * `load`). Animates once only.
 */
export function Stagger({
  children,
  className,
  as = 'div',
  delay = 0,
  gap = 0.08,
  load = false,
}: {
  children: ReactNode;
  className?: string;
  as?: Tag;
  delay?: number;
  /** Seconds between each child's entrance. */
  gap?: number;
  load?: boolean;
}) {
  const Component = TAGS[as] as typeof motion.div;
  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: gap, delayChildren: delay } },
  };

  return (
    <Component
      className={className}
      variants={container}
      initial="hidden"
      {...(load ? { animate: 'visible' } : { whileInView: 'visible', viewport: VIEWPORT })}
    >
      {children}
    </Component>
  );
}

/**
 * One item inside a Stagger container. `instant` renders it in its settled
 * state immediately (used by filterable grids so re-filtering never feels
 * sluggish).
 */
export function StaggerItem({
  children,
  className,
  as = 'div',
  instant = false,
}: {
  children: ReactNode;
  className?: string;
  as?: Tag;
  instant?: boolean;
}) {
  const reduced = useReducedMotion();
  const Component = TAGS[as] as typeof motion.div;
  const item: Variants = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  };

  return (
    <Component className={className} variants={item} {...(instant ? { initial: false } : {})}>
      {children}
    </Component>
  );
}
