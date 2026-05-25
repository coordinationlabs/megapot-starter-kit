/**
 * ---
 * @skill      https://llms.megapot.io/contracts/reference
 * @customize  Set VITE_REFERRER_ADDRESS in .env to your wallet — that's how
 *             you earn USDC on every ticket sold and every winning claimed
 *             through this app. The kit ships with a dead-address default
 *             so it runs out of the box; the diagnostics warning at boot
 *             (see config/diagnostics.ts) catches the unchanged default
 *             in dev. Switch chains by changing VITE_CHAIN in .env
 *             (mainnet | testnet).
 * ---
 *
 * All Megapot contract addresses + chain-aware helpers. Single source of
 * truth — every hook reads from here so a chain switch is one env var.
 */

import { type Address, stringToHex } from 'viem';
import { base, baseSepolia } from 'viem/chains';

export type ChainName = 'mainnet' | 'testnet';

export const CHAIN: ChainName = (import.meta.env.VITE_CHAIN as ChainName | undefined) ?? 'mainnet';

export const VIEM_CHAIN = CHAIN === 'mainnet' ? base : baseSepolia;

/**
 * Block explorer for the active chain. Two prefixes are derived from a single
 * base map so address and tx URLs stay in lockstep:
 *   `${EXPLORER_ADDRESS_URL}${addr}` → e.g. https://basescan.org/address/0x...
 *   `${EXPLORER_TX_URL}${hash}`      → e.g. https://basescan.org/tx/0x...
 */
const EXPLORER_BASE: Record<ChainName, string> = {
  mainnet: 'https://basescan.org/',
  testnet: 'https://sepolia.basescan.org/',
};

/** Chain-resolved explorer URL prefix for addresses. Append the address. */
export const EXPLORER_ADDRESS_URL = `${EXPLORER_BASE[CHAIN]}address/`;

/** Chain-resolved explorer URL prefix for transactions. Append the tx hash. */
export const EXPLORER_TX_URL = `${EXPLORER_BASE[CHAIN]}tx/`;

/** USDC has 6 decimals on every chain Megapot deploys to. */
export const USDC_DECIMALS = 6;

/**
 * Per-drawing bonusball minimum. The protocol default is 1; per-drawing maxes
 * (`ballMax`, `bonusballMax`) come from `Jackpot.getDrawingState`. Override
 * here if a fork uses a different protocol configuration.
 */
export const BONUSBALL_MIN = 1;

/**
 * `bytes32` source identifier passed to `Jackpot.buyTickets` for analytics
 * attribution. Replace with your app identifier to filter your purchases out
 * of on-chain analytics.
 *
 * Computed from a UTF-8 string padded to 32 bytes via `viem.stringToHex`.
 */
export const TICKET_SOURCE = stringToHex('megapot-starter-kit', { size: 32 });

/**
 * Toggle the LP page and nav entry. Default `false` — most forks surface only
 * the user-facing flows (Home / Play / Tickets / History). Set to `true` to
 * expose `JackpotLPManager.lpDeposit` / `initiateWithdraw` / `finalizeWithdraw`
 * to your users (typically operator-facing forks).
 *
 * The LP page module (`src/pages/LP.tsx`) and its hooks/components remain in
 * the bundle either way — this is a runtime visibility toggle, not a
 * build-time tree-shake. A fork that wants the bundle reduction can swap
 * `src/App.tsx`'s LP import to `React.lazy` and wrap the case in `<Suspense>`.
 */
export const LP_ENABLED = false;

/**
 * Referral split weights — must sum to 1e18 (= 100%). Single referrer = `[1e18]`.
 * Up to 5 entries; align order with `_referrers`.
 */
export const REFERRAL_SPLIT_FULL: readonly bigint[] = [1_000_000_000_000_000_000n];

/**
 * Wallet that earns referral fees on every ticket purchased and every
 * winning claimed through this app. Read from `VITE_REFERRER_ADDRESS`
 * in your `.env`; falls back to a dead address so a fresh fork runs
 * end-to-end without any config (fees earned on the fallback are
 * unrecoverable — change before shipping).
 *
 * Per-ticket fee + win-share rates are protocol-level and readable at
 * runtime via `Jackpot.getDrawingState().referralFee` and
 * `.referralWinShare` (both 1e18-scaled).
 *
 * @see https://llms.megapot.io/tasks/claim-referral-fees
 */
export const REFERRER_DEAD_DEFAULT: Address = '0x000000000000000000000000000000000000dEaD';

export const REFERRER_ADDRESS: Address =
  ((import.meta.env.VITE_REFERRER_ADDRESS as string | undefined)?.trim() as Address | undefined) ||
  REFERRER_DEAD_DEFAULT;

const ADDRESSES = {
  USDC: {
    mainnet: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    testnet: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
  Jackpot: {
    mainnet: '0x3bAe643002069dBCbcd62B1A4eb4C4A397d042a2',
    testnet: '0x465dA3c859f193A3807386387bEE941B2A4c3279',
  },
  JackpotTicketNFT: {
    mainnet: '0x48FfE35AbB9f4780a4f1775C2Ce1c46185b366e4',
    testnet: '0x45084829ac63f9dC6a3D4981A46FA896f9180ECd',
  },
  BatchPurchaseFacilitator: {
    mainnet: '0x01774B531591b286b9f02C6Bc02ab3fD9526Aa76',
    testnet: '0xe582dD908Ca5bd51C743DFdda37C93bBaCD27c56',
  },
  JackpotAutoSubscription: {
    mainnet: '0x02A58B725116BA687D9356Eafe0fA771d58a37ac',
    testnet: '0x054a61E2FC77BAb3c9D94C3f835FB7ADE97a2F90',
  },
  JackpotLPManager: {
    mainnet: '0xE63E54DF82d894396B885CE498F828f2454d9dCf',
    testnet: '0x36408921aB820305F109150003C0F90aE1CB1766',
  },
  GuaranteedMinimumPayoutCalculator: {
    mainnet: '0x97a22361b6208aC8cd9afaea09D20feC47046CBD',
    testnet: '0xE9542aC6FaDC47be2Bc42Fc075c1f481529D28cB',
  },
} as const satisfies Record<string, Record<ChainName, Address>>;

export const USDC_ADDRESS = ADDRESSES.USDC[CHAIN] as Address;
export const JACKPOT_ADDRESS = ADDRESSES.Jackpot[CHAIN] as Address;
export const BATCH_PURCHASE_FACILITATOR_ADDRESS = ADDRESSES.BatchPurchaseFacilitator[
  CHAIN
] as Address;
export const JACKPOT_AUTO_SUBSCRIPTION_ADDRESS = ADDRESSES.JackpotAutoSubscription[
  CHAIN
] as Address;
export const JACKPOT_LP_MANAGER_ADDRESS = ADDRESSES.JackpotLPManager[CHAIN] as Address;
export const PAYOUT_CALCULATOR_ADDRESS = ADDRESSES.GuaranteedMinimumPayoutCalculator[
  CHAIN
] as Address;
