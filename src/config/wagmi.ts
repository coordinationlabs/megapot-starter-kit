/**
 * ---
 * @skill      https://llms.megapot.io/tasks/react-setup
 * @customize  Add or remove wallet connectors via RainbowKit options.
 *             Change RPC by setting VITE_RPC_URL in .env.
 * ---
 *
 * wagmi v2 + RainbowKit config. Reads chain + RPC URL from .env so a fork
 * can switch mainnet ↔ testnet without code changes.
 */
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { VIEM_CHAIN } from './contracts';

const RPC_URL = import.meta.env.VITE_RPC_URL;
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? '';

export const wagmiConfig = getDefaultConfig({
  // Shown in wallet-connect modals. Override via VITE_APP_NAME in .env on rebrand.
  appName: import.meta.env.VITE_APP_NAME ?? 'Megapot Starter Kit',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [VIEM_CHAIN],
  // Default poll cadence for wagmi/viem watchers (block height, contract events
  // via HTTP `eth_getLogs`). The kit's only event watchers fire on phase
  // changes that happen at most once per drawing (`JackpotLocked`,
  // `JackpotSettled`, `NewDrawingInitialized`, `JackpotUnlocked`); the kit
  // already polls `getDrawingState` every 30 s in `open` phase and 5 s in
  // `awaiting`/`settling`, so the events are a faster-path nudge rather than
  // the primary signal. We set this to match the slowest active state-poll
  // cadence — the only transition bounded by this interval is `settled →
  // open` (state poll is off), which is once-a-day.
  pollingInterval: 30_000,
  // JSON-RPC batching: groups concurrent `eth_call` requests into a single
  // HTTP POST (batchSize = max calls per batch, wait = ms to coalesce).
  // Reduces public-RPC round-trips so per-method hooks stay simple without
  // a hot-path penalty.
  transports: {
    [VIEM_CHAIN.id]: http(RPC_URL, { batch: { batchSize: 100, wait: 16 } }),
  },
  ssr: false,
});
