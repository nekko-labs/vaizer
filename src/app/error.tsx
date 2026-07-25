'use client';

/**
 * App-wide error boundary. Next.js renders this in place of a route segment
 * that throws while rendering on the client, keeping the header/footer chrome
 * intact. Absent before; without it, a single throw in the run feed or prompt
 * workbench would blank the whole page. `reset()` re-attempts the segment.
 */

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for local debugging / error reporting hooks.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-danger-fg">Something broke</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">This screen hit an error</h1>
      <p className="mt-3 text-muted">
        A part of the page failed to render. Nothing you did is saved incorrectly, and the rest of
        Vaizer still works. Try again, or head back home.
      </p>
      {error.digest && (
        <p className="mt-4 font-mono text-xs text-muted">Reference: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-transform hover:-translate-y-0.5"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-fg transition-colors hover:border-accent"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
