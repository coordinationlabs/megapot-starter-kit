/**
 * ---
 * @customize  Demo-branch-only. Replaces the kit's RainbowKit/wagmi connector
 *             setup with a single read-only connector that reports as
 *             connected to a showcase wallet (sourced from
 *             `VITE_DEMO_ADDRESS` with a fallback) and throws on every
 *             wallet-level write RPC.
 *
 *             Reads work normally — wagmi's `useReadContract` routes through
 *             the configured `publicClient` and never touches the connector.
 *             So every wallet-scoped read hook (Tickets, LP position,
 *             Unclaimed Wins, Referral Fees) populates with the demo
 *             wallet's real on-chain state.
 * ---
 */
import { type Address } from 'viem';
import { createConnector } from 'wagmi';

/**
 * Showcase wallet whose on-chain state populates every wallet-scoped read
 * hook. Must be a Base-mainnet address with non-trivial activity:
 *   - at least one ticket in a current or recent drawing
 *   - an LP deposit position (ideally with accrued earnings)
 *   - a claimable or recently-claimed win for History coverage
 *   - a non-zero referral fee balance is nice-to-have
 *
 * Sourced from `VITE_DEMO_ADDRESS` at build time (Vite inlines `VITE_*`
 * env vars). Falls back to the kit's curated wallet when the env var is
 * unset — that's the intended default for the public Vercel deploy.
 * Override via the Vercel dashboard or a local `.env` to swap wallets
 * without a code change (still requires a redeploy / rebuild — Vite is
 * not truly runtime-dynamic for `VITE_*` vars).
 */
export const DEMO_ADDRESS: Address =
  (import.meta.env.VITE_DEMO_ADDRESS as Address | undefined) ??
  '0x9B40b91DF44ee34C918D10EDF6388B703731476b';

/**
 * True on the demo branch; the constant exists so write-button sites can
 * import a single flag and gate their `disabled` props uniformly. UI polish
 * only — the connector is the actual safety net.
 */
export const DEMO_MODE = true;

/**
 * Wallet-level RPC methods the connector refuses. Reads (`eth_call`,
 * `eth_getLogs`, etc.) never reach this connector — wagmi routes them
 * through the publicClient.
 */
const BLOCKED_METHODS = new Set<string>([
  'eth_sendTransaction',
  'eth_sendRawTransaction',
  'eth_sign',
  'personal_sign',
  'eth_signTypedData',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
]);

export function demoConnector() {
  return createConnector((config) => ({
    id: 'demo',
    name: 'Demo Wallet',
    type: 'demo' as const,

    async connect() {
      // Cast through `as never` to satisfy wagmi's `withCapabilities` generic
      // overload — we never return the capabilities-wrapped shape because
      // the demo connector is never invoked with `withCapabilities: true`.
      return {
        accounts: [DEMO_ADDRESS] as never,
        chainId: config.chains[0].id,
      };
    },
    async disconnect() {
      // no-op — demo wallet stays "connected"
    },
    async getAccounts() {
      return [DEMO_ADDRESS];
    },
    async getChainId() {
      return config.chains[0].id;
    },
    async isAuthorized() {
      return true;
    },
    async switchChain() {
      throw new Error('Demo mode — chain switching disabled');
    },
    async getProvider() {
      return {
        request: async ({ method }: { method: string }) => {
          if (BLOCKED_METHODS.has(method)) {
            throw new Error('Demo mode — transactions are disabled');
          }
          // The kit has no legitimate caller for any other wallet-level RPC
          // method through the connector. Throw loudly if a new one appears
          // so we hear about it rather than silently succeeding.
          throw new Error(`Demo connector does not implement ${method}`);
        },
      };
    },
    onAccountsChanged() {},
    onChainChanged() {},
    onConnect() {},
    onDisconnect() {},
    onMessage() {},
  }));
}
