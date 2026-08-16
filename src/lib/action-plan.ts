import { z } from "zod"

import { ROUTER_ADDRESS_TESTNET } from "@/config/contracts"
import { IntentSchema, type Intent } from "@/lib/intents"
import { SafetyReportSchema, type SafetyReport } from "@/lib/safety/types"

export const TradeExecutionPreviewSchema = z.object({
  source: z.enum(["live", "simulated"]),
  network: z.enum(["mainnet", "testnet"]),
  fromToken: z.string(),
  toToken: z.string(),
  inputAmount: z.string(),
  estimatedOutput: z.string(),
  minimumReceived: z.string(),
  slippage: z.string(),
  gasEstimate: z.string(),
  priceImpact: z.string(),
  approvalRequired: z.boolean(),
  riskLevel: z.enum(["Low", "Medium", "High"]),
  route: z.string(),
  quotedAt: z.string().nullable(),
})

export const EarnOpportunitySchema = z.object({
  name: z.string(),
  protocol: z.string(),
  apy: z.string(),
  tvlUsd: z.string().optional(),
  productGroup: z.string().optional(),
  risk: z.string().optional(),
  note: z.string().optional(),
  url: z.string().optional(),
})

export function formatApy(raw: string): string {
  if (!raw || raw.toLowerCase() === "variable") return "Variable APY"
  if (raw.includes("%")) return raw.includes("APY") ? raw : `${raw} APY`
  const num = parseFloat(raw)
  if (isNaN(num)) return raw
  if (num > 0 && num < 1) {
    return `${(num * 100).toFixed(2)}% APY`
  }
  return `${num.toFixed(2)}% APY`
}

const XLAYER_MAINNET_ASSETS: Record<string, string> = {
  OKB: "NATIVE",
  XOKB: "NATIVE",
  WOKB: "0xe538905cf8410324e03a5a23c1c177a474d59b2b",
  USDT: "0x1e4a5963abfd975d8c9021ce480b42188849d41d",
  USDT0: "0x1e4a5963abfd975d8c9021ce480b42188849d41d",
  XUSDT: "0x1e4a5963abfd975d8c9021ce480b42188849d41d",
  USDG: "0xa78e2baabaf5c4f36b7fc394725deb68d332eec1",
  XUSDG: "0xa78e2baabaf5c4f36b7fc394725deb68d332eec1",
  USDC: "0x74b7f16337b8f9de7fb3fc82b0b1404685345107",
  XUSDC: "0x74b7f16337b8f9de7fb3fc82b0b1404685345107",
  ETH: "0x5a77f1443d16ee5761d310e38b62f77f726bc71c",
  WETH: "0x5a77f1443d16ee5761d310e38b62f77f726bc71c",
  XETH: "0x5a77f1443d16ee5761d310e38b62f77f726bc71c",
  BTC: "0xe32812497678bb0bc161c5c0c2937748805f3246",
  WBTC: "0xe32812497678bb0bc161c5c0c2937748805f3246",
  XBTC: "0xe32812497678bb0bc161c5c0c2937748805f3246",
  SOL: "0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c",
  XSOL: "0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c",
  GHO: "0x6f917540ab50A0bc8351Bf5a43bC745672A0D8D7",
}

const AAVE_V3_XLAYER_RESERVES: Record<string, string> = {
  USDT: "0x779ded0c9e1022225f8e0630b35a9b54be713736",
  USDT0: "0x779ded0c9e1022225f8e0630b35a9b54be713736",
  XUSDT: "0x779ded0c9e1022225f8e0630b35a9b54be713736",
  USDG: "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
  XUSDG: "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
  ETH: "0x5a77f1443d16ee5761d310e38b62f77f726bc71c",
  WETH: "0x5a77f1443d16ee5761d310e38b62f77f726bc71c",
  XETH: "0x5a77f1443d16ee5761d310e38b62f77f726bc71c",
  SOL: "0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c",
  XSOL: "0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c",
  BTC: "0xe32812497678bb0bc161c5c0c2937748805f3246",
  WBTC: "0xe32812497678bb0bc161c5c0c2937748805f3246",
  XBTC: "0xe32812497678bb0bc161c5c0c2937748805f3246",
  OKB: "0xe538905cf8410324e03a5a23c1c177a474d59b2b",
  WOKB: "0xe538905cf8410324e03a5a23c1c177a474d59b2b",
  XOKB: "0xe538905cf8410324e03a5a23c1c177a474d59b2b",
  GHO: "0x6f917540ab50A0bc8351Bf5a43bC745672A0D8D7",
}

