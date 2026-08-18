import type { FunctionTool } from "openai/resources/responses/responses"
import { formatUnits, parseUnits } from "viem"
import { z } from "zod"

import type { AgentSource, AgentToolTrace } from "@/lib/agent-types"
import { formatApy, getProtocolUrl } from "@/lib/action-plan"
import { hasDatabaseConfiguration } from "@/lib/db/client"
import { searchKnowledgeRepository } from "@/lib/db/repository"
import {
  searchXLayerKnowledge,
  type KnowledgeCategory,
  xLayerSources,
} from "@/lib/knowledge/xlayer"
import { OkxConfigurationError, okxRequest } from "@/lib/okx/client"
import { getXLayerToken } from "@/lib/okx/xlayer-tokens"
import { findKnownContract } from "@/config/contracts"
import { XLAYER_TESTNET_TOKENS, XLAYER_MAINNET_TOKENS, findToken } from "@/config/tokens"
import {
  callXLayerRpc,
  getXLayerAccountSnapshot,
  getXLayerAccountType,
  getXLayerApprovalLogs,
  getXLayerBlockNumber,
  getXLayerGasPriceGwei,
  getXLayerTokenAllowance,
  getXLayerTokenBalance,
} from "@/lib/xlayer/rpc"

export type AgentToolResult = {
  ok: boolean
  data: unknown
  sources: AgentSource[]
  trace: AgentToolTrace
}

const knowledgeCategories = [
  "network",
  "architecture",
  "trade",
  "market",
  "defi",
  "bridge",
  "security",
  "oracle",
  "infrastructure",
  "payments",
  "wallet",
] as const satisfies readonly KnowledgeCategory[]

const SearchKnowledgeSchema = z.object({
  query: z.string().min(1).max(300),
  category: z.enum(knowledgeCategories).nullish().transform((value) => value ?? undefined),
  limit: z.number().int().min(1).max(8).default(5),
})

const NetworkSnapshotSchema = z.object({
  network: z.enum(["mainnet", "testnet"]).default("testnet"),
})

const MarketSnapshotSchema = z.object({
  tokenSymbol: z.string().min(2).max(16),
})

const SwapQuoteSchema = z.object({
  fromToken: z.string().min(2).max(16),
  toToken: z.string().min(2).max(16),
  amount: z.string().regex(/^\d+(?:\.\d+)?$/),
  maxSlippage: z.number().min(0.01).max(10).default(0.5),
})

const EarnDiscoverySchema = z.object({
  asset: z.string().min(2).max(16),
  productGroup: z.enum(["ALL", "SINGLE_EARN", "DEX_POOL", "LENDING"]).nullish().default("ALL"),
})

const AddressSnapshotSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  network: z.enum(["mainnet", "testnet", "all"]).default("testnet"),
})

const TransactionSnapshotSchema = z.object({
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  network: z.enum(["mainnet", "testnet"]).default("testnet"),
})

const TokenRiskSchema = z.object({
  tokenSymbol: z.string().min(2).max(16),
})

export const xLayerToolDefinitions: FunctionTool[] = [
  {
    type: "function",
    name: "search_xlayer_knowledge",
    description:
      "Search the curated, source-tagged X Layer registry for network, architecture, ecosystem, protocol, bridge, oracle, security, trade, market, or DeFi facts. Use this before answering factual X Layer questions.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        query: { type: "string" },
        category: { type: ["string", "null"], enum: [...knowledgeCategories, null] },
        limit: { type: "number", minimum: 1, maximum: 8 },
      },
      required: ["query", "category", "limit"],
    },
  },
  {
    type: "function",
    name: "get_xlayer_network_snapshot",
    description:
      "Read real-time live block number and gas price directly from official X Layer RPC on Testnet (Chain ID 1952) or Mainnet (Chain ID 196).",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        network: { type: "string", enum: ["mainnet", "testnet"] },
      },
      required: ["network"],
    },
  },
  {
    type: "function",
    name: "get_xlayer_market_snapshot",
    description:
      "Fetch live price, liquidity, market cap, and holder data for a verified X Layer token through the OKX Market API.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        tokenSymbol: { type: "string" },
      },
      required: ["tokenSymbol"],
    },
  },
  {
    type: "function",
    name: "get_xlayer_swap_quote",
    description:
      "Fetch a read-only swap quote through the OKX DEX aggregator on X Layer Mainnet. Do not use for Testnet (Chain ID 1952); on Testnet, swap execution plans are constructed directly.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        fromToken: { type: "string" },
        toToken: { type: "string" },
        amount: { type: "string" },
        maxSlippage: { type: "number", minimum: 0.01, maximum: 10 },
      },
      required: ["fromToken", "toToken", "amount", "maxSlippage"],
    },
  },
  {
    type: "function",
    name: "discover_xlayer_earn",
    description:
      "Search current live OKX DeFi investment products on X Layer Mainnet by asset (e.g. USDT, OKB, USDC, ETH). Automatically searches across all single-earn and DEX liquidity pools on X Layer. Call once per turn.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        asset: { type: "string" },
        productGroup: { type: ["string", "null"], enum: ["ALL", "SINGLE_EARN", "DEX_POOL", "LENDING", null] },
      },
      required: ["asset", "productGroup"],
    },
  },
  {
    type: "function",
    name: "inspect_xlayer_address",
    description:
      "Read real-time onchain address data on X Layer Testnet (Chain ID 1952) or Mainnet (Chain ID 196), including native OKB balance, transaction count (nonce), smart contract status, and ERC-20 token balances.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        address: { type: "string" },
        network: { type: "string", enum: ["mainnet", "testnet", "all"] },
      },
      required: ["address", "network"],
    },
  },
  {
    type: "function",
    name: "inspect_xlayer_transaction",
    description:
      "Read real-time onchain transaction receipt and execution details on X Layer Testnet (Chain ID 1952) or Mainnet (Chain ID 196) by transaction hash.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        transactionHash: { type: "string" },
        network: { type: "string", enum: ["mainnet", "testnet"] },
      },
      required: ["transactionHash", "network"],
    },
  },
  {
    type: "function",
    name: "inspect_xlayer_token_risk",
    description:
      "Read current OKX advanced token metadata and risk-control fields for a verified X Layer token.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: { tokenSymbol: { type: "string" } },
      required: ["tokenSymbol"],
    },
  },
  {
    type: "function",
    name: "inspect_xlayer_allowances",
    description:
      "Scan an address for active and unlimited ERC-20 token approvals and spender allowances on X Layer Testnet (Chain ID 1952) or Mainnet (Chain ID 196).",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        address: { type: "string" },
        network: { type: "string", enum: ["mainnet", "testnet"] },
      },
      required: ["address", "network"],
    },
  },
]

