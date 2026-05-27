/**
 * ---
 * @skill      https://llms.megapot.io/tasks/read-state
 * @customize  Two header slots (md+ only — `MobileWalletBar` owns the
 *             equivalent surface below md, matching where `Nav` flips to
 *             a bottom tab bar):
 *               - balance pill (ETH + USDC) when connected — single source of
 *                 wallet liquidity readout, no modal needed.
 *               - <WalletButton /> renders a minimal Connect / Disconnect /
 *                 Wrong-network button via `ConnectButton.Custom` — dropping
 *                 RainbowKit's account modal because the balance pill already
 *                 covers the only data it surfaced.
 *
 *             To reinstate the full RainbowKit dropdown, swap `<WalletButton />`
 *             for `<ConnectButton />`. If you want the desktop surface on mobile
 *             too, drop the outer `hidden sm:flex` and remove `MobileWalletBar`
 *             from `Layout.tsx`.
 * ---
 */

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatUnits } from 'viem';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { Button } from '@/components/common/Button';
import { CopyButton } from '@/components/common/CopyButton';
import { USDC_DECIMALS } from '@/config/contracts';
import { useUsdcBalance } from '@/hooks/useUsdcBalance';

function fmt(value: bigint | undefined, decimals: number, precision = 4) {
  if (value === undefined) return '—';
  return Number(formatUnits(value, decimals)).toFixed(precision);
}

function shortenAddress(address: `0x${string}`) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ProfileCard() {
  const { address, isConnected } = useAccount();

  const { data: ethBalance } = useBalance({
    address,
    query: { enabled: isConnected },
  });

  // Balance-only mode (no `spender`) — single source of USDC liquidity
  // matches the approval path in <ApprovalButton>.
  const { balance: usdcBalance } = useUsdcBalance(address);

  return (
    <div className="hidden items-center gap-2 md:flex">
      {isConnected && address && (
        <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-900">
          <span
            className="font-[ui-monospace,SFMono-Regular,Menlo,Consolas,monospace] text-zinc-700 dark:text-zinc-300"
            title={address}
          >
            {shortenAddress(address)}
          </span>
          <CopyButton value={address} label="Copy address" className="h-4 w-4" />
          <span className="mx-1 h-3 w-px bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />
          <span className="text-zinc-500">ETH</span>
          <span className="font-mono text-zinc-900 dark:text-zinc-100">
            {fmt(ethBalance?.value, 18)}
          </span>
          <span className="mx-1 h-3 w-px bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />
          <span className="text-zinc-500">USDC</span>
          <span className="font-mono text-zinc-900 dark:text-zinc-100">
            {fmt(usdcBalance, USDC_DECIMALS, 2)}
          </span>
        </div>
      )}
      <WalletButton />
    </div>
  );
}

/**
 * Minimal connect / disconnect surface. RainbowKit's default <ConnectButton />
 * renders chain selector + balance + address dropdown — we already show
 * balances in the header and don't want a chain switcher in the demo, so
 * collapse to one button per state.
 */
function WalletButton() {
  const { disconnect } = useDisconnect();

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openChainModal, mounted }) => {
        // `mounted` flips true after RainbowKit has hydrated — until then we
        // can't know whether a session exists, so render nothing.
        if (!mounted) return null;

        if (!account || !chain) {
          return (
            <Button variant="primary" size="sm" onClick={openConnectModal} className="px-3 py-1.5">
              Connect
            </Button>
          );
        }

        if (chain.unsupported) {
          return (
            <Button variant="danger" size="sm" onClick={openChainModal} className="px-3 py-1.5">
              Wrong network
            </Button>
          );
        }

        // Disconnect uses a quieter outline style (not destructive — just an idle exit
        // affordance), kept inline because none of the three Button variants match.
        return (
          <button
            type="button"
            onClick={() => disconnect()}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            title={account.address}
          >
            Disconnect
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
