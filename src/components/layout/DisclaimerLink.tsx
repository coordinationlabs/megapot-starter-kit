/**
 * ---
 * @customize  Disclaimer link rendered inside <Footer /> (desktop) and
 *             <FooterMobile />. The URL is hardcoded — the component
 *             IS the seam. A fork that doesn't want the line just drops
 *             the `<DisclaimerLink />` reference from `Footer.tsx`; no
 *             env plumbing, no string juggling.
 *
 *             To point at your own disclaimer:
 *               - edit `DISCLAIMER_URL` below
 *               - update `docs/DISCLAIMER.md` (or your equivalent) so the
 *                 two stay in sync.
 *
 *             To customize the surrounding copy (e.g. swap "full disclaimer"
 *             for your wording), edit the children passed by `Footer.tsx`
 *             rather than this file — keeps the link primitive reusable.
 * ---
 */
import type { ReactNode } from 'react';

const DISCLAIMER_URL =
  'https://github.com/coordinationlabs/megapot-starter-kit/blob/main/docs/DISCLAIMER.md';

export function DisclaimerLink({
  children = 'full disclaimer',
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={DISCLAIMER_URL}
      target="_blank"
      rel="noreferrer"
      className={`underline underline-offset-2 ${className ?? 'hover:text-zinc-700 dark:hover:text-zinc-200'}`.trim()}
    >
      {children}
    </a>
  );
}