export const UNISWAP_V3_XLAYER_POOLS: Record<string, string> = {
  // USDT / WOKB Pools (e.g. 0xe3be6a0137f1b0602fc1a4841686f43b340a5082)
  "USDT-OKB": "0xe3be6a0137f1b0602fc1a4841686f43b340a5082",
  "OKB-USDT": "0xe3be6a0137f1b0602fc1a4841686f43b340a5082",
  "USDT0-WOKB": "0xe3be6a0137f1b0602fc1a4841686f43b340a5082",
  "WOKB-USDT0": "0xe3be6a0137f1b0602fc1a4841686f43b340a5082",

  // USDC / USDT Stable Pairs
  "USDC-USDT": "0xeeeb3c1f61dc3070c675c2670a3f2188a060012d",
  "USDT-USDC": "0xeeeb3c1f61dc3070c675c2670a3f2188a060012d",
  "USDC-USDT0": "0xeeeb3c1f61dc3070c675c2670a3f2188a060012d",
  "USDT0-USDC": "0xeeeb3c1f61dc3070c675c2670a3f2188a060012d",

  // USDG / USDT & USDC
  "USDC-USDG": "0xbb9a35f790ea6ea9763b99e885f33bcf95860d40",
  "USDG-USDC": "0xbb9a35f790ea6ea9763b99e885f33bcf95860d40",
  "USDG-USDT": "0x0cbe0dbe1400e57f371a38bd3b9bc80f7c3676da",
  "USDT-USDG": "0x0cbe0dbe1400e57f371a38bd3b9bc80f7c3676da",
  "USDG-USDT0": "0x0cbe0dbe1400e57f371a38bd3b9bc80f7c3676da",
  "USDT0-USDG": "0x0cbe0dbe1400e57f371a38bd3b9bc80f7c3676da",

  // ETH / USDT Pairs
  "ETH-USDT": "0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
  "USDT-ETH": "0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
  "WETH-USDT": "0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
  "USDT-WETH": "0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
  "XETH-USDT": "0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
  "USDT-XETH": "0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
  "XETH-USDT0": "0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
  "USDT0-XETH": "0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",

  // ETH / USDC Pairs
  "ETH-USDC": "0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
  "USDC-ETH": "0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
  "WETH-USDC": "0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
  "USDC-WETH": "0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
  "XETH-USDC": "0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
  "USDC-XETH": "0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",

  // OKB / ETH Pairs
  "OKB-ETH": "0xc1382e9eb8f3df11d348d1dcca34e246690122a2",
  "ETH-OKB": "0xc1382e9eb8f3df11d348d1dcca34e246690122a2",
  "WOKB-WETH": "0xc1382e9eb8f3df11d348d1dcca34e246690122a2",
  "WETH-WOKB": "0xc1382e9eb8f3df11d348d1dcca34e246690122a2",
  "OKB-XETH": "0xc1382e9eb8f3df11d348d1dcca34e246690122a2",
  "XETH-OKB": "0xc1382e9eb8f3df11d348d1dcca34e246690122a2",

  // BTC / USDT & ETH Pairs
  "BTC-USDT": "0x5fcfb33c9ab1665fee892eb2af163e863a874d73",
  "USDT-BTC": "0x5fcfb33c9ab1665fee892eb2af163e863a874d73",
  "XBTC-USDT": "0x5fcfb33c9ab1665fee892eb2af163e863a874d73",
  "USDT-XBTC": "0x5fcfb33c9ab1665fee892eb2af163e863a874d73",
  "BTC-ETH": "0xf845c41c0683ce99b8c1f36c46b2d93e1533470c",
  "ETH-BTC": "0xf845c41c0683ce99b8c1f36c46b2d93e1533470c",
  "XBTC-XETH": "0xf845c41c0683ce99b8c1f36c46b2d93e1533470c",
  "XETH-XBTC": "0xf845c41c0683ce99b8c1f36c46b2d93e1533470c",

  // SOL / USDT & ETH Pairs
  "SOL-USDT": "0x4651300221f345a4c6f566079bd1ddc291049c7d",
  "USDT-SOL": "0x4651300221f345a4c6f566079bd1ddc291049c7d",
  "SOL-ETH": "0xc1382e9eb8f3df11d348d1dcca34e246690122a2",
  "ETH-SOL": "0xc1382e9eb8f3df11d348d1dcca34e246690122a2",
}

