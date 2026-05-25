/**
 * ---
 * @skill      https://llms.megapot.io/data-api
 * @customize  "via Megapot Data API" attribution chip used in every
 *             API-backed surface (Tickets sections, History header).
 *             Single edit point: change the label/URL/style here and
 *             every call site updates.
 *
 *             A fork that proxies the Data API through their own
 *             infrastructure typically wants to swap or remove this
 *             attribution — `DATA_API_URL` is the seam.
 * ---
 */
import type { HTMLAttributes } from 'react';

/** Public Data API landing page. Swap on rebrand if proxied through a different host. */
const DATA_API_URL = 'https://api.megapot.io';

type Props = HTMLAttributes<HTMLAnchorElement> & {
  /** Override the visible label (default: `via Megapot Data API`). */
  label?: string;
};

export function DataApiCredit({ label = 'via Megapot Data API', className = '', ...rest }: Props) {
  return (
    <a
      href={DATA_API_URL}
      target="_blank"
      rel="noreferrer"
      className={
        'text-xs text-zinc-500 underline-offset-2 transition-colors hover:text-zinc-700 hover:underline dark:hover:text-zinc-300 ' +
        className
      }
      {...rest}
    >
      {label}
    </a>
  );
}
