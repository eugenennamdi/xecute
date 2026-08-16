import { findToken } from "@/config/tokens"
import { okxRequest } from "@/lib/okx/client"
import type { Intent } from "@/lib/intents"
import type { AdapterPreview, ExecutionContext, XecuteAdapter } from "@/lib/adapters/types"
import type { SimulationResult, TransactionRequest } from "@/types/execution"

export class MainnetDexQuoteAdapter implements XecuteAdapter {
  id = "okx-dex-aggregator-mainnet"
  name = "OKX DEX Aggregator (X Layer Mainnet)"
  category = "trade" as const
  chainIds = [196]
  executionEnabled = false // Read-only for current Xecute version

  supports(intent: Intent, context: ExecutionContext): boolean {
    return (
      intent.mode === "trade" &&
      (context.chainId === 196 || intent.network === "mainnet")
    )
  }

  async getPreview(intent: Intent, _context: ExecutionContext): Promise<AdapterPreview> {
    if (intent.mode !== "trade") throw new Error("Unsupported mode")

    const fromToken = findToken(intent.fromToken || "USDT0", 196)
    const toToken = findToken(intent.toToken || "OKB", 196)

    if (!fromToken || !toToken) {
      throw new Error(`Token pair not verified on X Layer Mainnet: ${intent.fromToken}/${intent.toToken}`)
    }

    try {
      const fromAddr = fromToken.address === "native" ? "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" : fromToken.address
      const toAddr = toToken.address === "native" ? "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" : toToken.address
      const rawAmount = String(BigInt(Math.floor(Number(intent.amount || "1") * 10 ** fromToken.decimals)))

      const quoteData = await okxRequest<Array<Record<string, unknown>>>({
        path: "/api/v5/dex/aggregator/quote",
        method: "GET",
        query: {
          chainId: "196",
          amount: rawAmount,
          fromTokenAddress: fromAddr,
          toTokenAddress: toAddr,
          slippage: String((intent.maxSlippage ?? 0.5) / 100),
        },
      })

      const first = quoteData[0]
      if (!first || !first.toTokenAmount) {
        throw new Error("No live liquidity route found on X Layer mainnet")
      }

      const outRaw = Number(first.toTokenAmount) / 10 ** toToken.decimals
      const estimatedOutput = outRaw.toFixed(6)
      const minimumReceived = (outRaw * (1 - (intent.maxSlippage ?? 0.5) / 100)).toFixed(6)
      const priceImpact = typeof first.priceImpactPercentage === "string" ? `${first.priceImpactPercentage}%` : "Unavailable"
      const gas = typeof first.estimatedGas === "string" ? `${first.estimatedGas} gas` : "Gas unavailable"

      return {
        quote: {
          source: "live",
          fromToken: fromToken.symbol,
          toToken: toToken.symbol,
          inputAmount: intent.amount || "1",
          estimatedOutput,
          minimumReceived,
          slippage: `${intent.maxSlippage ?? 0.5}%`,
          gasEstimate: gas,
          priceImpact,
          route: "OKX DEX Aggregator (X Layer Mainnet)",
          quotedAt: new Date().toISOString(),
        },
        routeDescription: "Live X Layer Mainnet Aggregated Route (Read-Only)",
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Mainnet live quote unavailable"
      throw new Error(`Live quote unavailable: ${message}`)
    }
  }

  async simulate(_intent: Intent, _context: ExecutionContext): Promise<SimulationResult> {
    return {
      success: false,
      error: "Mainnet execution is disabled in this Xecute version. Live quote is read-only.",
    }
  }

  async buildTransaction(_intent: Intent, _context: ExecutionContext): Promise<TransactionRequest | null> {
    // Mainnet execution is strictly disabled in current Xecute version
    return null
  }
}
