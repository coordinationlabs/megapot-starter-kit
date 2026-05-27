/**
 * ---
 * @skill      https://llms.megapot.io/tasks/react-setup
 * @customize  Provider order matters: WagmiProvider → QueryClientProvider →
 *             RainbowKitProvider. RainbowKit's CSS import is required.
 * ---
 */

// RainbowKit (not ConnectKit or vanilla wagmi): zero-config WalletConnect
// modal + injected detection in ~5 lines. Swap is two files — wagmi.ts and
// this provider wrapper. See docs/CUSTOMIZE.md § "Wallet provider".
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { hashFn } from 'wagmi/query';
import '@rainbow-me/rainbowkit/styles.css';

import App from './App';
import './config/diagnostics';
import { wagmiConfig } from './config/wagmi';
import './index.css';

// Boot-time diagnostics + the `BigInt.prototype.toJSON` polyfill live in
// `./config/diagnostics`. Belt + suspenders for bigint JSON serialization:
//   - polyfill (above) catches stray `JSON.stringify` in tooling/shims
//   - `hashFn` from wagmi (below) handles bigints in TanStack query keys
// Together: nothing in the React tree can blow up on bigint serialization.

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { queryKeyHashFn: hashFn },
  },
});

// biome-ignore lint/style/noNonNullAssertion: #root always exists per index.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
