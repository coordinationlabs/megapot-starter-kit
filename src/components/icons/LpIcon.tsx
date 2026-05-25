/**
 * ---
 * @customize  Inline SVG. Replace path or swap to an icon library if desired.
 * ---
 */
import type { SVGProps } from 'react';

export function LpIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M3 17l6-6 4 4 8-8M14 7h7v7" />
    </svg>
  );
}