function uniqueSources(sources: AgentSource[]) {
  return [...new Map(sources.map((source) => [source.id, source])).values()]
}

function unavailable(name: string, label: string, message: string, sources: AgentSource[]): AgentToolResult {
  return {
    ok: false,
    data: { available: false, reason: message },
    sources,
    trace: { name, label, status: "unavailable", summary: message },
  }
}

async function searchKnowledge(argumentsValue: unknown): Promise<AgentToolResult> {
  const input = SearchKnowledgeSchema.parse(argumentsValue)
  let records = searchXLayerKnowledge(input.query, input)
  let repository = "bundled"

  if (hasDatabaseConfiguration()) {
    try {
      const persisted = await searchKnowledgeRepository(input.query, input)
      if (persisted.length) {
        records = persisted
        repository = "supabase"
      }
    } catch {
      records = searchXLayerKnowledge(input.query, input)
    }
  }

  const sources = uniqueSources(records.map((record) => record.source))

  return {
    ok: true,
    data: {
      query: input.query,
      category: input.category ?? "all",
      repository,
      count: records.length,
      matches: records.map((record) => ({
        id: record.id,
        title: record.title,
        category: record.category,
        summary: record.summary,
        facts: record.facts,
        source: record.source,
      })),
    },
    sources,
    trace: {
      name: "search_xlayer_knowledge",
      label: "X Layer knowledge base",
      status: "complete",
      summary: `${records.length} verified X Layer record${records.length === 1 ? "" : "s"} matched (${repository})`,
    },
  }
}

