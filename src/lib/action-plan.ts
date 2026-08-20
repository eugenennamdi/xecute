import { z } from "zod"
import { parseUnits, formatUnits } from "viem"

import { ROUTER_ADDRESS_TESTNET } from "@/config/contracts"
import { findToken } from "@/config/tokens"
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
  if (!raw) return "Variable"
  const lower = raw.toLowerCase().trim()
  if (lower === "variable" || lower.startsWith("variable")) return "Variable"
  if (lower === "unavailable" || lower === "n/a") return "Unavailable"
  if (raw.includes("%")) return raw.includes("APY") ? raw : `${raw} APY`
  const num = parseFloat(raw)
  if (isNaN(num)) return raw
  if (num > 0 && num < 1) {
    return `${(num * 100).toFixed(2)}% APY`
  }
  return `${num.toFixed(2)}% APY`
}

export const UNISWAP_V3_XLAYER_POOLS: Record<string, string> = {
  "USDT-OKB": "0xe3be6a0137f1b0602fc1a4841686f43b340a5082",
  "OKB-USDT": "0xe3be6a0137f1b0602fc1a4841686f43b340a5082",
  "USDT-WOKB": "0xe3be6a0137f1b0602fc1a4841686f43b340a5082",
  "WOKB-USDT": "0xe3be6a0137f1b0602fc1a4841686f43b340a5082",
  "USDC-USDT": "0xeeeb3c1f61dc3070c675c2670a3f2188a060012d",
  "USDT-USDC": "0xeeeb3c1f61dc3070c675c2670a3f2188a060012d",
  "USDG-USDT": "0x0cbe0dbe1400e57f371a38bd3b9bc80f7c3676da",
  "USDT-USDG": "0x0cbe0dbe1400e57f371a38bd3b9bc80f7c3676da",
  "ETH-USDT": "0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
  "USDT-ETH": "0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
  "WETH-USDT": "0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
  "USDT-WETH": "0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
  "OKB-ETH": "0xc1382e9eb8f3df11d348d1dcca34e246690122a2",
  "ETH-OKB": "0xc1382e9eb8f3df11d348d1dcca34e246690122a2",
  "BTC-USDT": "0x5fcfb33c9ab1665fee892eb2af163e863a874d73",
  "USDT-BTC": "0x5fcfb33c9ab1665fee892eb2af163e863a874d73",
  "WBTC-USDT": "0x5fcfb33c9ab1665fee892eb2af163e863a874d73",
  "USDT-WBTC": "0x5fcfb33c9ab1665fee892eb2af163e863a874d73",
}