function extractTokensFromName(text: string): string[] {
  const clean = text.replace(/[^a-zA-Z0-9]/g, " ").toUpperCase()
  const tokens = clean.split(/\s+/).filter(Boolean)
  const matched: string[] = []
  for (const t of tokens) {
    if (XLAYER_MAINNET_ASSETS[t]) {
      if (!matched.includes(t)) matched.push(t)
    }
  }
  return matched
}

export function getProtocolUrl(
  protocol: string,
  name: string = "",
  asset: string = "",
  investmentId?: string,
): string {
  const p = `${protocol} ${name}`.toLowerCase()

  // 1. Aave V3 on X Layer (direct reserve deeplink)
  if (p.includes("aave")) {
    const matchedTokens = extractTokensFromName(`${name} ${asset}`)
    for (const token of matchedTokens) {
      if (AAVE_V3_XLAYER_RESERVES[token]) {
        return `https://app.aave.com/reserve-overview/?underlyingAsset=${AAVE_V3_XLAYER_RESERVES[token]}&marketName=proto_xlayer_v3`
      }
    }
    if (investmentId && /^0x[a-fA-F0-9]{40}$/.test(investmentId)) {
      return `https://app.aave.com/reserve-overview/?underlyingAsset=${investmentId}&marketName=proto_xlayer_v3`
    }
    return "https://app.aave.com/markets/?marketName=proto_xlayer_v3"
  }

  // 2. Uniswap V3 on X Layer (exact verified pool address deeplink)
  if (p.includes("uniswap")) {
    if (investmentId && /^0x[a-fA-F0-9]{40}$/.test(investmentId)) {
      return `https://app.uniswap.org/explore/pools/xlayer/${investmentId}`
    }
    const matchedTokens = extractTokensFromName(`${name} ${asset}`)
    if (matchedTokens.length >= 2) {
      const pairKey = `${matchedTokens[0]}-${matchedTokens[1]}`.toUpperCase()
      const reverseKey = `${matchedTokens[1]}-${matchedTokens[0]}`.toUpperCase()
      const poolAddress = UNISWAP_V3_XLAYER_POOLS[pairKey] || UNISWAP_V3_XLAYER_POOLS[reverseKey]
      if (poolAddress) {
        return `https://app.uniswap.org/explore/pools/xlayer/${poolAddress}`
      }
    }
    return "https://app.uniswap.org/explore/pools/xlayer"
  }

  // 3. Curve Finance on X Layer
  if (p.includes("curve")) {
    return "https://www.curve.finance/dex/x-layer/pools"
  }

  // 4. QuickSwap on X Layer
  if (p.includes("quickswap")) {
    return "https://quickswap.exchange/#/pools"
  }

  // 5. Morpho
  if (p.includes("morpho")) {
    return "https://app.morpho.org/"
  }

  // 6. Compound
  if (p.includes("compound")) {
    return "https://app.compound.finance/"
  }

  // 7. Test Sandbox / Faucet
  if (p.includes("test vault") || p.includes("xecute")) {
    return "https://web3.okx.com/xlayer/faucet/xlayerfaucet"
  }

  // 8. Specific onchain contract address on X Layer Explorer
  if (investmentId && /^0x[a-fA-F0-9]{40}$/.test(investmentId)) {
    return `https://www.okx.com/web3/explorer/xlayer/address/${investmentId}`
  }

  return "https://www.okx.com/web3/defi"
}

export const ApprovalFindingSchema = z.object({
  label: z.string(),
  spender: z.string(),
  spenderName: z.string().optional(),
  token: z.string().optional(),
  allowance: z.string().optional(),
  lastUsed: z.string().optional(),
  risk: z.string(),
})

export const PreparedActionStatusSchema = z.enum([
  "ready_to_execute",
  "simulated_preview",
  "quote_failed",
  "blocked",
  "needs_input",
  "analysis-ready",
  "preview-ready", // backward compatibility alias
])

export const PreparedActionSchema = z.object({
  status: PreparedActionStatusSchema,
  intent: IntentSchema,
  safety: SafetyReportSchema,
  preview: TradeExecutionPreviewSchema.nullable(),
  earnOpportunities: z.array(EarnOpportunitySchema).optional(),
  approvalFindings: z.array(ApprovalFindingSchema).optional(),
  errorMessage: z.string().optional(),
})

export type TradeExecutionPreview = z.infer<typeof TradeExecutionPreviewSchema>
export type EarnOpportunity = z.infer<typeof EarnOpportunitySchema>
export type ApprovalFinding = z.infer<typeof ApprovalFindingSchema>
export type PreparedActionStatus = z.infer<typeof PreparedActionStatusSchema>
export type PreparedAction = z.infer<typeof PreparedActionSchema>

