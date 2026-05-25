/**
 * ---
 * @skill      https://llms.megapot.io/tasks/read-state
 * @contract   USDC.balanceOf
 * @customize  Pure balance read — single responsibility. For approval flows
 *             that need to compare current allowance against a spender, pair
 *             with `useUsdcAllowance`.
 * ---
 */
import { erc20Abi } from 'viem';
import { useReadContract } from 'wagmi';
import { USDC_ADDRESS } from '@/config/contracts';

export function useUsdcBalance(user: `0x${string}` | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: user ? [user] : undefined,
    query: { enabled: !!user },
  });

  return {
    balance: data,
    isLoading,
    refetch,
  };
}
