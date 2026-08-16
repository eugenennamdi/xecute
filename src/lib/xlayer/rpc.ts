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
): Promise<T> {
  const config = XLAYER_NETWORKS[environment]
  const urls = config.rpcUrls
  let lastError: Error | null = null

  for (const url of urls) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

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
      lastError = err instanceof Error ? err : new Error(String(err))
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
    return "0"
  }
}

/**
 * Read native OKB balance for an address on X Layer Testnet or Mainnet
 */
export async function getXLayerNativeBalance(
  address: string,
  environment: Environment = "testnet",
): Promise<{ balance: string; rawWei: string }> {
  const result = await callXLayerRpc<string>("eth_getBalance", [address, "latest"], environment)
  return {
    balance: formatWei(result, 18),
    rawWei: result,
  }
}

/**
 * Read transaction count (nonce) for an address
 */
export async function getXLayerTransactionCount(
  address: string,
  environment: Environment = "testnet",
): Promise<number> {
  const result = await callXLayerRpc<string>("eth_getTransactionCount", [address, "latest"], environment)
  return Number.parseInt(result, 16)
}

/**
 * Check if an address is a deployed smart contract
 */
export async function isXLayerContract(
  address: string,
  environment: Environment = "testnet",
): Promise<boolean> {
  const result = await callXLayerRpc<string>("eth_getCode", [address, "latest"], environment)
  return result !== "0x" && result !== "0x0" && result.length > 2
}

/**
 * Get current block height on X Layer
 */
export async function getXLayerBlockNumber(
  environment: Environment = "testnet",
): Promise<number> {
  const result = await callXLayerRpc<string>("eth_blockNumber", [], environment)
  return Number.parseInt(result, 16)
}

/**
 * Get current gas price in Gwei on X Layer
 */
export async function getXLayerGasPriceGwei(
  environment: Environment = "testnet",
): Promise<string> {
  try {
    const result = await callXLayerRpc<string>("eth_gasPrice", [], environment)
    const wei = BigInt(result)
    const gweiDecimal = Number(wei) / 1e9
    return gweiDecimal < 0.01 ? "<0.01" : gweiDecimal.toFixed(3)
  } catch {
    return "0.02"
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
): Promise<{ balance: string; rawHex: string }> {
  try {
    // balanceOf(address) function selector: 0x70a08231 + 32-byte zero-padded address
    const cleanAddress = userAddress.toLowerCase().replace(/^0x/, "").padStart(64, "0")
    const callData = `0x70a08231${cleanAddress}`

    const result = await callXLayerRpc<string>(
      "eth_call",
      [{ to: tokenAddress, data: callData }, "latest"],
      environment,
    )

    if (!result || result === "0x") return { balance: "0", rawHex: "0x0" }
    return {
      balance: formatWei(result, decimals),
      rawHex: result,
    }
  } catch {
    return { balance: "0", rawHex: "0x0" }
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
  transactionCount: number
  isContract: boolean
  blockNumber: number
  gasPriceGwei: string
  observedAt: string
}> {
  const config = XLAYER_NETWORKS[environment]

  const [balanceRes, txCount, isContract, blockNumber, gasPrice] = await Promise.all([
    getXLayerNativeBalance(address, environment).catch(() => ({ balance: "0", rawWei: "0x0" })),
    getXLayerTransactionCount(address, environment).catch(() => 0),
    isXLayerContract(address, environment).catch(() => false),
    getXLayerBlockNumber(environment).catch(() => 0),
    getXLayerGasPriceGwei(environment).catch(() => "0.02"),
  ])

  return {
    address,
    environment,
    chainId: config.chainId,
    nativeBalance: balanceRes.balance,
    nativeSymbol: "OKB",
    transactionCount: txCount,
    isContract,
    blockNumber,
    gasPriceGwei: gasPrice,
    observedAt: new Date().toISOString(),
  }
}

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
): Promise<{ allowance: string; rawHex: string; isUnlimited: boolean }> {
  try {
    const cleanOwner = ownerAddress.toLowerCase().replace(/^0x/, "").padStart(64, "0")
    const cleanSpender = spenderAddress.toLowerCase().replace(/^0x/, "").padStart(64, "0")
    const callData = `0xdd62ed3e${cleanOwner}${cleanSpender}`

    const result = await callXLayerRpc<string>(
      "eth_call",
      [{ to: tokenAddress, data: callData }, "latest"],
      environment,
    )

    if (!result || result === "0x" || result === "0x0") {
      return { allowance: "0", rawHex: "0x0", isUnlimited: false }
    }

    const rawBigInt = BigInt(result)
    // Unlimited allowance threshold (>= 2^128 - 1 or 2^256 - 1)
    const isUnlimited = rawBigInt >= (BigInt(2) ** BigInt(128) - BigInt(1))
    return {
      allowance: isUnlimited ? "Unlimited" : formatWei(result, decimals),
      rawHex: result,
      isUnlimited,
    }
  } catch {
    return { allowance: "0", rawHex: "0x0", isUnlimited: false }
  }
}

/**
 * Classify address as EOA or Contract via eth_getCode
 */
export async function getXLayerAccountType(
  address: string,
  environment: Environment = "testnet",
): Promise<"EOA" | "Contract"> {
  try {
    const code = await callXLayerRpc<string>("eth_getCode", [address, "latest"], environment)
    return code && code !== "0x" && code !== "0x0" && code.length > 2 ? "Contract" : "EOA"
  } catch {
    return "EOA"
  }
}

/**
 * Discover onchain Approval(owner, spender, value) events for candidate tokens
 */
export async function getXLayerApprovalLogs(
  ownerAddress: string,
  tokenAddresses: string[],
  environment: Environment = "testnet",
): Promise<Array<{ tokenAddress: string; spenderAddress: string; blockNumber: number }>> {
  try {
    const cleanOwner = "0x" + ownerAddress.toLowerCase().replace(/^0x/, "").padStart(64, "0")
    const approvalTopic = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925"

    const currentBlock = await getXLayerBlockNumber(environment).catch(() => 0)
    const fromBlock = currentBlock > 50000 ? `0x${(currentBlock - 50000).toString(16)}` : "0x0"

    const logs = await callXLayerRpc<Array<{ address: string; topics: string[]; blockNumber: string }>>(
      "eth_getLogs",
      [
        {
          fromBlock,
          toBlock: "latest",
          address: tokenAddresses.length === 1 ? tokenAddresses[0] : tokenAddresses,
          topics: [approvalTopic, cleanOwner],
        },
      ],
      environment,
    )

    if (!Array.isArray(logs)) return []

    const pairs: Array<{ tokenAddress: string; spenderAddress: string; blockNumber: number }> = []
    for (const log of logs) {
      if (log.topics && log.topics.length >= 3) {
        const spenderRaw = log.topics[2]
        const spenderAddress = "0x" + spenderRaw.slice(26)
        pairs.push({
          tokenAddress: log.address.toLowerCase(),
          spenderAddress: spenderAddress.toLowerCase(),
          blockNumber: Number.parseInt(log.blockNumber || "0", 16),
        })
      }
    }
    return pairs
  } catch {
    return []
  }
}
