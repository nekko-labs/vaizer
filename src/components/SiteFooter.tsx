import Link from 'next/link';
import type { ReactNode } from 'react';
import { nav, site } from '@/lib/site';
import { GitHubIcon } from './icons';
import { VaizerMark } from './Logo';

/** A footer link styled as a rounded tile: label lifts on hover. */
function FooterTile({
  href,
  external,
  children,
}: {
  href: string;
  external?: boolean;
  children: ReactNode;
}) {
  const className =
    'inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-1.5 text-sm text-muted transition hover:-translate-y-0.5 hover:border-accent hover:text-accent';
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 pb-10 pt-12 sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <div className="max-w-sm">
          <div className="flex items-center gap-2 font-bold text-accent">
            <VaizerMark className="h-6 w-6" />
            <span className="text-fg">{site.name}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">{site.description}</p>
        </div>

        <nav aria-label="Footer" className="flex max-w-xs flex-wrap gap-2 sm:justify-end">
          {nav.map((item) => (
            <FooterTile key={item.href} href={item.href}>
              {item.label}
            </FooterTile>
          ))}
          <FooterTile href={site.githubUrl} external>
            <GitHubIcon className="h-4 w-4" />
            GitHub
          </FooterTile>
        </nav>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-5 text-xs text-muted sm:px-8">
          A{' '}
          <a
            href={site.parentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-fg"
          >
            {site.parentName}
          </a>{' '}
          project.
        </div>
      </div>
    </footer>
  );
}
