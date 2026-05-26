/**
 * ---
 * @skill      https://llms.megapot.io/tasks/read-state
 * @customize  Demo-branch version. Drops the Connect/Disconnect button
 *             (auto-connect makes it unreachable in either direction) and
 *             replaces it with a static "Demo" indicator so the
 *             demo-mode state is explicit at the top-right.
 *
 *             Balance pill (address + ETH + USDC) stays — surfaces the
 *             demo wallet's real liquidity readout.
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

export function ProfileCard() {
  const { address, isConnected } = useAccount();

  const { data: ethBalance } = useBalance({
    address,
    query: { enabled: isConnected },
  });

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
      <DemoPill />
    </div>
  );
}

function DemoPill() {
  return (
    <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
      Demo
    </span>
  );
}
