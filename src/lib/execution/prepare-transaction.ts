import { isAddress, getAddress, parseUnits, parseEther, formatEther } from "viem"
import { callXLayerRpc, getXLayerNativeBalance, getXLayerTokenBalance } from "@/lib/xlayer/rpc"
import {
  getSwapTransactionPayload,
  getTransferTransactionPayload,
  getApprovalTransactionPayload,
  MissingExecutionParameterError,
  ROUTER_ADDRESS_TESTNET,
} from "@/lib/contracts/router"
import { findToken } from "@/config/tokens"

export { MissingExecutionParameterError }

export const MIN_GAS_RESERVE_WEI = parseEther("0.005") // 0.005 OKB

export class InsufficientGasReserveError extends Error {
  constructor(
    public readonly liveNativeBalanceWei: bigint,
    public readonly txValueWei: bigint,
    public readonly estimatedGasCostWei: bigint,
    public readonly remainingNativeWei: bigint,
  ) {
    super(
      `Execution blocked: Insufficient native OKB balance to maintain the mandatory 0.005 OKB gas reserve. ` +
        `Live balance: ${formatEther(liveNativeBalanceWei)} OKB, Value: ${formatEther(txValueWei)} OKB, ` +
        `Estimated gas cost: ${formatEther(estimatedGasCostWei)} OKB. ` +
        `Remaining would be: ${formatEther(remainingNativeWei)} OKB.`,
    )
    this.name = "InsufficientGasReserveError"
  }
}

export class InsufficientTokenBalanceError extends Error {
  constructor(
    public readonly tokenSymbol: string,
    public readonly requiredAmount: string,
    public readonly availableBalance: string,
  ) {
    super(
      `Execution blocked: Insufficient ${tokenSymbol} balance. Required: ${requiredAmount} ${tokenSymbol}, Available: ${availableBalance} ${tokenSymbol}.`,
    )
    this.name = "InsufficientTokenBalanceError"
  }
}

export class NativeBalanceUnavailableError extends Error {
  constructor(public readonly details: string) {
    super(`Execution blocked: Live native OKB balance is unavailable from X Layer Testnet: ${details}`)
    this.name = "NativeBalanceUnavailableError"
  }
}

export class TokenBalanceUnavailableError extends Error {
  constructor(public readonly tokenSymbol: string, public readonly details: string) {
    super(`Execution blocked: Live ${tokenSymbol} balance is unavailable from X Layer Testnet: ${details}`)
    this.name = "TokenBalanceUnavailableError"
  }
}

export class SimulationFailedError extends Error {
  constructor(public readonly details: string) {
    super(`Execution blocked: Preflight simulation (eth_call) reverted on X Layer Testnet: ${details}`)
    this.name = "SimulationFailedError"
  }
}

export class GasEstimationFailedError extends Error {
  constructor(public readonly details: string) {
    super(`Execution blocked: Live gas estimation (eth_estimateGas) failed on X Layer Testnet: ${details}`)
    this.name = "GasEstimationFailedError"
  }
}

export class GasPriceUnavailableError extends Error {
  constructor(public readonly details: string) {
    super(`Execution blocked: Live gas price is unavailable from X Layer Testnet: ${details}`)
    this.name = "GasPriceUnavailableError"
  }
}

export interface PreparedExecutionTransaction {
  action: "swap" | "transfer" | "approve" | "revoke"
  to: `0x${string}`
  value: `0x${string}`
  data: `0x${string}`
  gasLimit: `0x${string}`
  gasUnits: bigint
  gasPriceWei: bigint
  estimatedGasCostWei: bigint
  nativeBalanceWei: bigint
  remainingNativeWei: bigint
  chainId: 1952
  from: `0x${string}`
  functionSelector: `0x${string}`
}

