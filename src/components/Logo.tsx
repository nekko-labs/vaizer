/**
 * The Vaizer mark: a futuristic HUD visor. A helmet/face silhouette with a
 * glowing scan-band across the eyes and targeting brackets at the corners,
 * echoing the "see what your agent is doing" idea the product is built around.
 * Pure inline SVG so it inherits currentColor and scales crisply at any size.
 */
export function VaizerMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* HUD targeting brackets */}
      <path
        d="M4 9 V5 H8 M28 9 V5 H24 M4 23 V27 H8 M28 23 V27 H24"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
      {/* visor / helmet silhouette */}
      <path
        d="M7 11 C7 8.5 9 7 16 7 C23 7 25 8.5 25 11 L25 15 C25 20 21 24 16 24 C11 24 7 20 7 15 Z"
        fill="currentColor"
        opacity="0.12"
      />
      <path
        d="M7 11 C7 8.5 9 7 16 7 C23 7 25 8.5 25 11 L25 15 C25 20 21 24 16 24 C11 24 7 20 7 15 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {/* glowing scan-band across the eyes */}
      <rect
        x="10"
        y="12.4"
        width="12"
        height="3.2"
        rx="1.6"
        fill="var(--signal, currentColor)"
      />
      {/* lower focus tick */}
      <path
        d="M13 19 H19"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
