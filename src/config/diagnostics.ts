/**
 * ---
 * @customize  Dev-mode boot diagnostics.
 *
 *             Houses two unrelated boot-time concerns:
 *               1. `BigInt.prototype.toJSON` polyfill — global, runs in all
 *                  environments. Megapot reads return uint256 → bigint
 *                  everywhere; the polyfill catches any rogue
 *                  `JSON.stringify` in dev tooling, wallet SES shims, error
 *                  reporters, or observer notify paths.
 *               2. Placeholder + config warnings — gated on
 *                  `import.meta.env.DEV` so production stays silent.
 *                  Catches the two most common hurried-forker footguns:
 *                  shipping with the unchanged REFERRER_ADDRESS or the
 *                  unchanged TICKET_SOURCE.
 *
 *             Imported once from `main.tsx`; no exports — pure side effects.
 * ---
 */
import { stringToHex } from 'viem';
import { REFERRER_ADDRESS, REFERRER_DEAD_DEFAULT, TICKET_SOURCE } from './contracts';

// Belt + suspenders for bigint JSON serialization. See `main.tsx` for the
// rationale — keep alongside `hashFn` from wagmi/query so nothing in the
// React tree can blow up on a bigint serialization.
// biome-ignore lint/suspicious/noExplicitAny: BigInt.prototype.toJSON is non-standard
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

if (import.meta.env.DEV) {
  if (REFERRER_ADDRESS.toLowerCase() === REFERRER_DEAD_DEFAULT.toLowerCase()) {
    // biome-ignore lint/suspicious/noConsole: deliberate dev-mode diagnostic
    console.warn(
      '[megapot] VITE_REFERRER_ADDRESS is the dead-address default — set it in .env to your wallet to earn referral fees on every ticket and claim through this app. Any fees earned on the default address are unrecoverable.',
    );
  }
  const DEFAULT_SOURCE = stringToHex('megapot-starter-kit', { size: 32 });
  if (TICKET_SOURCE === DEFAULT_SOURCE) {
    // biome-ignore lint/suspicious/noConsole: deliberate dev-mode diagnostic
    console.warn(
      '[megapot] TICKET_SOURCE is the placeholder — set yours in src/config/contracts.ts so your purchases are attributed correctly in on-chain analytics.',
    );
  }
}
