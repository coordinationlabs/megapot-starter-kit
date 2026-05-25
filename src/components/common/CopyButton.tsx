/**
 * ---
 * @customize  Generic copy affordance. Pass any string; the icon flashes
 *             a check on success and reverts after 1 second. No external
 *             deps, no portal — drop it inline next to any value that's
 *             handy to share (addresses, ticket IDs, tx hashes).
 *
 *             Falls back silently when `navigator.clipboard` is unavailable
 *             (older browsers, non-secure contexts); the click still
 *             registers but the flash doesn't trigger.
 *
 *             No `clearTimeout` cleanup — this is a one-shot user
 *             interaction, not a recurring effect. The timeout closes
 *             harmlessly even if the component unmounts before it fires.
 * ---
 */
import { useState } from 'react';
import { CheckIcon } from '@/components/icons/CheckIcon';
import { CopyIcon } from '@/components/icons/CopyIcon';

export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      // Clipboard API can fail on insecure contexts / missing permission —
      // swallow silently; the user re-clicks or selects manually.
    }
  };

  const finalLabel = label ?? 'Copy';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={finalLabel}
      title={copied ? 'Copied!' : finalLabel}
      className={`inline-flex h-6 w-6 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 ${className ?? ''}`.trim()}
    >
      {copied ? <CheckIcon className="text-brand-primary-600" /> : <CopyIcon />}
    </button>
  );
}
