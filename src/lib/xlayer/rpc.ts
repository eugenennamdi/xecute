import { XLAYER_NETWORKS, type Environment } from "@/config/networks"

type JsonRpcResponse<T> = {
  jsonrpc: "2.0"
  id: number
  result?: T
  error?: { code: number; message: string; data?: unknown }
}

export async function callXLayerRpc<T = unknown>(
  method: string,
  params: unknown[] = [],
  environment: Environment = "testnet",
  timeoutMs = 30000,
): Promise<T> {
  const config = XLAYER_NETWORKS[environment]
  const urls = config.rpcUrls
  let lastError: Error | null = null

  for (const url of urls) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method,
          params,
          id: 1,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`RPC returned HTTP ${response.status}`)
      }

      const payload = (await response.json()) as JsonRpcResponse<T>
      if (payload.error) {
        throw new Error(payload.error.message || "JSON-RPC error")
      }

      if (payload.result !== undefined) {
        return payload.result
      }
    } catch (err) {
      if (err instanceof Error && (err.name === "AbortError" || err.message.includes("aborted"))) {
        lastError = new Error(`RPC request to ${url} timed out after ${timeoutMs / 1000}s`)
      } else {
        lastError = err instanceof Error ? err : new Error(String(err))
      }
    }
  }

  throw lastError || new Error(`All RPC endpoints failed for ${environment}`)
}

/**
 * Format hex wei balance into a human-readable decimal string
 */
export function formatWei(hexOrBigInt: string | bigint, decimals = 18): string {
  try {
    const value = typeof hexOrBigInt === "string" ? BigInt(hexOrBigInt) : hexOrBigInt
    const divisor = BigInt(10) ** BigInt(decimals)
    const integerPart = value / divisor
    const remainder = value % divisor

    if (remainder === BigInt(0)) return integerPart.toString()

    const remainderStr = remainder.toString().padStart(decimals, "0")
    // Keep at most 6 decimal places for cleanliness, trimming trailing zeros
    const trimmed = remainderStr.slice(0, 6).replace(/0+$/, "")
    return trimmed.length > 0 ? `${integerPart}.${trimmed}` : integerPart.toString()
  } catch {
    return "Unavailable"
  }
}

/**
 * Read native OKB balance for an address on X Layer Testnet or Mainnet
 */
/**
 * Read native OKB balance for an address on X Layer Testnet or Mainnet
 */
export async function getXLayerNativeBalance(
  address: string,
  environment: Environment = "testnet",
): Promise<{ success: boolean; balance: string; rawWei: string; rawBigInt?: bigint; error?: string }> {
  try {
    const result = await callXLayerRpc<string>("eth_getBalance", [address, "latest"], environment)
    if (!result || result === "0x") {
      return {
        success: false,
        balance: "Unavailable",
        rawWei: "0x0",
        error: "RPC returned empty balance response",
      }
    }
    const rawBigInt = BigInt(result)
    return {
      success: true,
      balance: formatWei(result, 18),
      rawWei: result,
      rawBigInt,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch native balance"
    return {
      success: false,
      balance: "Unavailable",
      rawWei: "0x0",
      error: message,
    }
  }
}

/**
 * Read transaction count (nonce) for an address
 */
export async function getXLayerTransactionCount(
  address: string,
  environment: Environment = "testnet",
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const result = await callXLayerRpc<string>("eth_getTransactionCount", [address, "latest"], environment)
    if (!result || result === "0x") {
      return { success: false, error: "RPC returned empty transaction count" }
    }
    return { success: true, count: Number.parseInt(result, 16) }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch transaction count"
    return { success: false, error: message }
  }
}

/**
 * Check if an address is a deployed smart contract
 */