export async function prepareExecutionTransaction(params: {
  action: "swap" | "transfer" | "approve" | "revoke"
  fromToken?: string
  toToken?: string
  amount?: string
  recipient?: string
  spender?: string
  slippage?: number
  walletAddress: string
}): Promise<PreparedExecutionTransaction> {
  const { action, fromToken, toToken, amount, recipient, spender, slippage, walletAddress } = params

  if (!walletAddress || !isAddress(walletAddress, { strict: false })) {
    throw new MissingExecutionParameterError("walletAddress")
  }
  const fromAddr = getAddress(walletAddress)

  let payload: { to: `0x${string}`; value: `0x${string}`; data: `0x${string}` }

  // 1. Build deterministic transaction payload
  if (action === "swap") {
    if (!fromToken) throw new MissingExecutionParameterError("fromToken")
    if (!toToken) throw new MissingExecutionParameterError("toToken")
    if (!amount) throw new MissingExecutionParameterError("amount")

    const p = getSwapTransactionPayload({
      fromTokenSymbol: fromToken,
      toTokenSymbol: toToken,
      amount,
      recipient: fromAddr,
      slippage: slippage ?? 0.5,
    })
    payload = {
      to: getAddress(p.to),
      value: (p.value.startsWith("0x") ? p.value : `0x${BigInt(p.value).toString(16)}`) as `0x${string}`,
      data: p.data as `0x${string}`,
    }
  } else if (action === "transfer") {
    if (!fromToken) throw new MissingExecutionParameterError("fromToken")
    if (!amount) throw new MissingExecutionParameterError("amount")
    if (!recipient || !isAddress(recipient, { strict: false })) {
      throw new MissingExecutionParameterError("recipient")
    }

    const p = getTransferTransactionPayload({
      tokenSymbol: fromToken,
      amount,
      recipient: getAddress(recipient),
    })
    payload = {
      to: getAddress(p.to),
      value: (p.value.startsWith("0x") ? p.value : `0x${BigInt(p.value).toString(16)}`) as `0x${string}`,
      data: (p.data || "0x") as `0x${string}`,
    }
  } else if (action === "approve" || action === "revoke") {
    if (!fromToken) throw new MissingExecutionParameterError("fromToken")
    const targetSpender = spender ?? ROUTER_ADDRESS_TESTNET
    if (!targetSpender || !isAddress(targetSpender, { strict: false })) {
      throw new MissingExecutionParameterError("spender")
    }

    const p = getApprovalTransactionPayload({
      tokenSymbol: fromToken,
      amount: action === "revoke" ? "0" : (amount ?? "0"),
      spender: getAddress(targetSpender),
    })
    payload = {
      to: getAddress(p.to),
      value: "0x0" as `0x${string}`,
      data: p.data as `0x${string}`,
    }
  } else {
    throw new Error(`Unsupported execution action: ${action}`)
  }

  const txValueWei = BigInt(payload.value)

  // 2. Query live native balance immediately to verify initial solvency & gas reserve
  const nativeBalRes = await getXLayerNativeBalance(fromAddr, "testnet")
  if (!nativeBalRes.success || nativeBalRes.rawBigInt === undefined) {
    throw new NativeBalanceUnavailableError(nativeBalRes.error || "Failed to fetch native balance")
  }
  const nativeBalanceWei = nativeBalRes.rawBigInt

  if (nativeBalanceWei < txValueWei + MIN_GAS_RESERVE_WEI) {
    const deficitWei = (txValueWei + MIN_GAS_RESERVE_WEI) - nativeBalanceWei
    throw new InsufficientGasReserveError(nativeBalanceWei, txValueWei, BigInt(0), -deficitWei)
  }

  // 3. Token Balance Check for ERC-20 operations
  if (action === "transfer" || action === "swap") {
    const tokenSymbol = fromToken!.toUpperCase()
    const tokenCfg = findToken(tokenSymbol, 1952)
    if (tokenCfg && tokenCfg.address !== "native" && amount) {
      const tokBalRes = await getXLayerTokenBalance(tokenCfg.address, fromAddr, tokenCfg.decimals, "testnet")
      if (!tokBalRes.success || tokBalRes.rawBigInt === undefined) {
        throw new TokenBalanceUnavailableError(tokenSymbol, tokBalRes.error || "Failed to fetch token balance")
      }
      const requiredTokens = parseUnits(amount, tokenCfg.decimals)
      if (tokBalRes.rawBigInt < requiredTokens) {
        throw new InsufficientTokenBalanceError(tokenSymbol, amount, tokBalRes.balance)
      }
    }
  }

  // 4. Preflight Dry-Run Simulation via eth_call
  try {
    await callXLayerRpc(
      "eth_call",
      [
        {
          from: fromAddr,
          to: payload.to,
          data: payload.data,
          value: payload.value,
        },
        "latest",
      ],
      "testnet",
    )
  } catch (simError) {
    const msg = simError instanceof Error ? simError.message : "reverted"
    throw new SimulationFailedError(msg)
  }

  // 5. Exact Gas Estimation via eth_estimateGas
  let estGasHex: string
  try {
    estGasHex = await callXLayerRpc<string>(
      "eth_estimateGas",
      [
        {
          from: fromAddr,
          to: payload.to,
          data: payload.data,
          value: payload.value,
        },
      ],
      "testnet",
    )
  } catch (estError) {
    const msg = estError instanceof Error ? estError.message : "estimation failed"
    throw new GasEstimationFailedError(msg)
  }

  if (!estGasHex || estGasHex === "0x" || estGasHex === "0x0") {
    throw new GasEstimationFailedError("RPC returned zero or empty gas estimate")
  }

  const rawGasUnits = BigInt(estGasHex)
  // Apply deterministic 20% safety policy buffer
  const gasUnits = (rawGasUnits * BigInt(120)) / BigInt(100)
  const gasLimit = `0x${gasUnits.toString(16)}` as `0x${string}`

  // 6. Query live gas price via eth_gasPrice
  let gasPriceHex: string
  try {
    gasPriceHex = await callXLayerRpc<string>("eth_gasPrice", [], "testnet")
  } catch (priceError) {
    const msg = priceError instanceof Error ? priceError.message : "gas price query failed"
    throw new GasPriceUnavailableError(msg)
  }

  if (!gasPriceHex || gasPriceHex === "0x") {
    throw new GasPriceUnavailableError("RPC returned empty gas price")
  }
  const gasPriceWei = BigInt(gasPriceHex)
  const estimatedGasCostWei = gasUnits * gasPriceWei

  // 7. Mandatory Final Gas Reserve Enforcement: remaining OKB = nativeBalance - txValue - estimatedGasCost >= 0.005 OKB
  const totalCostWei = txValueWei + estimatedGasCostWei
  if (nativeBalanceWei < totalCostWei) {
    const deficitWei = totalCostWei - nativeBalanceWei
    throw new InsufficientGasReserveError(nativeBalanceWei, txValueWei, estimatedGasCostWei, -deficitWei)
  }

  const remainingNativeWei = nativeBalanceWei - totalCostWei
  if (remainingNativeWei < MIN_GAS_RESERVE_WEI) {
    throw new InsufficientGasReserveError(nativeBalanceWei, txValueWei, estimatedGasCostWei, remainingNativeWei)
  }

  const functionSelector = (payload.data.length >= 10 ? payload.data.slice(0, 10) : "0x") as `0x${string}`

  return {
    action,
    to: payload.to,
    value: payload.value,
    data: payload.data,
    gasLimit,
    gasUnits,
    gasPriceWei,
    estimatedGasCostWei,
    nativeBalanceWei,
    remainingNativeWei,
    chainId: 1952,
    from: fromAddr,
    functionSelector,
  }
}
