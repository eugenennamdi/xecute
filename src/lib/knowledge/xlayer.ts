import type { AgentSource } from "@/lib/agent-types"

export type KnowledgeCategory =
  | "network"
  | "architecture"
  | "tokens"
  | "trade"
  | "market"
  | "defi"
  | "bridge"
  | "security"
  | "oracle"
  | "infrastructure"
  | "payments"
  | "wallet"

export type XLayerKnowledgeRecord = {
  id: string
  title: string
  category: KnowledgeCategory
  summary: string
  facts: string[]
  keywords: string[]
  network: "mainnet" | "testnet" | "both" | "ecosystem"
  status: "live" | "ecosystem-listed" | "roadmap"
  source: AgentSource
}

const verifiedAt = "2026-08-14"

export const xLayerSources = {
  overview: {
    id: "xlayer-overview",
    title: "X Layer overview",
    url: "https://web3.okx.com/xlayer",
    kind: "official-directory",
    verifiedAt,
  },
  network: {
    id: "xlayer-network",
    title: "X Layer network information",
    url: "https://web3.okx.com/onchainos/dev-docs/xlayer/developer/build-on-xlayer/network-information",
    kind: "official-docs",
    verifiedAt,
  },
  architecture: {
    id: "xlayer-architecture",
    title: "Build on X Layer",
    url: "https://web3.okx.com/onchainos/dev-docs/xlayer/developer/build-on-xlayer/about-xlayer",
    kind: "official-docs",
    verifiedAt,
  },
  onchainOs: {
    id: "onchain-os",
    title: "What is Onchain OS",
    url: "https://web3.okx.com/onchainos/dev-docs/home/what-is-onchainos",
    kind: "official-docs",
    verifiedAt,
  },
  trade: {
    id: "okx-trade-api",
    title: "Onchain OS Trade API",
    url: "https://web3.okx.com/onchainos/dev-docs/trade/dex-api-introduction",
    kind: "official-api",
    verifiedAt,
  },
  market: {
    id: "okx-market-api",
    title: "Onchain OS Market API",
    url: "https://web3.okx.com/onchainos/dev-docs/market/market-api-introduction",
    kind: "official-api",
    verifiedAt,
  },
  defi: {
    id: "okx-defi-api",
    title: "Onchain OS DeFi API",
    url: "https://web3.okx.com/onchainos/dev-docs/wallet/defi-api-overview",
    kind: "official-api",
    verifiedAt,
  },
  data: {
    id: "xlayer-data-api",
    title: "X Layer Data API",
    url: "https://web3.okx.com/onchainos/dev-docs/xlayer/developer/data/xlayer-introduction",
    kind: "official-api",
    verifiedAt,
  },
  security: {
    id: "xlayer-security",
    title: "X Layer Security & Approvals",
    url: "https://web3.okx.com/xlayer",
    kind: "official-docs",
    verifiedAt,
  },
  bridge: {
    id: "xlayer-bridge",
    title: "X Layer bridge overview",
    url: "https://web3.okx.com/onchainos/dev-docs/xlayer/developer/bridge/overview",
    kind: "official-docs",
    verifiedAt,
  },
} satisfies Record<string, AgentSource>