export async function isXLayerContract(
  address: string,
  environment: Environment = "testnet",
): Promise<{ success: boolean; isContract?: boolean; error?: string }> {
  try {
    const result = await callXLayerRpc<string>("eth_getCode", [address, "latest"], environment)
    if (!result) return { success: false, error: "Empty code response" }
    return {
      success: true,
      isContract: result !== "0x" && result !== "0x0" && result.length > 2,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to query code"
    return { success: false, error: message }
  }
}

/**
 * Get current block height on X Layer
 */
export async function getXLayerBlockNumber(
  environment: Environment = "testnet",
): Promise<{ success: boolean; blockNumber?: number; error?: string }> {
  try {
    const result = await callXLayerRpc<string>("eth_blockNumber", [], environment)
    if (!result || result === "0x") {
      return { success: false, error: "RPC returned empty block number" }
    }
    return { success: true, blockNumber: Number.parseInt(result, 16) }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch block number"
    return { success: false, error: message }
  }
}

/**
 * Get current gas price in Gwei on X Layer
 */
export async function getXLayerGasPriceGwei(
  environment: Environment = "testnet",
): Promise<{ success: boolean; gasPriceGwei: string; error?: string }> {
  try {
    const result = await callXLayerRpc<string>("eth_gasPrice", [], environment)
    if (!result || result === "0x") {
      return { success: false, gasPriceGwei: "Unavailable", error: "Empty gas price response" }
    }
    const wei = BigInt(result)
    const gweiDecimal = Number(wei) / 1e9
    const gasPriceGwei = gweiDecimal < 0.01 ? "<0.01" : gweiDecimal.toFixed(3)
    return { success: true, gasPriceGwei }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch gas price"
    return { success: false, gasPriceGwei: "Unavailable", error: message }
  }
}

/**
 * Read ERC-20 token balance using eth_call balanceOf(address)
 */
export async function getXLayerTokenBalance(
  tokenAddress: string,
  userAddress: string,
  decimals = 18,
  environment: Environment = "testnet",
): Promise<{ success: boolean; balance: string; rawHex: string; rawBigInt?: bigint; error?: string }> {
  try {
    // balanceOf(address) function selector: 0x70a08231 + 32-byte zero-padded address
    const cleanAddress = userAddress.toLowerCase().replace(/^0x/, "").padStart(64, "0")
    const callData = `0x70a08231${cleanAddress}`

    const result = await callXLayerRpc<string>(
      "eth_call",
      [{ to: tokenAddress, data: callData }, "latest"],
      environment,
    )

    if (!result || result === "0x") {
      return { success: false, balance: "Unavailable", rawHex: "0x0", error: "Contract returned empty balanceOf response" }
    }
    const rawBigInt = BigInt(result)
    return {
      success: true,
      balance: formatWei(result, decimals),
      rawHex: result,
      rawBigInt,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch token balance"
    return { success: false, balance: "Unavailable", rawHex: "0x0", error: message }
  }
}

/**
 * Read complete onchain account snapshot on X Layer
 */
export async function getXLayerAccountSnapshot(
  address: string,
  environment: Environment = "testnet",
): Promise<{
  address: string
  environment: Environment
  chainId: number
  nativeBalance: string
  nativeSymbol: string
  transactionCount: number | "Unavailable"
  isContract: boolean | "Unknown"
  blockNumber: number | "Unavailable"
  gasPriceGwei: string
  observedAt: string
}> {
  const config = XLAYER_NETWORKS[environment]

  const [balanceRes, txRes, contractRes, blockRes, gasRes] = await Promise.all([
    getXLayerNativeBalance(address, environment),
    getXLayerTransactionCount(address, environment),
    isXLayerContract(address, environment),
    getXLayerBlockNumber(environment),
    getXLayerGasPriceGwei(environment),
  ])

  return {
    address,
    environment,
    chainId: config.chainId,
    nativeBalance: balanceRes.success ? balanceRes.balance : "Unavailable",
    nativeSymbol: "OKB",
    transactionCount: txRes.success && txRes.count !== undefined ? txRes.count : "Unavailable",
    isContract: contractRes.success && contractRes.isContract !== undefined ? contractRes.isContract : "Unknown",
    blockNumber: blockRes.success && blockRes.blockNumber !== undefined ? blockRes.blockNumber : "Unavailable",
    gasPriceGwei: gasRes.success ? gasRes.gasPriceGwei : "Unavailable",
    observedAt: new Date().toISOString(),
  }
}

/**
 * Query real onchain transaction receipt via eth_getTransactionReceipt
 */
export async function getXLayerTransactionReceipt(
  txHash: string,
  environment: Environment = "testnet",
): Promise<{
  status: "mined" | "pending" | "not_found" | "error"
  success?: boolean
  gasUsed?: string
  blockNumber?: number
  error?: string
}> {
  try {
    const receipt = await callXLayerRpc<Record<string, unknown> | null>(
      "eth_getTransactionReceipt",
      [txHash],
      environment,
    )
    if (!receipt) {
      return { status: "pending" }
    }
    const statusHex = receipt.status ? String(receipt.status) : undefined
    const isSuccess = statusHex === "0x1" || statusHex === "1"
    let gasUsed: string | undefined
    if (receipt.gasUsed) {
      try {
        gasUsed = BigInt(String(receipt.gasUsed)).toString()
      } catch {
        gasUsed = undefined
      }
    }
    const blockNumber = receipt.blockNumber ? Number.parseInt(String(receipt.blockNumber), 16) : undefined
    return {
      status: "mined",
      success: isSuccess,
      gasUsed,
      blockNumber,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "RPC error polling receipt"
    return { status: "error", error: msg }
  }
}

/**
 * Classify address as EOA or Contract via eth_getCode
 */
export async function getXLayerAccountType(
  address: string,
  environment: Environment = "testnet",
): Promise<"EOA" | "Contract" | "Unknown"> {
  try {
    const code = await callXLayerRpc<string>("eth_getCode", [address, "latest"], environment)
    if (!code) return "Unknown"
    return code !== "0x" && code !== "0x0" && code.length > 2 ? "Contract" : "EOA"
  } catch {
    return "Unknown"
  }
}

const MAX_UINT256 = (BigInt(1) << BigInt(256)) - BigInt(1)
export const DEFAULT_APPROVAL_LOOKBACK_BLOCKS = 50000
export const APPROVAL_LOGS_CHUNK_SIZE = 5000

/**
 * Read ERC-20 token allowance using eth_call allowance(owner, spender)
 * Selector: 0xdd62ed3e
 */
export async function getXLayerTokenAllowance(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  decimals = 18,
  environment: Environment = "testnet",
): Promise<{
  success: boolean
  allowance: string
  rawHex: string
  isUnlimited: boolean
  rawBigInt?: bigint
  error?: string
}> {
  try {
    const cleanOwner = ownerAddress.toLowerCase().replace(/^0x/, "").padStart(64, "0")
    const cleanSpender = spenderAddress.toLowerCase().replace(/^0x/, "").padStart(64, "0")
    const callData = `0xdd62ed3e${cleanOwner}${cleanSpender}`

    const result = await callXLayerRpc<string>(
      "eth_call",
      [{ to: tokenAddress, data: callData }, "latest"],
      environment,
    )

    if (!result || result === "0x") {
      return {
        success: false,
        allowance: "Unknown",
        rawHex: "",
        isUnlimited: false,
        error: "Contract returned empty allowance response",
      }
    }

    const rawBigInt = BigInt(result)
    // isUnlimited is strictly true ONLY when allowance === MAX_UINT256 (no tolerance or near-max rule)
    const isUnlimited = rawBigInt === MAX_UINT256
    return {
      success: true,
      allowance: isUnlimited ? "Unlimited" : formatWei(result, decimals),
      rawHex: result,
      isUnlimited,
      rawBigInt,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "RPC allowance query failed"
    return {
      success: false,
      allowance: "Unknown",
      rawHex: "",
      isUnlimited: false,
      error: message,
    }
  }
}

/**
 * Discover onchain Approval(owner, spender, value) events for candidate tokens
 * Paginates historical discovery in chunks (e.g. 5,000 blocks per request) over the scan horizon
 */
export async function getXLayerApprovalLogs(
  ownerAddress: string,
  tokenAddresses: string[],
  environment: Environment = "testnet",
  lookbackBlocks?: number,
  chunkSize?: number,
): Promise<{
  success: boolean
  events: Array<{ tokenAddress: string; spenderAddress: string; blockNumber: number }>
  startBlock: number
  endBlock: number
  error?: string
}> {
  const isTestnet = environment === "testnet"
  const effectiveLookback = lookbackBlocks ?? (isTestnet ? 500 : DEFAULT_APPROVAL_LOOKBACK_BLOCKS)
  const effectiveChunkSize = chunkSize ?? (isTestnet ? 90 : APPROVAL_LOGS_CHUNK_SIZE)

  const blockRes = await getXLayerBlockNumber(environment)
  const currentBlock = blockRes.success && blockRes.blockNumber !== undefined ? blockRes.blockNumber : 0
  const endBlock = currentBlock
  const startBlock = Math.max(0, currentBlock - effectiveLookback)

  if (endBlock === 0 || tokenAddresses.length === 0) {
    return { success: blockRes.success, events: [], startBlock: 0, endBlock: 0 }
  }

  try {
    const cleanOwner = "0x" + ownerAddress.toLowerCase().replace(/^0x/, "").padStart(64, "0")
    const approvalTopic = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925"

    // Construct contiguous, non-overlapping chunks from startBlock to endBlock
    const chunks: Array<{ from: number; to: number }> = []
    for (let from = startBlock; from <= endBlock; from += effectiveChunkSize) {
      const to = Math.min(from + effectiveChunkSize - 1, endBlock)
      chunks.push({ from, to })
    }

    const pairMap = new Map<string, { tokenAddress: string; spenderAddress: string; blockNumber: number }>()
    let hasError = false
    let lastError: string | undefined

    const chunkResults = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const fromHex = `0x${chunk.from.toString(16)}`
          const toHex = `0x${chunk.to.toString(16)}`

          const logs = await callXLayerRpc<Array<{ address: string; topics: string[]; blockNumber: string }>>(
            "eth_getLogs",
            [
              {
                fromBlock: fromHex,
                toBlock: toHex,
                address: tokenAddresses.length === 1 ? tokenAddresses[0] : tokenAddresses,
                topics: [approvalTopic, cleanOwner],
              },
            ],
            environment,
          )

          return { ok: true, logs: Array.isArray(logs) ? logs : [] }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "RPC error on log chunk query"
          return { ok: false, error: errorMsg, logs: [] }
        }
      }),
    )

    for (const res of chunkResults) {
      if (!res.ok) {
        hasError = true
        lastError = res.error
      }
      for (const log of res.logs) {
        if (log.topics && log.topics.length >= 3) {
          const spenderRaw = log.topics[2]
          const spenderAddress = "0x" + spenderRaw.slice(26).toLowerCase()
          const tokenAddress = log.address.toLowerCase()
          const blockNumber = Number.parseInt(log.blockNumber || "0", 16)
          const key = `${tokenAddress}-${spenderAddress}`
          const existing = pairMap.get(key)
          if (!existing || blockNumber > existing.blockNumber) {
            pairMap.set(key, { tokenAddress, spenderAddress, blockNumber })
          }
        }
      }
    }

    const events = Array.from(pairMap.values())
    if (hasError && events.length === 0) {
      return { success: false, events: [], startBlock, endBlock, error: lastError }
    }

    return {
      success: !hasError,
      events,
      startBlock,
      endBlock,
      ...(hasError && { error: lastError }),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Approval event logs query failed"
    return { success: false, events: [], startBlock, endBlock, error: message }
  }
}
