import { formatEther } from "viem";

export function formatEth(value: bigint | undefined, digits = 4): string {
  if (value === undefined) return "—";
  const eth = Number(formatEther(value));
  return `${eth.toLocaleString(undefined, { maximumFractionDigits: digits })} ETH`;
}

export function shortAddress(address?: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatDate(timestamp: bigint | undefined): string {
  if (timestamp === undefined) return "—";
  return new Date(Number(timestamp) * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function daysLeft(deadline: bigint): number {
  const seconds = Number(deadline) - Date.now() / 1000;
  return Math.max(0, Math.ceil(seconds / 86_400));
}

export function progressPercent(totalFunds: bigint, goal: bigint): number {
  if (goal === 0n) return 0;
  return Math.min(100, Number((totalFunds * 10000n) / goal) / 100);
}