export const xLayerKnowledge: XLayerKnowledgeRecord[] = [
  {
    id: "network-mainnet",
    title: "X Layer Mainnet Specifications",
    category: "network",
    summary: "X Layer Mainnet is an ultra-fast, EVM-equivalent Layer 2 rollup secured by Ethereum using OKB as the native gas token.",
    facts: [
      "Chain ID & Onchain OS Chain Index: 196 (0xc4)",
      "Native Gas Token: OKB (18 decimals)",
      "Primary RPC Endpoints: https://rpc.xlayer.tech and https://xlayerrpc.okx.com",
      "Official Block Explorer: https://www.okx.com/web3/explorer/xlayer and OKLink",
      "Block Time: ~1.0 second with instant transaction confirmation",
      "Average Gas Fee: < $0.001 per standard transfer",
    ],
    keywords: ["mainnet", "chain id", "rpc", "explorer", "okb", "network", "gas", "fees", "196"],
    network: "mainnet",
    status: "live",
    source: xLayerSources.network,
  },
  {
    id: "network-testnet",
    title: "X Layer Testnet Specifications & Faucet",
    category: "network",
    summary: "X Layer Testnet is the developer testing environment mirroring mainnet execution and gas tokenomics with free test tokens.",
    facts: [
      "Chain ID & Chain Index: 1952 / 195",
      "Native Gas Token: Testnet OKB (18 decimals)",
      "Official Faucet URL: https://web3.okx.com/xlayer/faucet/xlayerfaucet",
      "Faucet Dispense Limits: 0.2 Testnet OKB, 10 USDC, 10 USDT, and 10 USDG once every 12 hours per address/IP",
      "Faucet Contract: 0xf6d0889260c6d59b20b22a275f6f3a3ad448907f",
      "Primary RPC Endpoints: https://testrpc.xlayer.tech/terigon and https://xlayertestrpc.okx.com/terigon",
      "Official Testnet Explorer: https://www.okx.com/web3/explorer/xlayer-test",
    ],
    keywords: ["testnet", "chain id", "rpc", "faucet", "explorer", "1952", "195", "usdt", "usdc", "usdg", "tokens"],
    network: "testnet",
    status: "live",
    source: xLayerSources.network,
  },
  {
    id: "tokens-testnet-registry",
    title: "Testnet Tokens & Faucet Assets on X Layer",
    category: "tokens",
    summary: "Testnet token assets available for sandbox trading, liquidity testing, and execution.",
    facts: [
      "OKB (Native Gas Token): Claimable (0.2 OKB every 12h) via official faucet (https://web3.okx.com/xlayer/faucet/xlayerfaucet)",
      "USDT (Testnet Tether USD): Claimable (10 USDT every 12h) via official faucet, supported for test swaps",
      "USDC (Testnet USD Coin): Claimable (10 USDC every 12h) via official faucet, supported for test swaps",
      "USDG (Testnet Global Dollar): Claimable (10 USDG every 12h) via official faucet, supported for test swaps",
    ],
    keywords: ["testnet tokens", "faucet", "usdt", "usdc", "usdg", "okb", "test assets", "usdt0"],
    network: "testnet",
    status: "live",
    source: xLayerSources.network,
  },
  {
    id: "architecture-op-stack",
    title: "X Layer High-Performance L2 Architecture",
    category: "architecture",
    summary: "X Layer leverages high-performance enhanced OP Stack infrastructure (op-node and op-reth) with AggLayer interoperability and Ethereum Layer 1 settlement.",
    facts: [
      "EVM Equivalence: 100% bytecode and opcode compatibility with Ethereum smart contracts",
      "Sequencer & Execution Architecture: High-throughput sequencer nodes (op-node and op-reth) for sub-second block times and ultra-low fees",
      "Ethereum L1 Settlement: L2 state updates and execution data posted directly to Ethereum Layer 1",
      "AggLayer Integration: Cross-chain liquidity sharing and near-instant interoperability",
      "Native Gas Asset: OKB with standard 18-decimal EVM precision",
    ],
    keywords: ["architecture", "op stack", "op-node", "op-reth", "agglayer", "evm", "sequencer", "ethereum", "settlement"],
    network: "both",
    status: "live",
    source: xLayerSources.architecture,
  },
  {
    id: "tokens-verified-registry",
    title: "Verified Tokens & Smart Contracts on X Layer",
    category: "tokens",
    summary: "Canonical token contracts deployed on X Layer mainnet for trading, liquidity, and lending.",
    facts: [
      "OKB (Native Gas Token): Native execution asset (18 decimals)",
      "WOKB (Wrapped OKB): 0xe538905cf8410324e03a5a23c1c177a474d59b2b (18 decimals)",
      "USDT (Tether USD / USD₮0 LayerZero OFT): 0x779ded0c9e1022225f8e0630b35a9b54be713736 (6 decimals) - official current X Layer default for USDT",
      "USDC (Native Circle): 0xB6CEceAB302E2E4948951eE7843FC24E92933061 (6 decimals)",
      "xETH: 0xe7b000003a45145decf8a28fc755ad5ec5ea025a (18 decimals)",
      "WETH (Wrapped Ether): 0x5a77f1443d16ee5761d310e38b62f77f726bc71c (18 decimals)",
      "xBTC: 0xb7C00000bcDEeF966b20B3D884B98E64d2b06b4f (8 decimals) - default for BTC",
      "WBTC (Wrapped Bitcoin): 0xEA034fb02eB1808C2cc3adbC15f447B93CbE08e1 (8 decimals)",
      "USDG (Global Dollar): 0x4ae46a509f6b1d9056937ba4500cb143933d2dc8 (6 decimals)",
    ],
    keywords: ["tokens", "contracts", "addresses", "usdt0", "usdt", "usdc", "wokb", "weth", "wbtc", "xeth", "xbtc", "usdg", "okb"],
    network: "mainnet",
    status: "live",
    source: xLayerSources.data,
  },
  {
    id: "dex-aggregation-trade",
    title: "OKX DEX Aggregator & Liquidity Routing",
    category: "trade",
    summary: "High-efficiency DEX routing across X Layer native liquidity pools with minimal slippage and MEV protection.",
    facts: [
      "Aggregates QuickSwap V2/V3/CLMM, SwapX, ambient pools, and OKX liquidity routes",
      "Splits large trade sizes across multiple pools to minimize market price impact",
      "Enforces strict slippage tolerance (recommended <= 1.0%, hard safety block > 5.0%)",
      "Provides preflight simulation to verify transaction validity before onchain submission",
    ],
    keywords: ["dex", "swap", "trade", "quote", "quickswap", "swapx", "slippage", "routing", "liquidity"],
    network: "mainnet",
    status: "live",
    source: xLayerSources.trade,
  },
  {
    id: "defi-earning-lending",
    title: "DeFi Yield, Lending & Staking on X Layer",
    category: "defi",
    summary: "Earning opportunities, liquidity provision, and lending markets active on the X Layer ecosystem.",
    facts: [
      "Single-Asset Yield: Supply stablecoins (USDT0, USDC) and OKB to lending money markets",
      "Liquidity Pools: Concentrated liquidity AMMs (QuickSwap V3, SwapX) earning swap fee yields",
      "Liquid Staking: Staking OKB for liquid derivatives with auto-compounding rewards",
      "Risk Segmentation: Audited TVL metrics, protocol health factors, and dynamic APY tracking via OKX DeFi API",
    ],
    keywords: ["defi", "earn", "yield", "apy", "tvl", "lending", "staking", "pools", "quickswap", "zerolend"],
    network: "mainnet",
    status: "live",
    source: xLayerSources.defi,
  },
  {
    id: "bridge-mechanics",
    title: "X Layer Native Bridge & Cross-Chain Transfers",
    category: "bridge",
    summary: "Secure asset bridging between Ethereum Layer 1 and X Layer Layer 2.",
    facts: [
      "Official Native Bridge: Deposit ETH, OKB, USDT, USDC from Ethereum to X Layer",
      "Deposit Time: Typically ~12-15 minutes (Ethereum block confirmations)",
      "Withdrawal Time: Sub-second soft execution with Ethereum Layer 1 settlement",
      "Third-Party Fast Bridges: Orbiter Finance, Meson, Stargate, Rhino.fi, Owlto for instant cross-chain swaps",
    ],
    keywords: ["bridge", "deposit", "withdraw", "ethereum", "cross-chain", "orbiter", "meson", "stargate", "native bridge"],
    network: "both",
    status: "live",
    source: xLayerSources.bridge,
  },
  {
    id: "security-wallet-safeguards",
    title: "Wallet Security, Token Approvals & Preflight Safeguards",
    category: "security",
    summary: "Multi-layer preflight verification, allowance inspection, and deterministic execution guards built into Xecute.",
    facts: [
      "Token Approvals: Scans for infinite allowances, active spenders, and contract classifications via onchain RPC",
      "Preflight Simulation: Dry-run simulation and live gas estimation via eth_call and eth_estimateGas",
      "Gas Reserve Guard: Enforces native OKB reserve so accounts maintain fee solvency",
      "Human-in-the-Loop Confirmation: Zero autonomous onchain mutations without explicit user wallet signature",
    ],
    keywords: ["security", "protect", "approvals", "allowance", "simulation", "gas reserve", "safeguards"],
    network: "both",
    status: "live",
    source: xLayerSources.overview,
  },
  {
    id: "onchain-os-ecosystem",
    title: "OKX Onchain OS Skills & Agent Integration",
    category: "infrastructure",
    summary: "The official OKX Onchain OS suite providing comprehensive tools for autonomous trading, intelligence, and execution.",
    facts: [
      "okx-guide: Onboarding, guide hub, intent classification, and customer assistance",
      "okx-defi: Multi-chain product discovery, APY/TVL tracking, and position management",
      "okx-dex-market: Live token prices, liquidity depth, candlestick charts, and smart money signals",
      "okx-agentic-wallet: Secure account abstraction, key management, simulation, and execution",
      "okx-dapp-discovery: Protocol routing and ecosystem deep links",
      "okx-agent-payments-protocol: x402 payment channels and programmatic micro-settlements",
    ],
    keywords: ["onchain os", "skills", "agent", "mcp", "okx-defi", "okx-dex-market", "okx-agentic-wallet", "x402"],
    network: "mainnet",
    status: "live",
    source: xLayerSources.onchainOs,
  },
]

