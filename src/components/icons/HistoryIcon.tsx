/**
 * ---
 * @customize  Inline SVG. Replace path or swap to an icon library if desired.
 * ---
 */
import type { SVGProps } from 'react';

export function HistoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 3v6h6M3 9a9 9 0 1 0 3-6.7M12 7v5l3 2" />
    </svg>
  );
}
