/**
 * ---
 * @skill      https://llms.megapot.io/tasks/react-setup
 * @customize  Add or remove wallet connectors via RainbowKit options.
 *             Change RPC by setting VITE_RPC_URL in .env.
 * ---
 *
 * wagmi v2 + RainbowKit config. Reads chain + RPC URL from .env so a fork
 * can switch mainnet ↔ testnet without code changes.
 *
 * `VITE_WALLETCONNECT_PROJECT_ID` is optional but recommended:
 *   - Set: full RainbowKit modal (WalletConnect QR, Rainbow, MetaMask mobile,
 *     plus injected + Coinbase Wallet).
 *   - Empty: degraded mode — only `injectedWallet` (EIP-6963: MetaMask
 *     extension, Rabby, Brave, Phantom, etc.) and `coinbaseWallet` (its
 *     own SDK) are available. The WC QR modal + Rainbow + MetaMask mobile
 *     deep links are disabled. `src/config/diagnostics.ts` logs a
 *     dev-mode warning so a forker sees why.
 *
 * Why a custom branch instead of just an empty `projectId`: RainbowKit's
 * `getDefaultConfig` builds its default wallet list (which includes the
 * Rainbow connector), and Rainbow's connector hits
 * `getWalletConnectConnector()` at module-init time. That throws
 * synchronously when `projectId` is empty — black-screening the app
 * before any wallet is selected.
 */
import { connectorsForWallets, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { coinbaseWallet, injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { base, baseSepolia } from 'viem/chains';
import { createConfig, http } from 'wagmi';
import { VIEM_CHAIN } from './contracts';

const RPC_URL = import.meta.env.VITE_RPC_URL;
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? '';
const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Megapot Starter Kit';

// JSON-RPC batching: groups concurrent `eth_call` requests into a single
// HTTP POST (batchSize = max calls per batch, wait = ms to coalesce).
// Reduces public-RPC round-trips so per-method hooks stay simple without
// a hot-path penalty.
const transport = http(RPC_URL, { batch: { batchSize: 100, wait: 16 } });

// Transports keyed by both possible chain IDs. wagmi's `createConfig`
// types `chains: [VIEM_CHAIN]` as `[Base | BaseSepolia]` (the union of
// what `VIEM_CHAIN` could resolve to at runtime), so it demands transport
// entries for both keys even though only one chain is actually selected.
// The unused entry is dead but free.
const transports = {
  [base.id]: transport,
  [baseSepolia.id]: transport,
};

// Default poll cadence for wagmi/viem watchers (block height, contract
// events via HTTP `eth_getLogs`). The kit's only event watchers fire on
// phase changes that happen at most once per drawing (`JackpotLocked`,
// `JackpotSettled`, `NewDrawingInitialized`, `JackpotUnlocked`); the kit
// already polls `getDrawingState` every 30 s in `open` phase and 5 s in
// `awaiting`/`settling`, so the events are a faster-path nudge rather
// than the primary signal. We set this to match the slowest active
// state-poll cadence — the only transition bounded by this interval is
// `settled → open` (state poll is off), which is once-a-day.
const POLLING_INTERVAL = 30_000;

export const wagmiConfig = WALLETCONNECT_PROJECT_ID
  ? getDefaultConfig({
      // Shown in wallet-connect modals. Override via VITE_APP_NAME in .env on rebrand.
      appName: APP_NAME,
      projectId: WALLETCONNECT_PROJECT_ID,
      chains: [VIEM_CHAIN],
      pollingInterval: POLLING_INTERVAL,
      transports,
      ssr: false,
    })
  : createConfig({
      chains: [VIEM_CHAIN],
      connectors: connectorsForWallets(
        [{ groupName: 'Recommended', wallets: [injectedWallet, coinbaseWallet] }],
        // `connectorsForWallets` requires a projectId param even when none
        // of the listed wallets use WalletConnect. Empty string is fine.
        { appName: APP_NAME, projectId: '' },
      ),
      pollingInterval: POLLING_INTERVAL,
      transports,
      ssr: false,
    });
