/**
 * ---
 * @customize  The kit's logo mark. Generic emerald-on-emerald "M" rounded
 *             square — chosen as an obviously placeholder shape so a fork
 *             has a single, unmistakable swap point for branding.
 *
 *             To rebrand: replace the <svg> body below with your own mark.
 *             The default scale is 24×24 inside a 32×32 viewBox; pass a
 *             custom `className` to override size or override fill colors
 *             by editing them inline. The header layout reserves a square
 *             slot at the start of the brand block.
 *
 *             That's the entire branding swap for the mark.
 * ---
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={`shrink-0 ${className ?? ''}`.trim()}
    >
      <rect width="32" height="32" rx="7" fill="#059669" />
      <path
        d="M9 22V10h3.4l3.3 7.2L19 10h3.4v12h-2.4v-7.6l-2.7 5.7h-2L12.6 14.4V22z"
        fill="#ecfdf5"
      />
    </svg>
  );
}
