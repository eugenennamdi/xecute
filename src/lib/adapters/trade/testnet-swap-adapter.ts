import { findToken } from "@/config/tokens"
import type { Intent } from "@/lib/intents"
import type { AdapterPreview, ExecutionContext, XecuteAdapter } from "@/lib/adapters/types"
import type { SimulationResult, TransactionRequest } from "@/types/execution"
import { getSwapTransactionPayload, ROUTER_ADDRESS_TESTNET } from "@/lib/contracts/router"
import { callXLayerRpc } from "@/lib/xlayer/rpc"

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

    const fromSymbol = (intent.fromToken || "USDT").toUpperCase()
    const toSymbol = (intent.toToken || "OKB").toUpperCase()
    const inputAmount = intent.amount || "1"
    const maxSlippage = intent.maxSlippage ?? 0.5

    const fromToken = findToken(fromSymbol, 1952)
    const toToken = findToken(toSymbol, 1952)

    if (!fromToken || !toToken) {
      throw new Error(`Unsupported Testnet token pair: ${fromSymbol} / ${toSymbol}`)
    }

    // Deterministic router pricing on X Layer Testnet: 1 OKB = $60 USD tokens, 1 USD token = $1
    let rawOut = 0
    const numAmount = Number(inputAmount)
    if (fromSymbol === "OKB") {
      rawOut = numAmount * 60
    } else if (toSymbol === "OKB") {
      rawOut = numAmount / 60
    } else {
      rawOut = numAmount
    }

    const estimatedOutput = Number.isFinite(rawOut) ? rawOut.toFixed(toSymbol === "OKB" ? 6 : 4) : "0.00"
    const minimumReceived = (rawOut * (1 - maxSlippage / 100)).toFixed(toSymbol === "OKB" ? 6 : 4)

    return {
      quote: {
        source: "simulated",
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        inputAmount,
        estimatedOutput,
        minimumReceived,
        slippage: `${maxSlippage}%`,
        gasEstimate: "142,500 gas",
        priceImpact: "0.00%",
        route: `Xecute Testnet Router (${ROUTER_ADDRESS_TESTNET.slice(0, 6)}...${ROUTER_ADDRESS_TESTNET.slice(-4)})`,
        quotedAt: new Date().toISOString(),
      },
      routeDescription: "Deterministic Testnet pricing (Xecute Testnet Router)",
    }
  }

  async simulate(intent: Intent, context: ExecutionContext): Promise<SimulationResult> {
    if (intent.mode !== "trade") return { success: false, error: "Invalid trade intent" }
    const amount = Number(intent.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: "Invalid swap amount" }
    }
    if ((intent.maxSlippage ?? 0.5) > 5.0) {
      return { success: false, error: "Slippage exceeds max safety tolerance (5.0%)" }
    }

    const fromSymbol = (intent.fromToken || "OKB").toUpperCase()
    const toSymbol = (intent.toToken || "USDT").toUpperCase()
    const recipient = (context.walletAddress || "0x1111111111111111111111111111111111111111") as `0x${string}`

    try {
      const payload = getSwapTransactionPayload({
        fromTokenSymbol: fromSymbol,
        toTokenSymbol: toSymbol,
        amount: intent.amount || "1",
        recipient,
        slippage: intent.maxSlippage ?? 0.5,
      })

      // Perform genuine dry-run simulation via eth_call against live X Layer Testnet RPC
      await callXLayerRpc(
        "eth_call",
        [
          {
            from: recipient,
            to: payload.to,
            data: payload.data,
            value: payload.value,
          },
          "latest",
        ],
        "testnet",
      )

      return {
        success: true,
        gasUsed: "142,500",
        logs: ["XecuteTestnetRouterSimulationSuccess"],
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Simulation reverted"
      // If error is liquidity or slippage, return clear deterministic error
      return {
        success: false,
        error: `Testnet simulation reverted: ${msg}`,
      }
    }
  }

  async buildTransaction(intent: Intent, context: ExecutionContext): Promise<TransactionRequest | null> {
    if (intent.mode !== "trade" || !intent.fromToken || !intent.toToken || !intent.amount) return null

    const recipient = (context.walletAddress || "0x0000000000000000000000000000000000000000") as `0x${string}`
    const payload = getSwapTransactionPayload({
      fromTokenSymbol: intent.fromToken,
      toTokenSymbol: intent.toToken,
      amount: intent.amount,
      recipient,
      slippage: intent.maxSlippage ?? 0.5,
    })

    return {
      to: payload.to,
      data: payload.data,
      value: payload.value,
      gasLimit: "180000",
      chainId: 1952,
    }
  }
}
