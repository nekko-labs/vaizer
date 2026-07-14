/**
 * The Vaizer mark: three nodes wired left-to-right into a converging signal,
 * echoing the workflow canvas the whole product is built around. Pure inline
 * SVG so it inherits currentColor and scales crisply at any size.
 */
export function VaizerMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* wires */}
      <path
        d="M8 8 L20 16 M8 24 L20 16 M20 16 L26 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* input nodes */}
      <circle cx="8" cy="8" r="3.4" fill="currentColor" opacity="0.75" />
      <circle cx="8" cy="24" r="3.4" fill="currentColor" opacity="0.75" />
      {/* converging signal node */}
      <circle cx="20" cy="16" r="4.2" fill="var(--signal, currentColor)" />
      {/* output */}
      <circle cx="27" cy="16" r="2.6" fill="currentColor" />
    </svg>
  );
}
