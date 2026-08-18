import { parseUnits, formatUnits } from "viem"
import { findToken } from "@/config/tokens"
import { okxRequest } from "@/lib/okx/client"
import type { Intent } from "@/lib/intents"
import type { AdapterPreview, ExecutionContext, XecuteAdapter } from "@/lib/adapters/types"
import type { SimulationResult, TransactionRequest } from "@/types/execution"
import { MissingExecutionParameterError, UnsupportedTokenError } from "@/lib/contracts/router"

export class MainnetDexQuoteAdapter implements XecuteAdapter {
  id = "okx-dex-aggregator-mainnet"
  name = "OKX DEX Aggregator (X Layer Mainnet)"
  category = "trade" as const
  chainIds = [196]
  executionEnabled = false // Read-only for current Xecute version

  supports(intent: Intent, context: ExecutionContext): boolean {
    return (
      intent.mode === "trade" &&
      intent.network === "mainnet" &&
      context.chainId === 196 &&
      this.chainIds.includes(196)
    )
  }

  async getPreview(intent: Intent, _context: ExecutionContext): Promise<AdapterPreview> {
    if (intent.mode !== "trade") throw new Error("Unsupported mode")
    if (!intent.fromToken) throw new MissingExecutionParameterError("fromToken")
    if (!intent.toToken) throw new MissingExecutionParameterError("toToken")
    if (!intent.amount) throw new MissingExecutionParameterError("amount")

    const fromToken = findToken(intent.fromToken, 196)
    const toToken = findToken(intent.toToken, 196)

    if (!fromToken || !toToken) {
      throw new UnsupportedTokenError(`${intent.fromToken}/${intent.toToken}`)
    }

    try {
      const fromAddr = fromToken.address === "native" ? "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" : fromToken.address
      const toAddr = toToken.address === "native" ? "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" : toToken.address
      const rawAmount = parseUnits(intent.amount, fromToken.decimals).toString()

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

      const toTokenAmountBigInt = BigInt(String(first.toTokenAmount))
      const estimatedOutput = formatUnits(toTokenAmountBigInt, toToken.decimals)
      const slippageBps = BigInt(Math.min(500, Math.max(0, Math.round((intent.maxSlippage ?? 0.5) * 100))))
      const minAmountOutUnits = (toTokenAmountBigInt * (BigInt(10000) - slippageBps)) / BigInt(10000)
      const minimumReceived = formatUnits(minAmountOutUnits, toToken.decimals)
      const priceImpact = typeof first.priceImpactPercentage === "string" ? `${first.priceImpactPercentage}%` : "Unavailable"
      const gas = typeof first.estimatedGas === "string" ? `${first.estimatedGas} gas` : "Gas unavailable"

      return {
        quote: {
          source: "live",
          fromToken: fromToken.symbol,
          toToken: toToken.symbol,
          inputAmount: intent.amount,
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
