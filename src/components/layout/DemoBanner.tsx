/**
 * ---
 * @customize  Demo-branch-only. Sticky banner rendered immediately below the
 *             sticky header (see `Layout.tsx`). Announces the read-only
 *             demo state and points at the megapot.io developer
 *             infrastructure used to build the kit.
 *
 *             Visual treatment uses Tailwind brand tokens so a rebrand at
 *             the token level flows through without touching this file.
 * ---
 */
const LINKS = [
  { label: 'docs.megapot.io', href: 'https://docs.megapot.io' },
  { label: 'api.megapot.io', href: 'https://api.megapot.io' },
  { label: 'llms.megapot.io', href: 'https://llms.megapot.io' },
] as const;

export function DemoBanner() {
  return (
    <div className="sticky top-[90px] z-20 border-b border-amber-200/80 bg-amber-50/90 backdrop-blur md:top-[57px] dark:border-amber-900/40 dark:bg-amber-950/40">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-xs font-medium text-amber-900 dark:text-amber-200 sm:text-sm">
          Demo mode · Read-only showcase · Wired up to real Megapot contracts
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-amber-300/80 bg-white/70 px-2.5 py-0.5 text-[11px] font-medium text-amber-900 transition-colors hover:bg-white dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-100 dark:hover:bg-amber-900/50"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