function extractTokensFromName(text: string): string[] {
  const clean = text.replace(/[^a-zA-Z0-9]/g, " ").toUpperCase()
  const tokens = clean.split(/\s+/).filter(Boolean)
  const matched: string[] = []
  for (const t of tokens) {
    const cfg = findToken(t, 196)
    if (cfg) {
      if (!matched.includes(cfg.symbol)) matched.push(cfg.symbol)
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
      const cfg = findToken(token, 196)
      if (cfg && cfg.address !== "native") {
        return `https://app.aave.com/reserve-overview/?underlyingAsset=${cfg.address}&marketName=proto_xlayer_v3`
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
  spenderType: z.string().optional(),
  token: z.string().optional(),
  tokenAddress: z.string().optional(),
  allowance: z.string().optional(),
  status: z.enum(["active", "unlimited", "inactive", "unknown"]).optional(),
  lastUsed: z.string().optional(),
  risk: z.string(),
  detail: z.string().optional(),
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
  inactiveFindings: z.array(ApprovalFindingSchema).optional(),
  scanStatus: z.enum(["complete", "partial", "failed"]).optional(),
  scanScope: z.string().optional(),
  scannedBlockNumber: z.number().optional(),
  startBlock: z.number().optional(),
  endBlock: z.number().optional(),
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

  const toCfg = findToken(intent.toToken, intent.network === "testnet" ? 1952 : 196)
  const slippage = intent.maxSlippage
  const slippageBps = BigInt(Math.min(500, Math.max(0, Math.round(slippage * 100))))
  let minimumReceived = "Unavailable"

  if (toCfg) {
    try {
      const outBigInt = parseUnits(outputAmount, toCfg.decimals)
      const minUnits = (outBigInt * (BigInt(10000) - slippageBps)) / BigInt(10000)
      minimumReceived = formatUnits(minUnits, toCfg.decimals)
    } catch {
      minimumReceived = "Unavailable"
    }
  }

  const rawPriceImpact = stringValue(quote.priceImpactPercentage)
  const priceImpact = rawPriceImpact ? `${rawPriceImpact}%` : "Unavailable"
  const priceImpactNum = rawPriceImpact ? parseFloat(rawPriceImpact) : NaN

  return {
    source: "live",
    network: intent.network,
    fromToken: intent.fromToken,
    toToken: intent.toToken,
    inputAmount: intent.amount,
    estimatedOutput: outputAmount,
    minimumReceived,
    slippage: `${slippage}%`,
    gasEstimate: stringValue(quote.estimatedGasUnits) ? `${quote.estimatedGasUnits} gas` : "Unavailable",
    priceImpact,
    approvalRequired: intent.fromToken !== "OKB",
    riskLevel: !isNaN(priceImpactNum) && priceImpactNum > 3 ? "High" : !isNaN(priceImpactNum) && priceImpactNum > 1 || slippage > 1 ? "Medium" : "Low",
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
  inactiveFindings?: ApprovalFinding[],
  scanStatus?: "complete" | "partial" | "failed",
  scanScope?: string,
  scannedBlockNumber?: number,
  startBlock?: number,
  endBlock?: number,
  routerLiquidity?: {
    sufficient: boolean
    availableBalance: string
    toSymbol: string
  },
): PreparedAction {
  if (intent.mode !== "trade") {
    return {
      status: "analysis-ready",
      intent,
      safety,
      preview: null,
      earnOpportunities,
      approvalFindings,
      inactiveFindings,
      scanStatus,
      scanScope,
      scannedBlockNumber,
      startBlock,
      endBlock,
    }
  }

  const action = intent.action || "swap"

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
        gasEstimate: "Unavailable (Pre-estimate)",
        priceImpact: "N/A",
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
    const spenderAddr = intent.spender!
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
        gasEstimate: "Unavailable (Pre-estimate)",
        priceImpact: "N/A",
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
    const spenderAddr = intent.spender!
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
        gasEstimate: "Unavailable (Pre-estimate)",
        priceImpact: "N/A",
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
    const chainId = isTestnet ? 1952 : 196

    if (!intent.fromToken || !intent.toToken || !intent.amount) {
      return {
        status: "needs_input",
        intent,
        safety: {
          ...safety,
          allowed: false,
          level: "blocked",
        },
        preview: {
          source: "simulated",
          network: intent.network,
          fromToken: intent.fromToken || "Unavailable",
          toToken: intent.toToken || "Unavailable",
          inputAmount: intent.amount || "Unavailable",
          estimatedOutput: "Unavailable",
          minimumReceived: "Unavailable",
          slippage: `${intent.maxSlippage ?? 0.5}%`,
          gasEstimate: "Unavailable",
          priceImpact: "Unavailable",
          approvalRequired: false,
          riskLevel: "Low",
          route: "Unavailable",
          quotedAt: new Date().toISOString(),
        },
      }
    }

    const from = intent.fromToken.toUpperCase()
    const to = intent.toToken.toUpperCase()
    const slippage = intent.maxSlippage ?? 0.5
    const slippageBps = BigInt(Math.min(500, Math.max(0, Math.round(slippage * 100))))

    let estimatedOutput = "Unavailable"
    let minimumReceived = "Unavailable"

    const fromCfg = findToken(from, chainId)
    const toCfg = findToken(to, chainId)

    if (fromCfg && toCfg && intent.amount) {
      try {
        const decIn = BigInt(fromCfg.decimals)
        const decOut = BigInt(toCfg.decimals)
        const amountInUnits = parseUnits(intent.amount, fromCfg.decimals)

        let outUnits = BigInt(0)
        if (from === "OKB") {
          outUnits = (amountInUnits * BigInt(60) * (BigInt(10) ** decOut)) / (BigInt(10) ** BigInt(18))
        } else if (to === "OKB") {
          outUnits = (amountInUnits * (BigInt(10) ** BigInt(18))) / (BigInt(60) * (BigInt(10) ** decIn))
        } else {
          outUnits = (amountInUnits * (BigInt(10) ** decOut)) / (BigInt(10) ** decIn)
        }

        const minUnits = (outUnits * (BigInt(10000) - slippageBps)) / BigInt(10000)
        estimatedOutput = formatUnits(outUnits, toCfg.decimals)
        minimumReceived = formatUnits(minUnits, toCfg.decimals)
      } catch {
        estimatedOutput = "Unavailable"
        minimumReceived = "Unavailable"
      }
    }

    if (isTestnet && routerLiquidity && !routerLiquidity.sufficient) {
      return {
        status: "quote_failed",
        intent,
        safety: {
          ...safety,
          allowed: false,
          level: "blocked",
        },
        preview: null,
        errorMessage: `The Xecute Testnet Router pool currently holds ${routerLiquidity.availableBalance} ${routerLiquidity.toSymbol}, which is insufficient to fulfill this swap of ${estimatedOutput} ${routerLiquidity.toSymbol}. Please try a smaller amount (up to ${routerLiquidity.availableBalance} ${routerLiquidity.toSymbol}) or supply additional liquidity to the router pool.`,
      }
    }

    return {
      status: isTestnet && !forceSimulated ? "ready_to_execute" : "simulated_preview",
      intent,
      safety,
      preview: {
        source: "simulated",
        network: intent.network,
        fromToken: intent.fromToken,
        toToken: intent.toToken,
        inputAmount: intent.amount,
        estimatedOutput,
        minimumReceived,
        slippage: `${slippage}%`,
        gasEstimate: "Unavailable (Pre-estimate)",
        priceImpact: "N/A",
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