export type QuoteData = Record<string, unknown> | null

function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null
}

export function livePreview(
  intent: Extract<Intent, { mode: "trade" }>,
  quote: QuoteData,
): TradeExecutionPreview | null {
  if (!quote || quote.readOnly !== true) return null
  const outputAmount = stringValue(quote.outputAmount)
  if (!intent.amount || !intent.fromToken || !intent.toToken || !outputAmount) return null

  const slippage = intent.maxSlippage
  const minimum = Number(outputAmount) * (1 - slippage / 100)
  const priceImpact = Number(stringValue(quote.priceImpactPercentage) ?? "0")

  return {
    source: "live",
    network: intent.network,
    fromToken: intent.fromToken,
    toToken: intent.toToken,
    inputAmount: intent.amount,
    estimatedOutput: outputAmount,
    minimumReceived: Number.isFinite(minimum) ? minimum.toLocaleString("en-US", { maximumFractionDigits: 8 }) : "Unavailable",
    slippage: `${slippage}%`,
    gasEstimate: stringValue(quote.estimatedGasUnits) ? `${quote.estimatedGasUnits} gas` : "21,000 gas",
    priceImpact: Number.isFinite(priceImpact) ? `${priceImpact}%` : "< 0.01%",
    approvalRequired: intent.fromToken !== "OKB",
    riskLevel: priceImpact > 3 ? "High" : priceImpact > 1 || slippage > 1 ? "Medium" : "Low",
    route: Array.isArray(quote.liquiditySources) && quote.liquiditySources.length
      ? quote.liquiditySources.filter((item): item is string => typeof item === "string").join(" + ")
      : "OKX DEX Aggregator (X Layer)",
    quotedAt: stringValue(quote.quotedAt) ?? new Date().toISOString(),
  }
}

