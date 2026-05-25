/**
 * ---
 * @customize  Single edit point for brand voice / i18n. Forks change the
 *             values below; React consumers stay unchanged.
 *
 *             This holds ONLY static UI copy — connect prompts, banners,
 *             section headings, action labels. Error messages from API
 *             responses and wagmi stay where they are (they're dynamic).
 *
 *             Patterns:
 *               - Use simple string literals; no template variables in
 *                 keys. If a string needs a parameter (e.g. ticket count),
 *                 keep the JSX templated and only hoist the static parts.
 *               - Group by surface: app-shell first, then per-page.
 * ---
 */
export const COPY = {
  // App shell
  /** Wallet-connect modal title — falls back here when VITE_APP_NAME is empty. */
  appName: 'Megapot Starter Kit',
  /** Header brand block — short prefix shown on mobile. */
  brandShort: 'Megapot',
  /** Header brand block — suffix shown on `sm+` only. */
  brandSuffix: ' Starter Kit',

  // Play page
  connectToBuy: 'Connect your wallet to buy tickets.',
  /** Rendered when the current drawing's lifecycle phase blocks ticket sales. */
  ticketsPaused: 'Ticket sales are paused for this drawing',

  // Tickets page
  connectToViewTickets: 'Connect your wallet to view your tickets and claim winnings.',
  unclaimedWinsHeading: 'Wins to claim',

  // LP page
  connectToProvideLiquidity: 'Connect your wallet to deposit or withdraw liquidity.',

  // Footer
  disclaimerLineDesktop:
    'Infrastructure Participant interface — not operated by, affiliated with, or endorsed by Megapot. Participating assets may be lost.',
  disclaimerLineMobile: 'Participating assets may be lost',
  disclaimerLinkText: 'full disclaimer',
} as const;

export type CopyKey = keyof typeof COPY;
