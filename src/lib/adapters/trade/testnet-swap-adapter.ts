import { findToken } from "@/config/tokens"
import type { Intent } from "@/lib/intents"
import type { AdapterPreview, ExecutionContext, XecuteAdapter } from "@/lib/adapters/types"
import type { SimulationResult, TransactionRequest } from "@/types/execution"
import {
  getSwapTransactionPayload,
  ROUTER_ADDRESS_TESTNET,
  MissingExecutionParameterError,
  UnsupportedTokenError,
} from "@/lib/contracts/router"
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
      intent.network === "testnet" &&
      context.chainId === 1952 &&
      this.chainIds.includes(1952)
    )
  }

  async getPreview(intent: Intent, context: ExecutionContext): Promise<AdapterPreview> {
    if (intent.mode !== "trade") throw new Error("Unsupported mode")
    if (!intent.fromToken) throw new MissingExecutionParameterError("fromToken")
    if (!intent.toToken) throw new MissingExecutionParameterError("toToken")
    if (!intent.amount) throw new MissingExecutionParameterError("amount")

    const fromSymbol = intent.fromToken.toUpperCase()
    const toSymbol = intent.toToken.toUpperCase()
    const inputAmount = intent.amount
    const maxSlippage = intent.maxSlippage ?? 0.5
    const recipient = (context.walletAddress || "0x0000000000000000000000000000000000000000") as `0x${string}`

    const fromToken = findToken(fromSymbol, 1952)
    const toToken = findToken(toSymbol, 1952)

    if (!fromToken || !toToken) {
      throw new UnsupportedTokenError(`${fromSymbol}/${toSymbol}`)
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

    // Real live gas estimation via eth_estimateGas
    let gasEstimate = "Gas estimate unavailable"
    if (context.walletAddress) {
      try {
        const payload = getSwapTransactionPayload({
          fromTokenSymbol: fromSymbol,
          toTokenSymbol: toSymbol,
          amount: inputAmount,
          recipient: context.walletAddress,
          slippage: maxSlippage,
        })
        const estRes = await callXLayerRpc<string>(
          "eth_estimateGas",
          [
            {
              from: context.walletAddress,
              to: payload.to,
              data: payload.data,
              value: payload.value,
            },
          ],
          "testnet",
        )
        if (estRes) {
          const gasUnits = Number(BigInt(estRes))
          gasEstimate = `~${gasUnits.toLocaleString("en-US")} gas`
        }
      } catch {
        gasEstimate = "Gas estimate unavailable"
      }
    }

    return {
      quote: {
        source: "simulated",
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        inputAmount,
        estimatedOutput,
        minimumReceived,
        slippage: `${maxSlippage}%`,
        gasEstimate,
        priceImpact: "0.00%",
        route: `Xecute Testnet Router (${ROUTER_ADDRESS_TESTNET.slice(0, 6)}...${ROUTER_ADDRESS_TESTNET.slice(-4)})`,
        quotedAt: new Date().toISOString(),
      },
      routeDescription: "Deterministic Testnet pricing (Xecute Testnet Router)",
    }
  }

  async simulate(intent: Intent, context: ExecutionContext): Promise<SimulationResult> {
    if (intent.mode !== "trade") return { success: false, error: "Invalid trade intent" }
    if (!intent.fromToken || !intent.toToken || !intent.amount) {
      return { success: false, error: "Missing required swap parameters for simulation" }
    }
    const amount = Number(intent.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: "Invalid swap amount" }
    }
    if ((intent.maxSlippage ?? 0.5) > 5.0) {
      return { success: false, error: "Slippage exceeds max safety tolerance (5.0%)" }
    }
    if (!context.walletAddress) {
      return { success: false, error: "Wallet address required for simulation" }
    }

    const fromSymbol = intent.fromToken.toUpperCase()
    const toSymbol = intent.toToken.toUpperCase()
    const recipient = context.walletAddress as `0x${string}`

    try {
      const payload = getSwapTransactionPayload({
        fromTokenSymbol: fromSymbol,
        toTokenSymbol: toSymbol,
        amount: intent.amount,
        recipient,
        slippage: intent.maxSlippage ?? 0.5,
      })

      // 1. Perform genuine dry-run simulation via eth_call against live X Layer Testnet RPC
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

      // 2. Perform live gas estimation
      const estRes = await callXLayerRpc<string>(
        "eth_estimateGas",
        [
          {
            from: recipient,
            to: payload.to,
            data: payload.data,
            value: payload.value,
          },
        ],
        "testnet",
      )

      const estimatedGasUnits = estRes ? Number(BigInt(estRes)).toLocaleString("en-US") + " gas" : "Estimated"

      return {
        success: true,
        gasUsed: estimatedGasUnits,
        logs: ["XecuteTestnetRouterSimulationSuccess"],
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Simulation reverted"
      return {
        success: false,
        error: `Testnet simulation reverted: ${msg}`,
      }
    }
  }

  async buildTransaction(intent: Intent, context: ExecutionContext): Promise<TransactionRequest | null> {
    if (intent.mode !== "trade" || !intent.fromToken || !intent.toToken || !intent.amount) return null
    if (!context.walletAddress) throw new MissingExecutionParameterError("walletAddress")

    const recipient = context.walletAddress as `0x${string}`
    const payload = getSwapTransactionPayload({
      fromTokenSymbol: intent.fromToken,
      toTokenSymbol: intent.toToken,
      amount: intent.amount,
      recipient,
      slippage: intent.maxSlippage ?? 0.5,
    })

    // Estimate gas for the exact transaction payload
    let gasLimit = "180000"
    try {
      const est = await callXLayerRpc<string>(
        "eth_estimateGas",
        [
          {
            from: recipient,
            to: payload.to,
            data: payload.data,
            value: payload.value,
          },
        ],
        "testnet",
      )
      if (est) {
        // Apply 20% deterministic policy buffer for execution safety
        const gasUnits = BigInt(est)
        const buffered = (gasUnits * BigInt(120)) / BigInt(100)
        gasLimit = buffered.toString()
      }
    } catch {
      // If estimate fails during final build, keep conservative limit
    }

    return {
      to: payload.to,
      data: payload.data,
      value: payload.value,
      gasLimit,
      chainId: 1952,
    }
  }
}
