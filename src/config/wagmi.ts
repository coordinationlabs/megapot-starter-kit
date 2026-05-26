/**
 * ---
 * @customize  Demo-branch wagmi config. Drops the RainbowKit/WalletConnect
 *             connector setup that main carries; the demo connector is the
 *             only wallet on this branch. See `demoConnector.ts` for the
 *             read-only contract.
 * ---
 */
import { base, baseSepolia } from 'viem/chains';
import { createConfig, http } from 'wagmi';
import { VIEM_CHAIN } from './contracts';
import { demoConnector } from './demoConnector';

const RPC_URL = import.meta.env.VITE_RPC_URL;

// JSON-RPC batching: groups concurrent `eth_call` requests into a single
// HTTP POST (batchSize = max calls per batch, wait = ms to coalesce).
const transport = http(RPC_URL, { batch: { batchSize: 100, wait: 16 } });

// Transports keyed by both possible chain IDs. wagmi's `createConfig` types
// `chains: [VIEM_CHAIN]` as `[Base | BaseSepolia]` (the union of what
// VIEM_CHAIN could resolve to at runtime), so it demands transport entries
// for both keys even though only one chain is actually selected. The unused
// entry is dead but free.
const transports = {
  [base.id]: transport,
  [baseSepolia.id]: transport,
};

// Polling cadence matches the slowest active state-poll in the kit (30 s
// in `open` phase). See main-branch wagmi.ts for the full rationale.
const POLLING_INTERVAL = 30_000;

export const wagmiConfig = createConfig({
  chains: [VIEM_CHAIN],
  connectors: [demoConnector()],
  pollingInterval: POLLING_INTERVAL,
  transports,
  ssr: false,
});
