/**
 * ---
 * @customize  Disclaimer footer. The link itself lives in
 *             `<DisclaimerLink />` — change the URL there. To remove the
 *             disclaimer entirely for a fork, delete the `<DisclaimerLink />`
 *             reference below.
 *
 *             Rendered as a normal in-flow footer on every breakpoint. On
 *             mobile, <Layout /> adds a spacer after the footer that matches
 *             the height of the fixed bottom nav so the disclaimer scrolls
 *             into view above the nav rather than being covered by it.
 * ---
 */
import { COPY } from '@/config/copy';
import { DisclaimerLink } from './DisclaimerLink';

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white/50 px-4 py-4 text-[11px] leading-relaxed text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400 md:py-6 md:text-xs">
      <p className="mx-auto max-w-5xl text-center md:text-left">
        <span className="hidden md:inline">{COPY.disclaimerLineDesktop} See </span>
        <span className="md:hidden">{COPY.disclaimerLineMobile} · </span>
        <DisclaimerLink>{COPY.disclaimerLinkText}</DisclaimerLink>
        <span className="hidden md:inline">.</span>
      </p>
    </footer>
  );
}
