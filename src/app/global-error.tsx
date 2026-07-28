'use client';

/**
 * Last-resort error boundary: catches errors thrown in the root layout itself
 * (where the segment `error.tsx` can no longer help). It must render its own
 * <html>/<body>. Kept deliberately minimal and inline-styled since the app
 * shell, including global CSS tokens, may not have mounted.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ece9e1',
          color: '#20222b',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div style={{ maxWidth: 480, padding: '0 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Vaizer hit a fatal error
          </h1>
          <p style={{ marginTop: 12, color: '#6b6e7c', lineHeight: 1.6 }}>
            The app could not recover. Reloading usually fixes it.
          </p>
          {error.digest && (
            <p style={{ marginTop: 16, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#6b6e7c' }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              borderRadius: 8,
              border: 'none',
              background: '#5646d4',
              color: '#fbfaf5',
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
