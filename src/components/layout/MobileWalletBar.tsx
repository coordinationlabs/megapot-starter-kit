/**
 * ---
 * @skill      https://llms.megapot.io/tasks/react-setup
 * @customize  Demo-branch version. Always renders the connected-state
 *             balance row — the demo connector + auto-connect mean we're
 *             always "connected" — and replaces the Disconnect affordance
 *             with a static "Demo" indicator.
 * ---
 */
import { formatUnits } from 'viem';
import { useAccount, useBalance } from 'wagmi';
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

export function MobileWalletBar() {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({
    address,
    query: { enabled: isConnected },
  });
  const { balance: usdcBalance } = useUsdcBalance(address);

  // Auto-connect mounts after the first render — render nothing on the
  // very first frame to avoid a flash of empty bar.
  if (!isConnected || !address) return null;

  return (
    <div className="flex items-center justify-between gap-2 border-t border-zinc-200 px-4 py-2 text-xs md:hidden dark:border-zinc-800">
      <div className="flex min-w-0 items-center gap-1.5">
        <span
          className="font-[ui-monospace,SFMono-Regular,Menlo,Consolas,monospace] font-medium text-zinc-800 dark:text-zinc-200"
          title={address}
        >
          {shortenAddress(address)}
        </span>
        <CopyButton value={address} label="Copy address" className="h-3.5 w-3.5" />
        <span className="mx-1 h-3 w-px bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />
        <span className="text-zinc-500">ETH</span>
        <span className="font-mono text-zinc-900 dark:text-zinc-100">
          {fmt(ethBalance?.value, 18, 3)}
        </span>
        <span className="mx-1 h-3 w-px bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />
        <span className="text-zinc-500">USDC</span>
        <span className="font-mono text-zinc-900 dark:text-zinc-100">
          {fmt(usdcBalance, USDC_DECIMALS, 2)}
        </span>
      </div>
      <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        Demo
      </span>
    </div>
  );
}
