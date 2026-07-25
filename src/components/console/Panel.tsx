import type { ElementType, ReactNode } from 'react';

/**
 * Shared "agent console" chrome. The HUD, the Watch run player, and the prompt
 * workbench were each hand-rolling the same surface: a bordered vellum panel
 * with an uppercase section label and a header/controls row. This is the one
 * place that surface is defined, so the consoles stay visually identical and
 * new ones inherit it for free (see STYLESEED.md). Inspired by Brainless'
 * agent-console blocks, implemented on Vaizer's own tokens rather than pulling
 * the dependency in.
 */

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
} as const;

/** A bordered console panel on the vellum surface. */
export function Panel({
  as: Tag = 'div',
  padding = 'md',
  className = '',
  children,
}: {
  as?: ElementType;
  padding?: keyof typeof PADDING;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={`rounded-2xl border border-border bg-surface ${PADDING[padding]} ${className}`.trim()}>
      {children}
    </Tag>
  );
}

/** The small uppercase label that titles a console section. */
export function PanelHeading({
  as: Tag = 'h2',
  className = '',
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={`text-sm font-semibold uppercase tracking-widest text-muted ${className}`.trim()}>
      {children}
    </Tag>
  );
}

/** A header row that spaces a heading and its controls apart, wrapping gracefully. */
export function ConsoleToolbar({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`.trim()}>{children}</div>
  );
}