function tokenize(value: string) {
  const stopWords = new Set([
    "a",
    "about",
    "and",
    "are",
    "for",
    "in",
    "is",
    "its",
    "layer",
    "me",
    "of",
    "on",
    "the",
    "what",
    "which",
    "x",
  ])

  return (value.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((token) => !stopWords.has(token))
    .map((token) => token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token)
}

export function rankXLayerKnowledge(
  query: string,
  records: XLayerKnowledgeRecord[],
  options: { category?: KnowledgeCategory; limit?: number } = {},
) {
  const queryTokens = new Set(tokenize(query))
  const asksForDefinition = /\b(?:what is|explain|about)\s+x\s+layer\b/i.test(query)
  const limit = Math.min(Math.max(options.limit ?? 5, 1), 8)

  return records
    .filter((record) => !options.category || record.category === options.category)
    .map((record) => {
      const title = record.title.toLowerCase()
      const haystack = [record.title, record.summary, ...record.facts, ...record.keywords]
        .join(" ")
        .toLowerCase()
      let score = queryTokens.size === 0 ? 1 : 0

      if (asksForDefinition && record.id === "architecture-zk-rollup") score += 10
      if (asksForDefinition && record.id === "network-mainnet") score += 6

      for (const token of queryTokens) {
        if (title.includes(token)) score += 4
        if (record.keywords.some((keyword) => keyword.includes(token))) score += 3
        if (haystack.includes(token)) score += 1
      }

      return { record, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title))
    .slice(0, limit)
    .map(({ record }) => record)
}

export function searchXLayerKnowledge(
  query: string,
  options: { category?: KnowledgeCategory; limit?: number } = {},
) {
  return rankXLayerKnowledge(query, xLayerKnowledge, options)
}
