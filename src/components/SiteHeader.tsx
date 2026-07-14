import Link from 'next/link';
import { nav, site } from '@/lib/site';
import { GitHubIcon } from './icons';
import { VaizerMark } from './Logo';
import { MobileNav } from './MobileNav';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-accent"
        >
          <VaizerMark className="h-6 w-6" />
          <span className="text-fg">{site.name}</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={site.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Vaizer on GitHub"
            className="ml-1 inline-flex items-center rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <GitHubIcon className="h-5 w-5" />
          </a>
          <Link
            href="/watch"
            className="ml-1 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-transform hover:-translate-y-0.5"
          >
            Watch a run
          </Link>
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