async function getNetworkSnapshot(argumentsValue: unknown): Promise<AgentToolResult> {
  const { network } = NetworkSnapshotSchema.parse(argumentsValue)
  const isTestnet = network === "testnet"
  const chainId = isTestnet ? 1952 : 196

  try {
    const [blockRes, gasRes] = await Promise.all([
      getXLayerBlockNumber(network),
      getXLayerGasPriceGwei(network),
    ])

    const blockNumber = blockRes.success && blockRes.blockNumber !== undefined ? blockRes.blockNumber : "Unavailable"
    const gasPriceGwei = gasRes.success ? gasRes.gasPriceGwei : "Unavailable"

    return {
      ok: true,
      data: {
        network: isTestnet ? "X Layer Testnet" : "X Layer Mainnet",
        chainId,
        blockNumber,
        gasPriceGwei,
        observedAt: new Date().toISOString(),
      },
      sources: [xLayerSources.network],
      trace: {
        name: "get_xlayer_network_snapshot",
        label: `Live ${isTestnet ? "Testnet" : "Mainnet"} RPC`,
        status: "complete",
        summary: `${network} block ${blockNumber} (gas ~${gasPriceGwei} Gwei)`,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "RPC request failed"
    return unavailable(
      "get_xlayer_network_snapshot",
      "Live X Layer RPC",
      `Live RPC unavailable: ${message}`,
      [xLayerSources.network],
    )
  }
}

async function getMarketSnapshot(argumentsValue: unknown): Promise<AgentToolResult> {
  const { tokenSymbol } = MarketSnapshotSchema.parse(argumentsValue)
  const token = getXLayerToken(tokenSymbol)
  if (!token) {
    return unavailable(
      "get_xlayer_market_snapshot",
      "OKX market data",
      `${tokenSymbol.toUpperCase()} is not in the verified X Layer token registry yet`,
      [xLayerSources.market],
    )
  }

  try {
    const data = await okxRequest<Array<Record<string, unknown>>>({
      path: "/api/v6/dex/market/price-info",
      method: "POST",
      body: [{ chainIndex: "196", tokenContractAddress: token.address.toLowerCase() }],
    })
    const snapshot = data[0]

    return {
      ok: true,
      data: {
        symbol: token.symbol,
        chainIndex: "196",
        tokenContractAddress: token.address,
        priceUsd: snapshot?.price,
        liquidityUsd: snapshot?.liquidity,
        marketCapUsd: snapshot?.marketCap,
        holders: snapshot?.holders,
        observedAt: snapshot?.time,
      },
      sources: [xLayerSources.market],
      trace: {
        name: "get_xlayer_market_snapshot",
        label: "OKX market data",
        status: "complete",
        summary: `Live ${token.symbol} market snapshot received`,
      },
    }
  } catch (error) {
    const message = error instanceof OkxConfigurationError
      ? "OKX API credentials are not configured"
      : error instanceof Error
        ? error.message
        : "Market request failed"
    return unavailable(
      "get_xlayer_market_snapshot",
      "OKX market data",
      message,
      [xLayerSources.market],
    )
  }
}

function dexNames(value: unknown) {
  if (!Array.isArray(value)) return []
  const names = value.flatMap((router) => {
    if (!router || typeof router !== "object" || !("subRouterList" in router)) return []
    const subRouters: unknown[] = Array.isArray(router.subRouterList) ? router.subRouterList : []
    return subRouters.flatMap((subRouter: unknown) => {
      if (!subRouter || typeof subRouter !== "object" || !("dexProtocol" in subRouter)) return []
      const protocols: unknown[] = Array.isArray(subRouter.dexProtocol) ? subRouter.dexProtocol : []
      return protocols.flatMap((protocol: unknown) => {
        if (!protocol || typeof protocol !== "object" || !("dexName" in protocol)) return []
        return typeof protocol.dexName === "string" ? [protocol.dexName] : []
      })
    })
  })
  return [...new Set(names)]
}

async function getSwapQuote(argumentsValue: unknown): Promise<AgentToolResult> {
  const input = SwapQuoteSchema.parse(argumentsValue)
  const fromToken = getXLayerToken(input.fromToken)
  const toToken = getXLayerToken(input.toToken)

  if (!fromToken || !toToken) {
    const missing = [!fromToken ? input.fromToken : null, !toToken ? input.toToken : null]
      .filter(Boolean)
      .join(", ")
    return unavailable(
      "get_xlayer_swap_quote",
      "OKX DEX quote",
      `Unsupported swap asset: ${missing}`,
      [xLayerSources.trade],
    )
  }

  try {
    const data = await okxRequest<Array<Record<string, unknown>>>({
      path: "/api/v6/dex/aggregator/quote",
      method: "GET",
      query: {
        chainIndex: "196",
        amount: parseUnits(input.amount, fromToken.decimals).toString(),
        slippage: (input.maxSlippage / 100).toString(),
        fromTokenAddress: fromToken.address,
        toTokenAddress: toToken.address,
      },
    })
    const quote = data[0]
    const outputAmount = typeof quote?.toTokenAmount === "string"
      ? formatUnits(BigInt(quote.toTokenAmount), toToken.decimals)
      : null

    return {
      ok: true,
      data: {
        network: "X Layer mainnet",
        chainIndex: "196",
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        inputAmount: input.amount,
        outputAmount,
        maxSlippage: input.maxSlippage,
        priceImpactPercentage: quote?.priceImpactPercentage,
        estimatedGasUnits: quote?.estimateGasFee,
        estimatedNetworkFeeUsd: quote?.tradeFee,
        liquiditySources: dexNames(quote?.dexRouterList),
        fromTokenRisk: quote?.fromToken,
        toTokenRisk: quote?.toToken,
        quotedAt: new Date().toISOString(),
        readOnly: true,
      },
      sources: [xLayerSources.trade],
      trace: {
        name: "get_xlayer_swap_quote",
        label: "OKX DEX quote",
        status: "complete",
        summary: `Live ${fromToken.symbol} to ${toToken.symbol} quote received`,
      },
    }
  } catch (error) {
    const message = error instanceof OkxConfigurationError
      ? "OKX API credentials are not configured"
      : error instanceof Error
        ? error.message
        : "Quote request failed"

    return unavailable(
      "get_xlayer_swap_quote",
      "OKX DEX quote",
      `Live DEX quote unavailable: ${message}`,
      [xLayerSources.trade],
    )
  }
}

const VERIFIED_XLAYER_DEX_POOLS: Record<
  string,
  Array<{
    name: string
    protocol: string
    apy: string
    tvlUsd?: string
    productGroup: string
    chainIndex: string
    url: string
  }>
> = {
  USDT: [
    {
      name: "USDT / USDC (0.01%)",
      protocol: "Uniswap V3",
      apy: "Variable (Live telemetry unavailable)",
      productGroup: "DEX_POOL",
      chainIndex: "196",
      url: "https://app.uniswap.org/explore/pools/xlayer/0xeeeb3c1f61dc3070c675c2670a3f2188a060012d",
    },
    {
      name: "USDT / OKB (0.05%)",
      protocol: "Uniswap V3",
      apy: "Variable (Live telemetry unavailable)",
      productGroup: "DEX_POOL",
      chainIndex: "196",
      url: "https://app.uniswap.org/explore/pools/xlayer/0xe3be6a0137f1b0602fc1a4841686f43b340a5082",
    },
    {
      name: "USDT / xETH (0.05%)",
      protocol: "Uniswap V3",
      apy: "Variable (Live telemetry unavailable)",
      productGroup: "DEX_POOL",
      chainIndex: "196",
      url: "https://app.uniswap.org/explore/pools/xlayer/0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
    },
  ],
  USDT0: [
    {
      name: "USD₮0 / USDC (0.01%)",
      protocol: "Uniswap V3",
      apy: "Variable (Live telemetry unavailable)",
      productGroup: "DEX_POOL",
      chainIndex: "196",
      url: "https://app.uniswap.org/explore/pools/xlayer/0xeeeb3c1f61dc3070c675c2670a3f2188a060012d",
    },
    {
      name: "USD₮0 / OKB (0.05%)",
      protocol: "Uniswap V3",
      apy: "Variable (Live telemetry unavailable)",
      productGroup: "DEX_POOL",
      chainIndex: "196",
      url: "https://app.uniswap.org/explore/pools/xlayer/0xe3be6a0137f1b0602fc1a4841686f43b340a5082",
    },
  ],
  USDC: [
    {
      name: "USDC / USDT (0.01%)",
      protocol: "Uniswap V3",
      apy: "Variable (Live telemetry unavailable)",
      productGroup: "DEX_POOL",
      chainIndex: "196",
      url: "https://app.uniswap.org/explore/pools/xlayer/0xeeeb3c1f61dc3070c675c2670a3f2188a060012d",
    },
    {
      name: "USDC / xETH (0.05%)",
      protocol: "Uniswap V3",
      apy: "Variable (Live telemetry unavailable)",
      productGroup: "DEX_POOL",
      chainIndex: "196",
      url: "https://app.uniswap.org/explore/pools/xlayer/0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
    },
    {
      name: "USDC / OKB (0.3%)",
      protocol: "Uniswap V3",
      apy: "Variable (Live telemetry unavailable)",
      productGroup: "DEX_POOL",
      chainIndex: "196",
      url: "https://app.uniswap.org/explore/pools/xlayer/0x63d62734847e55a266fca4219a9ad0a02d5f6e02",
    },
  ],
  OKB: [
    {
      name: "OKB / USDT (0.05%)",
      protocol: "Uniswap V3",
      apy: "Variable (Live telemetry unavailable)",
      productGroup: "DEX_POOL",
      chainIndex: "196",
      url: "https://app.uniswap.org/explore/pools/xlayer/0xe3be6a0137f1b0602fc1a4841686f43b340a5082",
    },
    {
      name: "OKB / xETH (0.05%)",
      protocol: "Uniswap V3",
      apy: "Variable (Live telemetry unavailable)",
      productGroup: "DEX_POOL",
      chainIndex: "196",
      url: "https://app.uniswap.org/explore/pools/xlayer/0xc1382e9eb8f3df11d348d1dcca34e246690122a2",
    },
  ],
  XETH: [
    {
      name: "xETH / USDT (0.05%)",
      protocol: "Uniswap V3",
      apy: "Variable (Live telemetry unavailable)",
      productGroup: "DEX_POOL",
      chainIndex: "196",
      url: "https://app.uniswap.org/explore/pools/xlayer/0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
    },
    {
      name: "xETH / OKB (0.05%)",
      protocol: "Uniswap V3",
      apy: "Variable (Live telemetry unavailable)",
      productGroup: "DEX_POOL",
      chainIndex: "196",
      url: "https://app.uniswap.org/explore/pools/xlayer/0xc1382e9eb8f3df11d348d1dcca34e246690122a2",
    },
  ],
  WETH: [
    {
      name: "xETH / USDT (0.05%)",
      protocol: "Uniswap V3",
      apy: "Variable (Live telemetry unavailable)",
      productGroup: "DEX_POOL",
      chainIndex: "196",
      url: "https://app.uniswap.org/explore/pools/xlayer/0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
    },
    {
      name: "xETH / OKB (0.05%)",
      protocol: "Uniswap V3",
      apy: "Variable (Live telemetry unavailable)",
      productGroup: "DEX_POOL",
      chainIndex: "196",
      url: "https://app.uniswap.org/explore/pools/xlayer/0xc1382e9eb8f3df11d348d1dcca34e246690122a2",
    },
  ],
  WBTC: [
    {
      name: "xBTC / USDT (0.05%)",
      protocol: "Uniswap V3",
      apy: "Variable (Live telemetry unavailable)",
      productGroup: "DEX_POOL",
      chainIndex: "196",
      url: "https://app.uniswap.org/explore/pools/xlayer/0x5fcfb33c9ab1665fee892eb2af163e863a874d73",
    },
  ],
}

async function discoverEarn(argumentsValue: unknown): Promise<AgentToolResult> {
  const input = EarnDiscoverySchema.parse(argumentsValue)
  const rawAsset = input.asset.trim().toUpperCase()
  const canonicalToken = findToken(rawAsset, 196)
  const searchKeywords = canonicalToken ? Array.from(new Set([canonicalToken.symbol, rawAsset])) : [rawAsset]

  try {
    const requestBody: Record<string, unknown> = {
      tokenKeywordList: searchKeywords,
      chainIndex: "196",
      pageNum: 1,
    }

    if (input.productGroup && input.productGroup !== "ALL") {
      requestBody.productGroup = input.productGroup
    }

    let data = await okxRequest<{ total?: number; list?: Array<Record<string, unknown>> }>({
      path: "/api/v6/defi/product/search",
      method: "POST",
      body: requestBody,
    })

    // If specific productGroup filter returned 0, automatically query across all pool types
    if ((!data.list || data.list.length === 0) && input.productGroup && input.productGroup !== "ALL") {
      data = await okxRequest<{ total?: number; list?: Array<Record<string, unknown>> }>({
        path: "/api/v6/defi/product/search",
        method: "POST",
        body: {
          tokenKeywordList: searchKeywords,
          chainIndex: "196",
          pageNum: 1,
        },
      })
    }

    const fetchedOpportunities = (data.list ?? []).map((item) => {
      const protocol = String(item.platformName || "OKX DeFi")
      const name = String(item.name || protocol || "Pool")
      const rawRate = String(item.rate || "Variable")
      const url = String(item.link || item.dappUrl || getProtocolUrl(protocol, name, rawAsset, String(item.investmentId || "")))
      return {
        investmentId: item.investmentId ? String(item.investmentId) : undefined,
        name,
        protocol,
        apy: formatApy(rawRate),
        tvlUsd: item.tvl ? String(item.tvl) : undefined,
        productGroup: item.productGroup ? String(item.productGroup) : undefined,
        chainIndex: item.chainIndex ? String(item.chainIndex) : "196",
        url,
      }
    })

    const dexPools = VERIFIED_XLAYER_DEX_POOLS[rawAsset] ?? []
    const combinedOpps: Array<{
      investmentId?: string
      name: string
      protocol: string
      apy: string
      tvlUsd?: string
      productGroup?: string
      chainIndex?: string
      url: string
    }> = [...fetchedOpportunities]
    for (const dexPool of dexPools) {
      if (!combinedOpps.some((o) => o.name.toLowerCase().includes(dexPool.name.toLowerCase()))) {
        combinedOpps.push(dexPool)
      }
    }

    const opportunities = combinedOpps.slice(0, 8)

    return {
      ok: true,
      data: {
        asset: rawAsset,
        network: "X Layer mainnet",
        chainIndex: "196",
        total: opportunities.length,
        opportunities,
        variableRates: true,
        observedAt: new Date().toISOString(),
      },
      sources: [xLayerSources.defi],
      trace: {
        name: "discover_xlayer_earn",
        label: "OKX DeFi discovery",
        status: "complete",
        summary: `${opportunities.length} current X Layer opportunit${opportunities.length === 1 ? "y" : "ies"} found`,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "DeFi discovery failed"
    return unavailable("discover_xlayer_earn", "OKX DeFi discovery", message, [xLayerSources.defi])
  }
}

async function inspectAddress(argumentsValue: unknown): Promise<AgentToolResult> {
  const input = AddressSnapshotSchema.parse(argumentsValue)
  const targetNetwork = input.network ?? "testnet"

  try {
    if (targetNetwork === "testnet" || targetNetwork === "all") {
      const snapshot = await getXLayerAccountSnapshot(input.address, "testnet")

      const [usdtBal, usdcBal, usdgBal] = await Promise.all([
        getXLayerTokenBalance("0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c", input.address, 6, "testnet"),
        getXLayerTokenBalance("0xcb8bf24c6ce16ad21d707c9505421a17f2bec79d", input.address, 6, "testnet"),
        getXLayerTokenBalance("0xa78e2baabaf5c4f36b7fc394725deb68d332eec1", input.address, 6, "testnet"),
      ])

      const testnetData = {
        network: "X Layer Testnet",
        chainId: 1952,
        address: input.address,
        nativeBalance: snapshot.nativeBalance,
        nativeSymbol: "OKB",
        transactionCount: snapshot.transactionCount,
        isContract: snapshot.isContract,
        blockNumber: snapshot.blockNumber,
        gasPriceGwei: snapshot.gasPriceGwei,
        tokens: [
          { symbol: "USDT (USD₮0)", balance: usdtBal.success ? `${usdtBal.balance} USDT` : "Unavailable", isTestAsset: true },
          { symbol: "USDC (USDC_TEST)", balance: usdcBal.success ? `${usdcBal.balance} USDC` : "Unavailable", isTestAsset: true },
          { symbol: "USDG", balance: usdgBal.success ? `${usdgBal.balance} USDG` : "Unavailable", isTestAsset: true },
        ],
        faucetUrl: "https://web3.okx.com/xlayer/faucet/xlayerfaucet",
        explorerUrl: `https://www.okx.com/web3/explorer/xlayer-test/address/${input.address}`,
        observedAt: snapshot.observedAt,
      }

      if (targetNetwork === "testnet") {
        return {
          ok: true,
          data: testnetData,
          sources: [xLayerSources.network, xLayerSources.data],
          trace: {
            name: "inspect_xlayer_address",
            label: "X Layer Testnet live address data",
            status: "complete",
            summary: `Testnet address data received for ${input.address.slice(0, 8)}...${input.address.slice(-6)} (${snapshot.nativeBalance} OKB, txs: ${snapshot.transactionCount})`,
          },
        }
      }
    }

    // Mainnet inspection (via API or RPC)
    let mainnetSnapshot: Record<string, unknown> = {}
    try {
      const data = await okxRequest<Array<Record<string, unknown>>>({
        path: "/api/v5/xlayer/address/information-evm",
        method: "GET",
        query: { chainShortName: "xlayer", address: input.address },
      })
      mainnetSnapshot = data[0] ?? {}
    } catch {
      const rpcSnap = await getXLayerAccountSnapshot(input.address, "mainnet")
      mainnetSnapshot = {
        balance: rpcSnap.nativeBalance,
        balanceSymbol: "OKB",
        transactionCount: rpcSnap.transactionCount,
        contractAddress: rpcSnap.isContract,
      }
    }

    const mainnetData = {
      network: "X Layer Mainnet",
      chainId: 196,
      address: input.address,
      nativeBalance: (mainnetSnapshot.balance as string) ?? "Unavailable",
      nativeSymbol: (mainnetSnapshot.balanceSymbol as string) ?? "OKB",
      transactionCount: mainnetSnapshot.transactionCount !== undefined ? mainnetSnapshot.transactionCount : "Unavailable",
      isContract: mainnetSnapshot.contractAddress !== undefined ? (typeof mainnetSnapshot.contractAddress === "boolean" ? mainnetSnapshot.contractAddress : Boolean(mainnetSnapshot.contractAddress)) : "Unknown",
      contractCalls30d: mainnetSnapshot.contractCalls,
      callingAddresses30d: mainnetSnapshot.contractCallingAddresses,
      firstTransactionTime: mainnetSnapshot.firstTransactionTime,
      lastTransactionTime: mainnetSnapshot.lastTransactionTime,
      explorerUrl: `https://www.okx.com/web3/explorer/xlayer/address/${input.address}`,
      observedAt: new Date().toISOString(),
    }

    return {
      ok: true,
      data: targetNetwork === "all" ? { mainnet: mainnetData } : mainnetData,
      sources: [xLayerSources.data],
      trace: {
        name: "inspect_xlayer_address",
        label: "X Layer address data",
        status: "complete",
        summary: `Address metadata received for ${input.address.slice(0, 8)}...${input.address.slice(-6)}`,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Address lookup failed"
    return unavailable("inspect_xlayer_address", "X Layer address data", message, [xLayerSources.data])
  }
}

async function inspectTransaction(argumentsValue: unknown): Promise<AgentToolResult> {
  const input = TransactionSnapshotSchema.parse(argumentsValue)
  const network = input.network ?? "testnet"

  try {
    if (network === "testnet") {
      const [tx, receipt] = await Promise.all([
        callXLayerRpc<Record<string, unknown> | null>("eth_getTransactionByHash", [input.transactionHash], "testnet").catch(() => null),
        callXLayerRpc<Record<string, unknown> | null>("eth_getTransactionReceipt", [input.transactionHash], "testnet").catch(() => null),
      ])

      if (!tx) {
        return unavailable("inspect_xlayer_transaction", "X Layer Testnet transaction", "Transaction hash not found in recent blocks", [xLayerSources.network])
      }

      const status = receipt?.status === "0x1" ? "success" : receipt?.status === "0x0" ? "reverted" : "pending"
      const blockNumber = tx.blockNumber ? Number.parseInt(String(tx.blockNumber), 16) : null
      const gasUsed = receipt?.gasUsed ? Number.parseInt(String(receipt.gasUsed), 16) : null

      return {
        ok: true,
        data: {
          network: "X Layer Testnet",
          chainId: 1952,
          transactionHash: input.transactionHash,
          status,
          from: tx.from,
          to: tx.to,
          valueWei: tx.value,
          blockNumber,
          gasUsed,
          explorerUrl: `https://www.okx.com/web3/explorer/xlayer-test/tx/${input.transactionHash}`,
          observedAt: new Date().toISOString(),
        },
        sources: [xLayerSources.network, xLayerSources.data],
        trace: {
          name: "inspect_xlayer_transaction",
          label: "X Layer Testnet transaction",
          status: "complete",
          summary: `Testnet transaction ${input.transactionHash.slice(0, 10)}... status: ${status}`,
        },
      }
    }

    const data = await okxRequest<Array<Record<string, unknown>>>({
      path: "/api/v5/xlayer/transaction/transaction-fills",
      method: "GET",
      query: { chainShortName: "xlayer", txid: input.transactionHash },
    })
    const transaction = data[0] ?? {}
    return {
      ok: true,
      data: {
        network: "X Layer Mainnet",
        chainId: 196,
        transactionHash: input.transactionHash,
        height: transaction.height,
        state: transaction.state,
        from: transaction.from,
        to: transaction.to,
        amount: transaction.amount,
        symbol: transaction.transactionSymbol,
        fee: transaction.txfee,
        methodId: transaction.methodId,
        tokenTransfers: transaction.tokenTransferDetails,
        contractCalls: transaction.contractDetails,
        explorerUrl: `https://www.okx.com/web3/explorer/xlayer/tx/${input.transactionHash}`,
        observedAt: new Date().toISOString(),
      },
      sources: [xLayerSources.data],
      trace: {
        name: "inspect_xlayer_transaction",
        label: "X Layer transaction data",
        status: "complete",
        summary: `Transaction data received for ${input.transactionHash.slice(0, 10)}...`,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transaction lookup failed"
    return unavailable("inspect_xlayer_transaction", "X Layer transaction data", message, [xLayerSources.data])
  }
}

async function inspectTokenRisk(argumentsValue: unknown): Promise<AgentToolResult> {
  const { tokenSymbol } = TokenRiskSchema.parse(argumentsValue)
  const token = getXLayerToken(tokenSymbol)
  if (!token) {
    return unavailable(
      "inspect_xlayer_token_risk",
      "OKX token risk data",
      `${tokenSymbol.toUpperCase()} is not in the verified X Layer token registry yet`,
      [xLayerSources.market],
    )
  }

  try {
    const data = await okxRequest<Array<Record<string, unknown>>>({
      path: "/api/v6/dex/market/token-risk",
      method: "POST",
      body: [{ chainIndex: "196", tokenContractAddress: token.address.toLowerCase() }],
    })
    const risk = data[0]

    return {
      ok: true,
      data: {
        symbol: token.symbol,
        chainIndex: "196",
        tokenContractAddress: token.address,
        riskLevel: risk?.riskLevel,
        isHoneypot: risk?.isHoneypot,
        buyTax: risk?.buyTax,
        sellTax: risk?.sellTax,
        cannotSellAll: risk?.cannotSellAll,
        mintable: risk?.mintable,
        ownerChangeable: risk?.ownerChangeable,
        observedAt: new Date().toISOString(),
      },
      sources: [xLayerSources.market],
      trace: {
        name: "inspect_xlayer_token_risk",
        label: "OKX token risk data",
        status: "complete",
        summary: `Live risk assessment received for ${token.symbol}`,
      },
    }
  } catch (error) {
    const message = error instanceof OkxConfigurationError
      ? "OKX API credentials are not configured"
      : error instanceof Error
        ? error.message
        : "Token risk request failed"
    return unavailable(
      "inspect_xlayer_token_risk",
      "OKX token risk data",
      message,
      [xLayerSources.market],
    )
  }
}

const InspectAllowancesSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  network: z.enum(["mainnet", "testnet"]).default("testnet"),
})

async function inspectAllowances(argumentsValue: unknown): Promise<AgentToolResult> {
  const input = InspectAllowancesSchema.parse(argumentsValue)
  const isTestnet = input.network === "testnet"
  const chainId = isTestnet ? 1952 : 196
  const tokens = isTestnet
    ? Object.values(XLAYER_TESTNET_TOKENS).filter((t) => t.address !== "native")
    : Object.values(XLAYER_MAINNET_TOKENS).filter((t) => t.address !== "native")

  const tokenAddresses = tokens.map((t) => t.address)
  const defaultSpenders = isTestnet
    ? [{ name: "Xecute Testnet Swap Router", address: "0x9be3af8223f49b9357941db269a39775f7802acb" }]
    : [
        { name: "Aave V3 Pool", address: "0xE3F3Caefdd7180F884c01E57f65Df979Af84f116" },
        { name: "Uniswap V3 SwapRouter02", address: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45" },
      ]

  try {
    // 1. Discover historical Approval events for this wallet onchain
    const logsResult = await getXLayerApprovalLogs(input.address, tokenAddresses, input.network)
    const discoveredEvents = logsResult.events

    // 2. Build candidate (token, spender) pairs combining discovered events + verified protocols
    const pairMap = new Map<string, { tokenAddress: string; spenderAddress: string; spenderName?: string; hasHistoricalEvent: boolean }>()

    for (const t of tokens) {
      for (const s of defaultSpenders) {
        const key = `${t.address.toLowerCase()}-${s.address.toLowerCase()}`
        pairMap.set(key, { tokenAddress: t.address, spenderAddress: s.address, spenderName: s.name, hasHistoricalEvent: false })
      }
    }

    for (const event of discoveredEvents) {
      const key = `${event.tokenAddress.toLowerCase()}-${event.spenderAddress.toLowerCase()}`
      const existing = pairMap.get(key)
      if (existing) {
        existing.hasHistoricalEvent = true
      } else {
        pairMap.set(key, { tokenAddress: event.tokenAddress, spenderAddress: event.spenderAddress, hasHistoricalEvent: true })
      }
    }

    const candidatePairs = Array.from(pairMap.values())

    // 3. Query current live allowance(owner, spender) for every candidate pair
    const blockRes = await getXLayerBlockNumber(input.network)
    const currentBlock = blockRes.success && blockRes.blockNumber !== undefined ? blockRes.blockNumber : 0

    if (currentBlock === 0) {
      return {
        ok: true,
        data: {
          address: input.address,
          network: isTestnet ? "X Layer Testnet" : "X Layer Mainnet",
          chainId,
          blockNumber: 0,
          startBlock: 0,
          endBlock: 0,
          scannedBlockCount: 0,
          scanStatus: "failed",
          hasFindings: false,
          activeApprovalCount: 0,
          unlimitedApprovalCount: 0,
          highAttentionCount: 0,
          unknownRelationshipCount: candidatePairs.length,
          inactiveRelationshipCount: 0,
          scannedCount: candidatePairs.length,
          scannedAssets: tokens.map((t) => t.symbol),
          eventsDiscoveredCount: 0,
          scanScope: `Approval scan failed: unable to query current block height on ${isTestnet ? "X Layer Testnet" : "X Layer Mainnet"}.`,
          allowances: [],
          activeAllowances: [],
          inactiveAllowances: [],
          findings: [],
          inactiveFindings: [],
          scannedAt: new Date().toISOString(),
          provenance: {
            chainId,
            source: "contract_read",
            blockNumber: 0,
            verified: false,
          },
        },
        sources: [xLayerSources.security],
        trace: {
          name: "inspect_xlayer_allowances",
          label: "ERC-20 approval scan",
          status: "error",
          summary: "Failed to read block height",
        },
      }
    }

    const evaluatedAllowances = await Promise.all(
      candidatePairs.map(async (pair) => {
        const tokenCfg = tokens.find((t) => t.address.toLowerCase() === pair.tokenAddress.toLowerCase()) || {
          symbol: "TOKEN",
          address: pair.tokenAddress,
          decimals: 18,
        }

        const res = await getXLayerTokenAllowance(
          pair.tokenAddress,
          input.address,
          pair.spenderAddress,
          tokenCfg.decimals,
          input.network,
        )

        // Spender identity resolution
        const knownContract = findKnownContract(pair.spenderAddress, chainId)

        if (!res.success) {
          return {
            token: tokenCfg.symbol,
            tokenAddress: pair.tokenAddress,
            spenderName: pair.spenderName || knownContract?.name || "Unknown Spender",
            spenderAddress: pair.spenderAddress,
            spenderType: "Unknown" as const,
            allowance: "Unknown",
            isUnlimited: false,
            hasAllowance: false,
            status: "unknown" as const,
            riskLevel: "Attention" as const,
            riskDetail: "Could not query current onchain allowance via RPC.",
            hasHistoricalEvent: pair.hasHistoricalEvent,
            source: "contract_read" as const,
            blockNumber: currentBlock,
          }
        }

        const isUnlim = res.isUnlimited
        const hasAllowance = isUnlim || (res.rawBigInt !== undefined && res.rawBigInt > BigInt(0))
        const status: "unlimited" | "active" | "inactive" = isUnlim ? "unlimited" : hasAllowance ? "active" : "inactive"

        const accountType = await getXLayerAccountType(pair.spenderAddress, input.network)
        const spenderName = pair.spenderName || knownContract?.name || (accountType === "EOA" ? "External EOA" : accountType === "Contract" ? "Contract Spender" : "Unknown Spender")

        let riskLevel: "High" | "Attention" | "Informational" = "Informational"
        let riskDetail = "No active permission (current onchain allowance is zero)."

        if (isUnlim) {
          if (accountType === "EOA") {
            riskLevel = "High"
            riskDetail = "Unlimited allowance to an Externally Owned Account (EOA)."
          } else if (!knownContract?.verified) {
            riskLevel = "High"
            riskDetail = "Unlimited allowance to an unverified/unknown smart contract."
          } else {
            riskLevel = "Attention"
            riskDetail = `Unlimited allowance to recognized protocol (${knownContract.name}).`
          }
        } else if (hasAllowance) {
          if (knownContract?.verified) {
            riskLevel = "Informational"
            riskDetail = `Bounded allowance to recognized protocol (${knownContract.name}).`
          } else {
            riskLevel = "Attention"
            riskDetail = `Bounded active allowance (${res.allowance} ${tokenCfg.symbol}) to an unverified spender.`
          }
        }

        return {
          token: tokenCfg.symbol,
          tokenAddress: pair.tokenAddress,
          spenderName,
          spenderAddress: pair.spenderAddress,
          spenderType: accountType,
          allowance: res.allowance,
          isUnlimited: isUnlim,
          hasAllowance,
          status,
          riskLevel,
          riskDetail,
          hasHistoricalEvent: pair.hasHistoricalEvent,
          source: "contract_read" as const,
          blockNumber: currentBlock,
        }
      }),
    )

    const activeAllowances = evaluatedAllowances.filter((c) => c.status === "active" || c.status === "unlimited")
    const unknownAllowances = evaluatedAllowances.filter((c) => c.status === "unknown")
    const inactiveAllowances = evaluatedAllowances.filter((c) => c.status === "inactive")
    const unlimitedApprovalCount = activeAllowances.filter((c) => c.status === "unlimited").length
    const highRiskCount = activeAllowances.filter((c) => c.riskLevel === "High").length
    const scannedAssetSymbols = tokens.map((t) => t.symbol).join(", ")

    const startBlock = logsResult.startBlock || (currentBlock > 50000 ? currentBlock - 50000 : 0)
    const endBlock = logsResult.endBlock || currentBlock
    const scannedBlockCount = endBlock >= startBlock ? endBlock - startBlock + 1 : 0

    let scanStatus: "complete" | "partial" | "failed" = "complete"
    if (unknownAllowances.length === evaluatedAllowances.length && evaluatedAllowances.length > 0) {
      scanStatus = "failed"
    } else if (unknownAllowances.length > 0 || !logsResult.success) {
      scanStatus = "partial"
    }

    const scanScope = scanStatus === "failed"
      ? `ERC-20 approval scan failed. Unable to query onchain allowance state on ${isTestnet ? "X Layer Testnet" : "X Layer Mainnet"}.`
      : scanStatus === "partial"
        ? `ERC-20 approval scan partially completed for blocks ${startBlock}–${endBlock} (${scannedBlockCount} blocks). Scanned ${tokens.length} verified token contracts (${scannedAssetSymbols}). ${unknownAllowances.length > 0 ? `${unknownAllowances.length} allowance queries unverified.` : "Historical logs partially retrieved."}`
        : `ERC-20 approval scan complete for blocks ${startBlock}–${endBlock} (${scannedBlockCount} blocks). Scanned ${tokens.length} verified token contracts (${scannedAssetSymbols}) and evaluated ${evaluatedAllowances.length} allowance relationships onchain.`

    const findings = [
      ...activeAllowances.map((c) => ({
        label: `${c.allowance === "Unlimited" ? "Unlimited" : c.allowance} ${c.token} approval`,
        spender: c.spenderAddress,
        spenderName: c.spenderName,
        spenderType: c.spenderType,
        token: c.token,
        tokenAddress: c.tokenAddress,
        allowance: c.allowance,
        status: c.status,
        risk: c.riskLevel,
        detail: c.riskDetail,
      })),
      ...unknownAllowances.map((c) => ({
        label: `Unverified ${c.token} allowance`,
        spender: c.spenderAddress,
        spenderName: c.spenderName,
        spenderType: c.spenderType,
        token: c.token,
        tokenAddress: c.tokenAddress,
        allowance: "Unknown",
        status: "unknown" as const,
        risk: "Attention",
        detail: c.riskDetail,
      })),
    ]

    const inactiveFindings = inactiveAllowances.map((c) => ({
      label: `0 ${c.token} allowance (Inactive)`,
      spender: c.spenderAddress,
      spenderName: c.spenderName,
      spenderType: c.spenderType,
      token: c.token,
      tokenAddress: c.tokenAddress,
      allowance: "0",
      status: "inactive" as const,
      risk: "Informational",
      detail: c.hasHistoricalEvent
        ? "Historical approval event detected, but current onchain allowance is 0 (inactive)."
        : "No active onchain allowance granted to this spender.",
    }))

    return {
      ok: true,
      data: {
        address: input.address,
        network: isTestnet ? "X Layer Testnet" : "X Layer Mainnet",
        chainId,
        blockNumber: currentBlock,
        startBlock,
        endBlock,
        scannedBlockCount,
        scannedBlockRange: {
          start: startBlock,
          end: endBlock,
          count: scannedBlockCount,
        },
        scanStatus,
        hasFindings: findings.length > 0,
        activeApprovalCount: activeAllowances.length,
        unlimitedApprovalCount,
        highAttentionCount: highRiskCount,
        unknownRelationshipCount: unknownAllowances.length,
        inactiveRelationshipCount: inactiveAllowances.length,
        scannedCount: evaluatedAllowances.length,
        scannedAssets: tokens.map((t) => t.symbol),
        eventsDiscoveredCount: discoveredEvents.length,
        scanScope,
        activeCount: activeAllowances.length,
        highRiskCount,
        allowances: evaluatedAllowances,
        activeAllowances,
        inactiveAllowances,
        findings,
        inactiveFindings,
        scannedAt: new Date().toISOString(),
        provenance: {
          chainId,
          source: "contract_read",
          blockNumber: currentBlock,
          verified: scanStatus === "complete",
        },
      },
      sources: [xLayerSources.security],
      trace: {
        name: "inspect_xlayer_allowances",
        label: "ERC-20 approval scan",
        status: scanStatus === "failed" ? "error" : "complete",
        summary: scanStatus === "failed"
          ? "ERC-20 approval scan failed to verify onchain state"
          : scanStatus === "partial"
            ? `${activeAllowances.length} active approval${activeAllowances.length === 1 ? "" : "s"} found (scan partial — ${unknownAllowances.length} unverified)`
            : `${activeAllowances.length} active approval${activeAllowances.length === 1 ? "" : "s"} found across ${tokens.length} verified assets`,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Allowance scan failed"
    return unavailable("inspect_xlayer_allowances", "ERC-20 approval scan", message, [xLayerSources.security])
  }
}

export async function executeXLayerTool(
  name: string,
  argumentsJson: string,
): Promise<AgentToolResult> {
  let parsedArguments: unknown
  try {
    parsedArguments = JSON.parse(argumentsJson)
  } catch {
    return unavailable(name, name, "Tool arguments were not valid JSON", [xLayerSources.network])
  }

  switch (name) {
    case "search_xlayer_knowledge":
      return searchKnowledge(parsedArguments)
    case "get_xlayer_network_snapshot":
      return getNetworkSnapshot(parsedArguments)
    case "get_xlayer_market_snapshot":
      return getMarketSnapshot(parsedArguments)
    case "get_xlayer_swap_quote":
      return getSwapQuote(parsedArguments)
    case "discover_xlayer_earn":
      return discoverEarn(parsedArguments)
    case "inspect_xlayer_address":
      return inspectAddress(parsedArguments)
    case "inspect_xlayer_transaction":
      return inspectTransaction(parsedArguments)
    case "inspect_xlayer_token_risk":
      return inspectTokenRisk(parsedArguments)
    case "inspect_xlayer_allowances":
      return inspectAllowances(parsedArguments)
    default:
      return unavailable(name, name, `Unknown tool ${name}`, [xLayerSources.network])
  }
}
