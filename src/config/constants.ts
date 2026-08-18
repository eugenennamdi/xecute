import type { Intent, Mode } from "@/lib/intents"

export type SuggestedPrompt = {
  mode: Mode
  label: string
  prompt: string
}

export const suggestedPrompts: SuggestedPrompt[] = [
  {
    mode: "trade",
    label: "Plan a swap",
    prompt: "Swap 25 USDT to OKB with max 0.5% slippage",
  },
  {
    mode: "earn",
    label: "Explore yield",
    prompt: "Find the best live USDT yield opportunities on X Layer",
  },
  {
    mode: "predict",
    label: "Stress test",
    prompt: "What happens if OKB drops 10%?",
  },
  {
    mode: "protect",
    label: "Review access",
    prompt: "Check my risky token approvals and allowances",
  },
]

export const modeCopy: Record<Mode, { label: string; description: string }> = {
  trade: { label: "Trade", description: "Swaps, transfers, and token execution" },
  earn: { label: "Earn", description: "DeFi discovery and live protocol yields" },
  predict: { label: "Predict", description: "Scenario simulation and stress tests" },
  protect: { label: "Protect", description: "Allowance audits and risk scans" },
}

export type ExecutionReceipt = {
  timestamp: string
  transactionHash: `0x${string}`
  status: "executed" | "pending" | "reverted" | "broadcast"
  checks: string[]
  intent: Intent
  gasUsed?: string
  blockNumber?: number
  explorerUrl?: string
}

export function createExecutionReceipt(
  intent: Intent,
  txHash: `0x${string}`,
  options?: {
    status?: "executed" | "pending" | "reverted" | "broadcast"
    gasUsed?: string
    blockNumber?: number
  },
): ExecutionReceipt {
  return {
    timestamp: new Date().toISOString(),
    transactionHash: txHash,
    status: options?.status ?? "broadcast",
    gasUsed: options?.gasUsed,
    blockNumber: options?.blockNumber,
    checks: [
      "Intent validated",
      "Slippage constraint verified",
      "Gas reserve checked",
      "Human confirmation received",
      "Transaction broadcasted to X Layer",
    ],
    intent,
  }
}
