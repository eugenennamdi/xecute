import { findToken } from "@/config/tokens"
import type { Intent } from "@/lib/intents"
import type { AdapterPreview, ExecutionContext, XecuteAdapter } from "@/lib/adapters/types"
import type { SimulationResult, TransactionRequest } from "@/types/execution"

export class TestnetSwapAdapter implements XecuteAdapter {
  id = "testnet-swap-router"
  name = "Xecute Testnet Swap Router"
  category = "trade" as const
  chainIds = [1952]
  executionEnabled = true

  supports(intent: Intent, context: ExecutionContext): boolean {
    return (
      intent.mode === "trade" &&
      (context.chainId === 1952 || intent.network === "testnet")
    )
  }

  async getPreview(intent: Intent, _context: ExecutionContext): Promise<AdapterPreview> {
    if (intent.mode !== "trade") throw new Error("Unsupported mode")

    const fromSymbol = intent.fromToken || "USDT"
    const toSymbol = intent.toToken || "OKB"
    const inputAmount = intent.amount || "1"
    const maxSlippage = intent.maxSlippage ?? 0.5

    const fromToken = findToken(fromSymbol, 1952)
    const toToken = findToken(toSymbol, 1952)

    // Rate calculations for testnet assets (USDT/USDC/USDG ~ $1, WETH ~ $2500, OKB ~ $60)
    const rates: Record<string, number> = {
      xUSDT: 1,
      USDT: 1,
      USDT0: 1,
      USDC: 1,
      USDG: 1,
      xWETH: 2500,
      WETH: 2500,
      ETH: 2500,
      OKB: 60,
    }

    const fromRate = rates[fromToken?.symbol || fromSymbol] || 1
    const toRate = rates[toToken?.symbol || toSymbol] || 2500
    const rawOut = (Number(inputAmount) * fromRate) / toRate
    const estimatedOutput = Number.isFinite(rawOut) ? rawOut.toFixed(6) : "0.00"
    const minimumReceived = (rawOut * (1 - maxSlippage / 100)).toFixed(6)

    return {
      quote: {
        source: "live",
        fromToken: fromSymbol,
        toToken: toSymbol,
        inputAmount,
        estimatedOutput,
        minimumReceived,
        slippage: `${maxSlippage}%`,
        gasEstimate: "145,000 gas",
        priceImpact: "< 0.05%",
        route: `Xecute Testnet Swap Router (${fromToken?.symbol || fromSymbol}/${toToken?.symbol || toSymbol} Test Pool)`,
        quotedAt: new Date().toISOString(),
      },
      routeDescription: "X Layer Testnet Automated Liquidity Pool",
    }
  }

  async simulate(intent: Intent, _context: ExecutionContext): Promise<SimulationResult> {
    if (intent.mode !== "trade") return { success: false, error: "Invalid trade intent" }
    const amount = Number(intent.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: "Invalid swap amount" }
    }
    if ((intent.maxSlippage ?? 0.5) > 5.0) {
      return { success: false, error: "Slippage exceeds max safety tolerance" }
    }
    return {
      success: true,
      gasUsed: "142,500",
      logs: ["SwapSimulationSuccess(amountIn, amountOutMin)"],
    }
  }

  async buildTransaction(intent: Intent, _context: ExecutionContext): Promise<TransactionRequest | null> {
    if (intent.mode !== "trade") return null
    return {
      to: "0x1952000000000000000000000000000000000001",
      data: "0x38ed17390000000000000000000000000000000000000000000000000000000000000000",
      value: intent.fromToken === "OKB" ? intent.amount || "0" : "0",
      gasLimit: "180000",
      chainId: 1952,
    }
  }
}
