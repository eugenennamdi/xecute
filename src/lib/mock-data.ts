import type { Intent, Mode, TradeIntent } from "@/lib/intents"

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

export const earnOpportunities = [
  {
    protocol: "Stable Pool",
    asset: "USDT0",
    apy: "4.8%",
    risk: "Low",
    note: "Variable lending yield · no lockup",
  },
  {
    protocol: "Delta Vault",
    asset: "USDT0",
    apy: "7.2%",
    risk: "Medium",
    note: "Market-making strategy · 24h cooldown",
  },
]

export const approvalFindings = [
  {
    label: "Unlimited USDT0 approval",
    spender: "0x8A2f…91C4",
    risk: "High",
    lastUsed: "42 days ago",
  },
  {
    label: "Exact WETH approval",
    spender: "0x31B7…0E2A",
    risk: "Low",
    lastUsed: "6 days ago",
  },
]

const MOCK_USD_PRICES: Record<string, number> = {
  USDT0: 1,
  USDC: 1,
  OKB: 59.66,
  WETH: 3248,
  ETH: 3248,
  WBTC: 118400,
  BTC: 118400,
  xUSDT: 1,
  xWETH: 3248,
  xOKB: 59.66,
}

export type TradePreview = {
  fromToken: string
  toToken: string
  inputAmount: string
  estimatedOutput: string
  minimumReceived: string
  slippage: string
  gasEstimate: string
  priceImpact: string
  approvalRequired: boolean
  riskLevel: "Low" | "Medium"
  route: string
}

export function createTradePreview(intent: TradeIntent): TradePreview {
  const amount = Number(intent.amount ?? 0)
  const from = intent.fromToken ?? "Unknown"
  const to = intent.toToken ?? "Unknown"
  const fromPrice = MOCK_USD_PRICES[from] ?? 1
  const toPrice = MOCK_USD_PRICES[to] ?? 1
  const output = (amount * fromPrice * 0.9987) / toPrice
  const minimum = output * (1 - intent.maxSlippage / 100)

  return {
    fromToken: from,
    toToken: to,
    inputAmount: amount ? amount.toLocaleString("en-US", { maximumFractionDigits: 6 }) : "—",
    estimatedOutput: output ? output.toLocaleString("en-US", { maximumFractionDigits: 6 }) : "—",
    minimumReceived: minimum ? minimum.toLocaleString("en-US", { maximumFractionDigits: 6 }) : "—",
    slippage: `${intent.maxSlippage}%`,
    gasEstimate: "0.0021 OKB",
    priceImpact: "0.13%",
    approvalRequired: from !== "OKB",
    riskLevel: intent.maxSlippage <= 1 ? "Low" : "Medium",
    route: "X Layer Smart Route",
  }
}

export function assistantReply(intent: Intent) {
  switch (intent.mode) {
    case "trade":
      if (!intent.amount || !intent.fromToken || !intent.toToken) {
        return "I parsed this as a swap, but I still need the input amount and both tokens before I can prepare a complete preview."
      }
      return `I parsed a ${intent.amount} ${intent.fromToken} to ${intent.toToken} swap and prepared a simulated route. Review the limits and risk checks before confirming.`
    case "earn":
      return `I found two illustrative ${intent.asset ?? "stablecoin"} opportunities on X Layer. They are mock venues for this MVP, ranked by risk and withdrawal flexibility.`
    case "predict":
      return `I modeled a ${intent.changePercent ?? -10}% move in ${intent.asset ?? "the selected asset"}. This is scenario analysis for decision support, not a price forecast.`
    case "protect":
      return "I completed a mock allowance scan. One unlimited approval deserves review; no wallet changes will be made from this screen."
  }
}

export type MockReceipt = {
  timestamp: string
  transactionHash: `0x${string}`
  checks: string[]
  intent: Intent
}

function mockTransactionHash(): `0x${string}` {
  const bytes = new Uint8Array(32)
  globalThis.crypto.getRandomValues(bytes)
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`
}

export function createMockReceipt(intent: Intent): MockReceipt {
  return {
    timestamp: new Date().toISOString(),
    transactionHash: mockTransactionHash(),
    checks: [
      "Intent validated",
      "Slippage constraint passed",
      "Gas reserve checked",
      "Human confirmation received",
    ],
    intent,
  }
}
