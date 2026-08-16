import type { TradeIntent } from "@/lib/intents"

export const FIXTURE_USD_PRICES: Record<string, number> = {
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

export type FixtureTradePreview = {
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

export function createFixtureTradePreview(intent: TradeIntent): FixtureTradePreview {
  const amount = Number(intent.amount ?? 0)
  const from = intent.fromToken ?? "Unknown"
  const to = intent.toToken ?? "Unknown"
  const fromPrice = FIXTURE_USD_PRICES[from] ?? 1
  const toPrice = FIXTURE_USD_PRICES[to] ?? 1
  const output = (amount * fromPrice * 0.9987) / toPrice
  const minimum = output * (1 - intent.maxSlippage / 100)

  return {
    fromToken: from,
    toToken: to,
    inputAmount: amount ? amount.toLocaleString("en-US", { maximumFractionDigits: 6 }) : "—",
    estimatedOutput: output ? output.toLocaleString("en-US", { maximumFractionDigits: 6 }) : "—",
    minimumReceived: minimum ? minimum.toLocaleString("en-US", { maximumFractionDigits: 6 }) : "—",
    slippage: `${intent.maxSlippage}%`,
    gasEstimate: "142,500 gas",
    priceImpact: "0.13%",
    approvalRequired: from !== "OKB",
    riskLevel: intent.maxSlippage <= 1 ? "Low" : "Medium",
    route: "X Layer Smart Route",
  }
}