export function prepareAction(
  intent: Intent,
  safety: SafetyReport,
  quote: QuoteData = null,
  quoteError?: string | null,
  forceSimulated = false,
  earnOpportunities?: EarnOpportunity[],
  approvalFindings?: ApprovalFinding[],
): PreparedAction {
  if (intent.mode !== "trade") {
    return {
      status: "analysis-ready",
      intent,
      safety,
      preview: null,
      earnOpportunities,
      approvalFindings,
    }
  }

  const action = intent.action || "swap"

  // Auto-resolve spender on Testnet if not explicitly specified
  if (intent.network === "testnet" && (action === "approve" || action === "revoke") && !intent.spender) {
    intent.spender = ROUTER_ADDRESS_TESTNET
  }

  // Check completeness per action
  if (action === "transfer") {
    if (!intent.amount || !intent.fromToken || !intent.recipient) {
      return { status: "needs_input", intent, safety, preview: null }
    }
  } else if (action === "approve") {
    if (!intent.amount || !intent.fromToken || !intent.spender) {
      return { status: "needs_input", intent, safety, preview: null }
    }
  } else if (action === "revoke") {
    if (!intent.fromToken || !intent.spender) {
      return { status: "needs_input", intent, safety, preview: null }
    }
  } else {
    if (!intent.amount || !intent.fromToken || !intent.toToken) {
      return { status: "needs_input", intent, safety, preview: null }
    }
  }

  if (safety.level === "blocked") {
    const blockReason = safety.checks.find((c) => c.status === "block")?.detail || "Action blocked by safety policy"
    return { status: "blocked", intent, safety, preview: null, errorMessage: blockReason }
  }

  // Handle Transfer action preview
  if (action === "transfer") {
    const isTestnet = intent.network === "testnet"
    return {
      status: isTestnet && !forceSimulated ? "ready_to_execute" : "simulated_preview",
      intent,
      safety,
      preview: {
        source: isTestnet && !forceSimulated ? "live" : "simulated",
        network: intent.network,
        fromToken: intent.fromToken!,
        toToken: intent.fromToken!,
        inputAmount: intent.amount!,
        estimatedOutput: intent.amount!,
        minimumReceived: intent.amount!,
        slippage: "0.0%",
        gasEstimate: intent.fromToken === "OKB" ? "21,000 gas" : "65,000 gas",
        priceImpact: "0.0%",
        approvalRequired: false,
        riskLevel: "Low",
        route: `Direct Transfer (${intent.fromToken} → ${intent.recipient?.slice(0, 6)}...${intent.recipient?.slice(-4)})`,
        quotedAt: new Date().toISOString(),
      },
    }
  }

  // Handle Approve action preview
  if (action === "approve") {
    const isTestnet = intent.network === "testnet"
    const spenderAddr = intent.spender || (isTestnet ? ROUTER_ADDRESS_TESTNET : "0x0000000000000000000000000000000000000000")
    return {
      status: isTestnet && !forceSimulated ? "ready_to_execute" : "simulated_preview",
      intent,
      safety,
      preview: {
        source: isTestnet && !forceSimulated ? "live" : "simulated",
        network: intent.network,
        fromToken: intent.fromToken!,
        toToken: intent.fromToken!,
        inputAmount: intent.amount!,
        estimatedOutput: `${intent.amount!} allowance`,
        minimumReceived: intent.amount!,
        slippage: "0.0%",
        gasEstimate: "45,000 gas",
        priceImpact: "0.0%",
        approvalRequired: true,
        riskLevel: "Low",
        route: `ERC-20 Token Approval (${spenderAddr.slice(0, 6)}...${spenderAddr.slice(-4)})`,
        quotedAt: new Date().toISOString(),
      },
    }
  }

  // Handle Revoke action preview
  if (action === "revoke") {
    const isTestnet = intent.network === "testnet"
    const spenderAddr = intent.spender || (isTestnet ? ROUTER_ADDRESS_TESTNET : "0x0000000000000000000000000000000000000000")
    return {
      status: isTestnet && !forceSimulated ? "ready_to_execute" : "simulated_preview",
      intent,
      safety,
      preview: {
        source: isTestnet && !forceSimulated ? "live" : "simulated",
        network: intent.network,
        fromToken: intent.fromToken!,
        toToken: intent.fromToken!,
        inputAmount: "0",
        estimatedOutput: "0 allowance (revoked)",
        minimumReceived: "0",
        slippage: "0.0%",
        gasEstimate: "45,000 gas",
        priceImpact: "0.0%",
        approvalRequired: true,
        riskLevel: "Low",
        route: `ERC-20 Allowance Revocation (${spenderAddr.slice(0, 6)}...${spenderAddr.slice(-4)})`,
        quotedAt: new Date().toISOString(),
      },
    }
  }

  // 1. Live Swap Quote successfully retrieved
  const live = livePreview(intent, quote)
  if (live) {
    return {
      status: "ready_to_execute",
      intent,
      safety,
      preview: live,
    }
  }

  // 2. Testnet swap or explicit simulation requested
  if (intent.network === "testnet" || forceSimulated) {
    const isTestnet = intent.network === "testnet"
    const from = (intent.fromToken || "OKB").toUpperCase()
    const to = (intent.toToken || "USDT").toUpperCase()
    const amount = Number(intent.amount || "0")
    const slippage = intent.maxSlippage ?? 0.5

    let rawOut = 0
    if (from === "OKB") {
      rawOut = amount * 60
    } else if (to === "OKB") {
      rawOut = amount / 60
    } else {
      rawOut = amount
    }

    const estimatedOutput = Number.isFinite(rawOut) ? rawOut.toFixed(to === "OKB" ? 6 : 4) : "0.00"
    const minimumReceived = (rawOut * (1 - slippage / 100)).toFixed(to === "OKB" ? 6 : 4)

    return {
      status: isTestnet && !forceSimulated ? "ready_to_execute" : "simulated_preview",
      intent,
      safety,
      preview: {
        source: "simulated",
        network: intent.network,
        fromToken: intent.fromToken!,
        toToken: intent.toToken!,
        inputAmount: intent.amount!,
        estimatedOutput,
        minimumReceived,
        slippage: `${slippage}%`,
        gasEstimate: "142,500 gas",
        priceImpact: "0.00%",
        approvalRequired: from !== "OKB",
        riskLevel: slippage <= 1 ? "Low" : "Medium",
        route: isTestnet
          ? "Xecute Testnet Router (Deterministic Testnet Pricing)"
          : "Simulated X Layer Route",
        quotedAt: new Date().toISOString(),
      },
    }
  }

  // 3. Live quote failed or unavailable — do NOT fabricate numbers
  const errorMsg = quoteError || (quote && "summary" in quote ? String(quote.summary) : null) || "DEX swap quote could not be retrieved from X Layer liquidity pools."
  return {
    status: "quote_failed",
    intent,
    safety,
    preview: null,
    errorMessage: errorMsg,
  }
}
