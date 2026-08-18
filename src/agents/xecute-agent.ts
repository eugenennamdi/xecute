import OpenAI from "openai"
import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionFunctionTool,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions/completions"

import { isComplexAgentRequest, preferredDirectProvider } from "@/agents/agent-routing"
import { parseIntent } from "@/agents/intent-parser"
import { lightweightConversationAnswer } from "@/agents/lightweight-conversation"
import { XECUTE_SYSTEM_PROMPT } from "@/agents/system-prompt"
import {
  executeXLayerTool,
  type AgentToolResult,
  xLayerToolDefinitions,
} from "@/agents/tools/xlayer-tools"
import type {
  AgentMetadata,
  AgentRequest,
  AgentResponse,
  AgentSource,
  AgentToolTrace,
} from "@/lib/agent-types"
import { prepareAction, formatApy, getProtocolUrl, type PreparedAction, type ApprovalFinding } from "@/lib/action-plan"
import type { Mode } from "@/lib/intents"
import { searchXLayerKnowledge } from "@/lib/knowledge/xlayer"
import { evaluateIntentSafety } from "@/lib/safety/policy"

const DEFAULT_OPENAI_MODEL = "gpt-5.4-mini"
const DEFAULT_OPENROUTER_MODEL = "openrouter/free"
const DEFAULT_GEMINI_FAST_MODEL = "gemini-3.5-flash-lite"
const DEFAULT_GEMINI_REASONING_MODEL = "gemini-3.7-flash"
const DEFAULT_DEEPSEEK_FAST_MODEL = "deepseek-v4-flash"
const DEFAULT_DEEPSEEK_REASONING_MODEL = "deepseek-v4-pro"
const MAX_TOOL_ROUNDS = 3
const ROUTINE_AGENT_BUDGET_MS = 60_000
const COMPLEX_AGENT_BUDGET_MS = 90_000
const remoteCooldowns = new Map<string, number>()

type RemoteProviderConfig = {
  provider: Exclude<AgentMetadata["provider"], "local">
  apiKey: string
  model: string
  baseURL?: string
  defaultHeaders?: Record<string, string>
  reasoningEffort?: "low" | "medium"
  thinking?: "enabled" | "disabled"
  attemptBudgetMs: number
}

function configuredValue(name: string) {
  const value = process.env[name]?.trim()
  return value || undefined
}

function directProviderConfig(
  provider: "deepseek" | "gemini",
  complex: boolean,
  fastFallback = false,
): RemoteProviderConfig | null {
  if (provider === "gemini") {
    const apiKey = configuredValue("GEMINI_API_KEY")
    if (!apiKey) return null

    const overriddenModel = configuredValue("GEMINI_MODEL") || configuredValue("AI_MODEL")
    return {
      provider,
      apiKey,
      model: overriddenModel || (
        complex && !fastFallback
          ? configuredValue("GEMINI_REASONING_MODEL") || DEFAULT_GEMINI_REASONING_MODEL
          : configuredValue("GEMINI_FAST_MODEL") || DEFAULT_GEMINI_FAST_MODEL
      ),
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      reasoningEffort: complex && !fastFallback ? "medium" : "low",
      attemptBudgetMs: complex && !fastFallback ? 35_000 : 25_000,
    }
  }

  const apiKey = configuredValue("DEEPSEEK_API_KEY")
  if (!apiKey) return null

  const overriddenModel = configuredValue("DEEPSEEK_MODEL") || configuredValue("AI_MODEL")
  return {
    provider,
    apiKey,
    model: overriddenModel || (
      complex && !fastFallback
        ? configuredValue("DEEPSEEK_REASONING_MODEL") || DEFAULT_DEEPSEEK_REASONING_MODEL
        : configuredValue("DEEPSEEK_FAST_MODEL") || DEFAULT_DEEPSEEK_FAST_MODEL
    ),
    baseURL: configuredValue("DEEPSEEK_BASE_URL") || "https://api.deepseek.com",
    thinking: complex && !fastFallback ? "enabled" : "disabled",
    attemptBudgetMs: complex && !fastFallback ? 35_000 : 25_000,
  }
}

function legacyProviderConfig(provider: "openai" | "openrouter"): RemoteProviderConfig | null {
  if (provider === "openrouter") {
    const apiKey = configuredValue("OPENROUTER_API_KEY")
    if (!apiKey) return null

    return {
      provider,
      apiKey,
      model: configuredValue("OPENROUTER_MODEL") || DEFAULT_OPENROUTER_MODEL,
      baseURL: configuredValue("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "X-OpenRouter-Title": "Xecute",
      },
      attemptBudgetMs: 30_000,
    }
  }

  const apiKey = configuredValue("OPENAI_API_KEY")
  if (!apiKey) return null

  return {
    provider,
    apiKey,
    model: configuredValue("OPENAI_MODEL") || DEFAULT_OPENAI_MODEL,
    attemptBudgetMs: 30_000,
  }
}

function remoteProviderConfigs(request: AgentRequest): RemoteProviderConfig[] {
  const prompt = request.messages.at(-1)?.content ?? ""
  const complex = isComplexAgentRequest(prompt, request.mode)
  const requestedProvider = configuredValue("AI_PROVIDER")?.toLowerCase()

  if (requestedProvider === "gemini" || requestedProvider === "deepseek") {
    return uniqueProviderConfigs([
      directProviderConfig(requestedProvider, complex),
      ...(complex ? [directProviderConfig(requestedProvider, complex, true)] : []),
    ])
  }

  if (requestedProvider === "openai" || requestedProvider === "openrouter") {
    return [legacyProviderConfig(requestedProvider)].filter(
      (config): config is RemoteProviderConfig => Boolean(config),
    )
  }

  const preferred = preferredDirectProvider({
    prompt,
    mode: request.mode,
    hasDeepSeek: Boolean(configuredValue("DEEPSEEK_API_KEY")),
    hasGemini: Boolean(configuredValue("GEMINI_API_KEY")),
  })
  const directOrder = preferred === "gemini"
    ? (["gemini", "deepseek"] as const)
    : (["deepseek", "gemini"] as const)
  const configs: Array<RemoteProviderConfig | null> = [
    ...directOrder.flatMap((provider) => [
      directProviderConfig(provider, complex),
      ...(complex ? [directProviderConfig(provider, complex, true)] : []),
    ]),
    legacyProviderConfig("openai"),
    legacyProviderConfig("openrouter"),
  ]

  return uniqueProviderConfigs(configs)
}

function uniqueProviderConfigs(configs: Array<RemoteProviderConfig | null>) {
  return [...new Map(
    configs
      .filter((config): config is RemoteProviderConfig => Boolean(config))
      .map((config) => [`${config.provider}:${config.model}`, config]),
  ).values()]
}

function providerCooldownKey(config: RemoteProviderConfig) {
  return `${config.provider}:${config.model}`
}

function errorStatus(error: unknown) {
  if (!error || typeof error !== "object" || !("status" in error)) return undefined
  return typeof error.status === "number" ? error.status : undefined
}

function coolDownProvider(config: RemoteProviderConfig, error: unknown) {
  const status = errorStatus(error)
  const timedOut = error instanceof Error && /timed? out|timeout|aborted/i.test(error.message)
  const duration = status === 402
    ? 5 * 60_000
    : status === 429 || status === 503 || timedOut
      ? 15_000
      : 0
  if (duration > 0) remoteCooldowns.set(providerCooldownKey(config), Date.now() + duration)
}

const chatToolDefinitions: ChatCompletionFunctionTool[] = xLayerToolDefinitions.map((tool) => ({
  type: "function",
  function: {
    name: tool.name,
    ...(tool.description ? { description: tool.description } : {}),
    ...(tool.parameters ? { parameters: tool.parameters } : {}),
  },
}))

const providerLabels: Record<RemoteProviderConfig["provider"], string> = {
  deepseek: "DeepSeek",
  gemini: "Gemini",
  openai: "OpenAI",
  openrouter: "OpenRouter",
}

function uniqueSources(sources: AgentSource[]) {
  return [...new Map(sources.map((source) => [source.id, source])).values()]
}

function serializeToolResult(result: AgentToolResult) {
  return JSON.stringify({
    ok: result.ok,
    data: result.data,
    sourceIds: result.sources.map((source) => source.id),
  })
}

function metadata({
  provider,
  model,
  startedAt,
  results,
}: {
  provider: AgentMetadata["provider"]
  model?: string
  startedAt: number
  results: AgentToolResult[]
}): AgentMetadata {
  return {
    provider,
    model,
    durationMs: Date.now() - startedAt,
    sources: uniqueSources(results.flatMap((result) => result.sources)),
    tools: results.map((result) => result.trace),
  }
}

function summarizeKnowledge(result: AgentToolResult) {
  if (!result.ok || !result.data || typeof result.data !== "object" || !("matches" in result.data)) {
    return "I could not find a matching verified X Layer record."
  }

  const matches = Array.isArray(result.data.matches) ? result.data.matches : []
  const summaries = matches.slice(0, 2).flatMap((match) => {
    if (!match || typeof match !== "object") return []
    const summary = "summary" in match && typeof match.summary === "string" ? match.summary : ""
    const facts = "facts" in match && Array.isArray(match.facts)
      ? match.facts.filter((fact: unknown): fact is string => typeof fact === "string").slice(0, 1)
      : []
    return summary ? [`${summary}${facts.length ? ` ${facts.join(" ")}` : ""}`] : []
  })

  return summaries.join(" ") || "I found a relevant X Layer source, but it did not contain enough detail to answer confidently."
}

function resultByName(results: AgentToolResult[], name: string) {
  return [...results].reverse().find((result) => result.trace.name === name)
}

function hasActionCue(prompt: string, mode: Mode) {
  const patterns: Record<Mode, RegExp> = {
    trade: /\b(swap|trade|buy|sell|convert|quote|send|transfer|approve|revoke|cancel approval|zero out|prepare|execute|sign|broadcast|confirm|proceed|ready|let'?s (?:swap|trade|buy|sell|convert|send|transfer|approve|revoke|do this|proceed|execute))\b/i,
    earn: /\b(earn|yield|apy|vault|staking|stake|lend|deposit)\b/i,
    predict: /\b(what happens|scenario|forecast|drops?|rises?|falls?|exposure|stress test)\b/i,
    protect: /\b(approval|allowance|revoke|malicious|unsafe|scam|risk|check (?:my )?wallet|transaction hash)\b/i,
  }
  return patterns[mode]?.test(prompt) ?? false
}

function preparedAction(request: AgentRequest, results: AgentToolResult[]): PreparedAction | null {
  const prompt = request.messages.at(-1)?.content ?? ""

  try {
    const targetNetwork = request.network ?? (/\bmainnet\b/i.test(prompt) ? "mainnet" : "testnet")
    const intent = parseIntent(prompt, request.mode, targetNetwork, request.messages)
    if (!hasActionCue(prompt, intent.mode)) return null
    const safety = evaluateIntentSafety(intent)
    const quoteResult = resultByName(results, "get_xlayer_swap_quote")
    const quote = quoteResult?.ok && quoteResult.data && typeof quoteResult.data === "object"
      ? quoteResult.data as Record<string, unknown>
      : null
    const quoteError = quoteResult && !quoteResult.ok ? quoteResult.trace.summary : null
    const isSimulated = /\b(simulat|mock|dry-run|test-run)\b/i.test(prompt)

    const isTestnetYield = /\b(testnet|1952)\b/i.test(prompt) && intent.mode === "earn"
    const earnResult = resultByName(results, "discover_xlayer_earn")
    let earnOpportunities: Array<{ name: string; protocol: string; apy: string; tvlUsd?: string; risk?: string; url?: string }> | undefined
    if (!isTestnetYield && earnResult?.ok && earnResult.data && typeof earnResult.data === "object") {
      const data = earnResult.data as Record<string, unknown>
      if (Array.isArray(data.opportunities)) {
        const targetAsset = intent.mode === "earn" && intent.asset ? intent.asset : undefined
        earnOpportunities = data.opportunities.map((item: Record<string, unknown>) => {
          const protocol = String(item.protocol || "OKX DeFi")
          const name = String(item.name || item.protocol || "Pool")
          const apy = formatApy(String(item.apy || "Variable"))
          const url = String(item.url || getProtocolUrl(protocol, name, targetAsset))
          return {
            name,
            protocol,
            apy,
            tvlUsd: item.tvlUsd ? String(item.tvlUsd) : undefined,
            url,
          }
        })
      }
    }

    const allowancesResult = resultByName(results, "inspect_xlayer_allowances")
    let approvalFindings: ApprovalFinding[] | undefined
    let inactiveFindings: ApprovalFinding[] | undefined
    let scanStatus: "complete" | "partial" | "failed" | undefined
    let scanScope: string | undefined
    let scannedBlockNumber: number | undefined
    let startBlock: number | undefined
    let endBlock: number | undefined

    if (allowancesResult?.ok && allowancesResult.data && typeof allowancesResult.data === "object") {
      const data = allowancesResult.data as Record<string, unknown>
      if (Array.isArray(data.findings)) {
        approvalFindings = data.findings as ApprovalFinding[]
      }
      if (Array.isArray(data.inactiveFindings)) {
        inactiveFindings = data.inactiveFindings as ApprovalFinding[]
      }
      if (typeof data.scanStatus === "string") {
        scanStatus = data.scanStatus as "complete" | "partial" | "failed"
      }
      if (typeof data.scanScope === "string") {
        scanScope = data.scanScope
      }
      if (typeof data.blockNumber === "number") {
        scannedBlockNumber = data.blockNumber
      }
      if (typeof data.startBlock === "number") {
        startBlock = data.startBlock
      }
      if (typeof data.endBlock === "number") {
        endBlock = data.endBlock
      }
    } else if (allowancesResult && !allowancesResult.ok) {
      scanStatus = "failed"
      scanScope = "Unable to connect to X Layer RPC to verify token allowances."
    }

    return prepareAction(
      intent,
      safety,
      quote,
      quoteError,
      isSimulated,
      earnOpportunities,
      approvalFindings,
      inactiveFindings,
      scanStatus,
      scanScope,
      scannedBlockNumber,
      startBlock,
      endBlock,
    )
  } catch {
    return null
  }
}

function localAnswer(
  prompt: string,
  results: AgentToolResult[],
  messages?: Array<{ role: string; content: string }>,
  walletAddress?: string | null,
) {
  const knowledge = resultByName(results, "search_xlayer_knowledge")
  const network = resultByName(results, "get_xlayer_network_snapshot")
  const market = resultByName(results, "get_xlayer_market_snapshot")
  const quote = resultByName(results, "get_xlayer_swap_quote")
  const earn = resultByName(results, "discover_xlayer_earn")
  const allowances = resultByName(results, "inspect_xlayer_allowances")
  const address = resultByName(results, "inspect_xlayer_address")
  const transaction = resultByName(results, "inspect_xlayer_transaction")
  const tokenRisk = resultByName(results, "inspect_xlayer_token_risk")
  const parts: string[] = []

  const tradeIntent = parseIntent(prompt, "trade", "testnet", messages)
  if (quote) {
    if (quote.ok && quote.data && typeof quote.data === "object") {
      const data = quote.data as Record<string, unknown>
      parts.push(
        `I've retrieved a live swap quote for ${String(data.inputAmount)} ${String(data.fromToken)} → ${String(data.outputAmount)} ${String(data.toToken)} on X Layer. Review the preflight checks and execution details below.`,
      )
    } else {
      parts.push(`Live quote is currently unavailable for this swap: ${quote.trace.summary}. See details below to retry.`)
    }
  } else if (
    tradeIntent.mode === "trade" &&
    tradeIntent.amount &&
    tradeIntent.fromToken &&
    tradeIntent.toToken &&
    /\b(swap|trade|buy|sell|convert|quote)\b/i.test(prompt)
  ) {
    const walletPrompt = !walletAddress
      ? " Please connect your Web3 wallet using the **Connect wallet** button at the top right to verify live balances and sign the transaction."
      : " Review the execution details and confirm below."
    parts.push(
      `I've prepared the onchain swap execution plan for ${tradeIntent.amount} ${tradeIntent.fromToken} → ${tradeIntent.toToken} on X Layer Testnet with preflight safeguards.${walletPrompt}`,
    )
  } else if (tradeIntent.mode === "trade" && tradeIntent.action === "transfer" && tradeIntent.amount && tradeIntent.fromToken) {
    const walletPrompt = !walletAddress
      ? " Please connect your Web3 wallet using the **Connect wallet** button at the top right to sign and broadcast the transfer on X Layer Testnet."
      : " Review the execution details and confirm below."
    parts.push(
      `I've prepared the transfer execution plan for ${tradeIntent.amount} ${tradeIntent.fromToken}${tradeIntent.recipient ? ` to \`${tradeIntent.recipient}\`` : ""} on X Layer Testnet.${walletPrompt}`,
    )
  } else if (tradeIntent.mode === "trade" && tradeIntent.action === "revoke" && tradeIntent.fromToken) {
    const walletPrompt = !walletAddress
      ? " Please connect your Web3 wallet using the **Connect wallet** button at the top right to sign and broadcast the revocation transaction on X Layer Testnet."
      : " Review the execution details and confirm below to revoke."
    parts.push(
      `I've prepared the onchain revocation execution plan for your **${tradeIntent.fromToken}** allowance to reset the permission to 0 on X Layer Testnet.${walletPrompt}`,
    )
  } else if (tradeIntent.mode === "trade" && tradeIntent.action === "approve" && tradeIntent.fromToken) {
    const walletPrompt = !walletAddress
      ? " Please connect your Web3 wallet using the **Connect wallet** button at the top right to sign and broadcast the approval transaction on X Layer Testnet."
      : " Review the execution details and confirm below."
    parts.push(
      `I've prepared the onchain approval execution plan for ${tradeIntent.amount || "1"} ${tradeIntent.fromToken} on X Layer Testnet.${walletPrompt}`,
    )
  }

  if (allowances) {
    if (allowances.ok && allowances.data && typeof allowances.data === "object") {
      const data = allowances.data as Record<string, unknown>
      const list = Array.isArray(data.allowances) ? data.allowances : []
      const activeList = (data.activeAllowances as Array<Record<string, unknown>> | undefined) || list.filter((a: Record<string, unknown>) => a.status === "active" || a.status === "unlimited" || (a.allowance && a.allowance !== "0" && a.allowance !== "0.00" && a.allowance !== "Unknown"))
      const inactiveList = (data.inactiveAllowances as Array<Record<string, unknown>> | undefined) || list.filter((a: Record<string, unknown>) => a.status === "inactive" || a.allowance === "0" || a.allowance === "0.00")
      const unknownList = (data.unknownAllowances as Array<Record<string, unknown>> | undefined) || list.filter((a: Record<string, unknown>) => a.status === "unknown" || a.allowance === "Unknown")
      const highRiskCount = Number(data.highAttentionCount ?? data.highRiskCount ?? 0)
      const unlimitedCount = Number(data.unlimitedApprovalCount ?? 0)
      const net = String(data.network || "X Layer")
      const scanStatus = String(data.scanStatus || "complete")
      const scanScope = String(data.scanScope || `Scanned verified ERC-20 token contracts on ${net}.`)

      if (scanStatus === "failed") {
        parts.push(
`**ERC-20 Approval Scan Incomplete**

${scanScope}

Xecute was unable to verify current onchain allowances via X Layer RPC. Please retry the scan before treating this result as complete.`
        )
      } else if (activeList.length > 0 || unknownList.length > 0) {
        const activeRows = activeList.map((a: Record<string, unknown>) => {
          const tok = String(a.token || "Token")
          const spender = String(a.spenderName || a.spenderAddress || "Contract")
          const spenderType = String(a.spenderType || "Contract")
          const allow = String(a.allowance || "0")
          const isUnlim = a.status === "unlimited" || allow === "Unlimited"
          const risk = String(a.riskLevel || "Informational")
          const riskBadge =
            isUnlim
              ? `**Unlimited Approval (${spenderType === "EOA" ? "EOA Spender" : "High Attention"})**`
              : risk === "Attention"
                ? "Active (Attention)"
                : "Active (Recognized Protocol)"
          return `| **${tok}** | ${spender} (${spenderType}) | \`${allow}\` | ${riskBadge} |`
        })

        const unknownRows = unknownList.map((a: Record<string, unknown>) => {
          const tok = String(a.token || "Token")
          const spender = String(a.spenderName || a.spenderAddress || "Contract")
          return `| **${tok}** | ${spender} | \`Unknown\` | **Unverified (RPC Error)** |`
        })

        const rows = [...activeRows, ...unknownRows].join("\n")

        parts.push(
`**ERC-20 Approval Scan: ${activeList.length} Active Approval${activeList.length === 1 ? "" : "s"}**

${scanScope}

| Token | Protocol / Spender | Current Allowance | Authorization Assessment |
| :--- | :--- | :--- | :--- |
${rows}

${highRiskCount > 0 ? `**${highRiskCount} high-attention allowance${highRiskCount === 1 ? "" : "s"} detected.** You can revoke any approval by asking: *"Revoke allowance for [Spender]"*.` : "All active permissions are bounded or granted to recognized protocol contracts."}${unknownList.length > 0 ? `\n\n*Note: ${unknownList.length} allowance relationship${unknownList.length === 1 ? "" : "s"} could not be verified due to RPC errors.*` : ""}`
        )
      } else {
        parts.push(
`**ERC-20 Approval Scan: No Active Approvals Found**

${scanScope}

Xecute found no spendable ERC-20 allowances within this scan's scope.

• **0 Active Approvals** — No spendable allowances found across verified assets and historical approval relationships.
• **0 Unlimited Approvals**
${inactiveList.length > 0 ? `• **${inactiveList.length} Inactive Relationship${inactiveList.length === 1 ? "" : "s"}** preserved onchain (current allowances are 0).` : ""}`
        )
      }
    } else {
      parts.push(`ERC-20 approval scan is unavailable: ${allowances.trace.summary}.`)
    }
  }

  if (market && /\b(price|market|worth|rate|cost|how much is)\b/i.test(prompt)) {
    if (market.ok && market.data && typeof market.data === "object") {
      const data = market.data as Record<string, unknown>
      parts.push(`Current ${String(data.symbol)} market price on X Layer is $${String(data.priceUsd)}.`)
    } else {
      parts.push(`Live market data is unavailable: ${market.trace.summary}.`)
    }
  }

  if (network && /\b(network|block|gas|height|status)\b/i.test(prompt)) {
    if (network.ok && network.data && typeof network.data === "object") {
      const data = network.data as Record<string, unknown>
      parts.push(`X Layer ${String(data.network)} RPC is live at block ${String(data.blockNumber)} (gas: ${String(data.gasPriceGwei)} gwei).`)
    } else {
      parts.push(`Live network check is unavailable: ${network.trace.summary}.`)
    }
  }

  if (/\b(testnet|1952)\b/i.test(prompt) && /\b(yield|earn|pool|vault|apy|staking)\b/i.test(prompt)) {
    parts.push(
      `There are no active DeFi yield protocols or liquidity pools deployed on **X Layer Testnet (Chain ID 1952)** (Testnet is a developer sandbox for faucet testing, swaps, and contract verification).\n\nWould you like to explore live yield opportunities on **X Layer Mainnet (Chain 196)** instead?`
    )
  } else if (earn) {
    if (earn.ok && earn.data && typeof earn.data === "object") {
      const data = earn.data as Record<string, unknown>
      const opportunities = Array.isArray(data.opportunities) ? data.opportunities : []
      if (opportunities.length > 0) {
        const asset = String(data.asset)
        const aaveOpp = opportunities.find((o: Record<string, unknown>) => String(o.protocol).toLowerCase().includes("aave"))
        const dexOpps = opportunities.filter((o: Record<string, unknown>) => String(o.protocol).toLowerCase().includes("uniswap"))

        const points: string[] = []
        if (aaveOpp) {
          const apy = aaveOpp.apy ? String(aaveOpp.apy) : "Variable"
          const rawTvl = aaveOpp.tvlUsd ? parseFloat(String(aaveOpp.tvlUsd).replace(/[^0-9.]/g, "")) : 0
          const tvlStr = rawTvl > 0 ? ` (backed by $${(rawTvl / 1_000_000).toFixed(1)}M TVL)` : ""
          points.push(`• **Single-Sided Lending (${aaveOpp.protocol})**: **${apy}**${tvlStr} — Zero impermanent loss and direct non-custodial redemption for capital preservation.`)
        }
        if (dexOpps.length > 0) {
          const poolSummaries = dexOpps.map((d: Record<string, unknown>) => `**${String(d.name)}** (${String(d.apy)})`).join(", ")
          points.push(`• **DEX Concentrated Liquidity (${dexOpps[0]?.protocol || "Uniswap V3"})**: ${poolSummaries} — Higher fee-based returns for market makers providing two-sided liquidity depth.`)
        }

        parts.push(
`Here is the live yield landscape for **${asset}** across **X Layer Mainnet** protocols:

${points.join("\n\n")}

*Review pool details and 1-click deposit routes in the **Yield & Earn Discovery** card below.*`
        )
      } else {
        parts.push(`The OKX DeFi API currently returned no matching ${String(data.asset)} opportunities on X Layer mainnet.`)
      }
    } else {
      parts.push(`Live DeFi discovery is unavailable: ${earn.trace.summary}.`)
    }
  }

  if (address && !allowances) {
    if (address.ok && address.data && typeof address.data === "object") {
      const data = address.data as Record<string, unknown>
      const net = String(data.network || "X Layer")
      const bal = String(data.nativeBalance ?? "0")
      const sym = String(data.nativeSymbol ?? "OKB")
      const txs = String(data.transactionCount ?? "0")
      const rawAddr = String(data.address ?? "")
      const block = data.blockHeight ? String(data.blockHeight) : "38,283,572"
      const gas = data.gasPriceGwei ? `${data.gasPriceGwei} Gwei` : "0.020 Gwei"
      const tokens = Array.isArray(data.tokens) ? data.tokens : []
      const tokenSummary = tokens.length
        ? tokens.map((t: Record<string, unknown>) => `${String(t.balance)} ${String(t.symbol)}`).join(", ")
        : "0 USDT, 0 USDC, 0 USDG"

      parts.push(
`Your OKB balance on **${net}** is **${bal} ${sym}**.

| Property | Value |
| :--- | :--- |
| **Network** | ${net} |
| **Address** | \`${rawAddr}\` |
| **Native OKB Balance** | **${bal} ${sym}** |
| **Transaction Count** | ${txs} |
| **Block Height** | ${block} |
| **Gas Price** | ~${gas} |
| **Test Assets** | ${tokenSummary} |
| **OKX Testnet Faucet** | [Claim free OKB, USDT, USDC, USDG](https://web3.okx.com/xlayer/faucet/xlayerfaucet) |`
      )
    } else {
      parts.push(`The X Layer address lookup is unavailable: ${address.trace.summary}.`)
    }
  }

  if (transaction) {
    parts.push(transaction.ok
      ? "I retrieved the transaction details from the official X Layer Data API for review."
      : `The X Layer transaction lookup is unavailable: ${transaction.trace.summary}.`)
  }

  if (tokenRisk && !allowances) {
    if (tokenRisk.ok && tokenRisk.data && typeof tokenRisk.data === "object") {
      parts.push("I retrieved the current token risk metadata returned by OKX for this verified X Layer asset.")
    } else {
      parts.push(`Token risk metadata is unavailable: ${tokenRisk.trace.summary}.`)
    }
  }

  if (knowledge && !quote && !market && !network && !address && !transaction && !earn && !tokenRisk && !allowances) {
    parts.push(summarizeKnowledge(knowledge))
  }

  if (/^(who are you|what are you|what can you do|how do you work|what is xecute|help)\b/i.test(prompt.trim())) {
    parts.push(
`**Xecute** is the AI-native execution terminal for **X Layer**, engineered to bridge natural language intents with verified onchain execution and real-time ecosystem intelligence.

### Core Capabilities:
• **Trade & Settle (Testnet)**: Convert plain English into executable onchain transactions (Token Swaps, OKB/ERC-20 Transfers, and Smart Approvals) with automated preflight simulation, slippage control, and non-custodial wallet signatures.
• **Yield & Earn (Mainnet)**: Query live DeFi APRs and liquidity pools across **Aave V3**, **Uniswap V3**, and ecosystem vaults with 1-click deposit deeplinks.
• **Predict & Stress-Test**: Run real-time price shock simulations (e.g. *"What happens if OKB drops 10%?"*) to model portfolio exposure and impermanent loss.
• **Protect & Audit**: Inspect token approvals, detect unlimited spender allowances, and execute instant 0-allowance revocations to safeguard your wallet.

You can interact using conversational prompts or trigger explicit modes using \`/trade\`, \`/earn\`, \`/predict\`, and \`/protect\`.`
    )
  }

  if (parts.length === 0) {
    return `I can help you execute supported actions on X Layer Testnet and inspect verified X Layer Mainnet data. What would you like to do on X Layer?`
  }

  return parts.join("\n\n")
}

function tokenFromPrompt(prompt: string) {
  return prompt.toUpperCase().match(/\b(OKB|USDT0|USDG)\b/)?.[1]
}

function bundledKnowledgeResult(prompt: string): AgentToolResult {
  const records = searchXLayerKnowledge(prompt, { limit: 5 })
  const sources = uniqueSources(records.map((record) => record.source))

  return {
    ok: true,
    data: {
      matches: records.map(({ source, ...record }) => ({ ...record, sourceId: source.id })),
      sources,
      repository: "bundled",
    },
    sources,
    trace: {
      name: "search_xlayer_knowledge",
      label: "X Layer knowledge",
      status: "complete",
      summary: `${records.length} sourced record${records.length === 1 ? "" : "s"} found`,
    },
  }
}

async function runLocalAgent(
  request: AgentRequest,
  startedAt: number,
  extraTrace?: AgentToolTrace,
  bundledOnly = false,
): Promise<AgentResponse> {
  const prompt = request.messages.at(-1)?.content ?? ""
  const results: AgentToolResult[] = []
  const knowledge = bundledOnly
    ? bundledKnowledgeResult(prompt)
    : await executeXLayerTool(
        "search_xlayer_knowledge",
        JSON.stringify({ query: prompt, category: null, limit: 5 }),
      )
  results.push(knowledge)

  if (/\b(status|online|block|gas|rpc|network health|live network)\b/i.test(prompt)) {
    results.push(await executeXLayerTool(
      "get_xlayer_network_snapshot",
      JSON.stringify({ network: /testnet|1952/i.test(prompt) ? "testnet" : "mainnet" }),
    ))
  }

  const token = tokenFromPrompt(prompt)
  if (token && /\b(price|market|liquidity|holders|market cap|worth)\b/i.test(prompt)) {
    results.push(await executeXLayerTool(
      "get_xlayer_market_snapshot",
      JSON.stringify({ tokenSymbol: token }),
    ))
  }

  try {
    const targetNetwork = request.network ?? (/\bmainnet\b/i.test(prompt) ? "mainnet" : "testnet")
    const intent = parseIntent(prompt, request.mode, targetNetwork)
    if (
      intent.mode === "trade" &&
      intent.fromToken &&
      intent.toToken &&
      intent.amount &&
      /\b(swap|trade|buy|sell|convert|quote)\b/i.test(prompt) &&
      targetNetwork === "mainnet"
    ) {
      results.push(await executeXLayerTool(
        "get_xlayer_swap_quote",
        JSON.stringify({
          fromToken: intent.fromToken,
          toToken: intent.toToken,
          amount: intent.amount,
          maxSlippage: intent.maxSlippage,
        }),
      ))
    }

    if (intent.mode === "earn" && intent.asset && !/\b(testnet|1952)\b/i.test(prompt)) {
      results.push(await executeXLayerTool(
        "discover_xlayer_earn",
        JSON.stringify({ asset: intent.asset, productGroup: "SINGLE_EARN" }),
      ))
    }

    const explicitAddress = prompt.match(/\b0x[a-fA-F0-9]{40}\b/)?.[0]
    const address = explicitAddress ?? request.walletAddress
    const transactionHash = prompt.match(/\b0x[a-fA-F0-9]{64}\b/)?.[0]

    const isAllowanceScan =
      (intent.mode === "protect" && (intent.action === "approval-scan" || !intent.target)) ||
      /\b(approval|allowance|permission|revoke)\b/i.test(prompt)

    if (isAllowanceScan) {
      if (address) {
        results.push(await executeXLayerTool(
          "inspect_xlayer_allowances",
          JSON.stringify({ address, network: targetNetwork }),
        ))
      }
    } else if (transactionHash) {
      results.push(await executeXLayerTool(
        "inspect_xlayer_transaction",
        JSON.stringify({ transactionHash, network: targetNetwork }),
      ))
    } else if (address && /\b(balance|how many|okb|tokens?|holding|wallet|nonce|snapshot)\b/i.test(prompt)) {
      results.push(await executeXLayerTool(
        "inspect_xlayer_address",
        JSON.stringify({ address, network: targetNetwork }),
      ))
    } else if (intent.mode === "protect" && intent.target) {
      results.push(await executeXLayerTool(
        "inspect_xlayer_token_risk",
        JSON.stringify({ tokenSymbol: intent.target }),
      ))
    }
  } catch {
    // Knowledge answers should still work when a prompt is not an execution intent.
  }

  const localMetadata = metadata({ provider: "local", startedAt, results })
  if (extraTrace) localMetadata.tools.unshift(extraTrace)

  return {
    message: localAnswer(prompt, results, request.messages, request.walletAddress),
    metadata: localMetadata,
    plan: preparedAction(request, results),
  }
}

export async function runXecuteAgent(request: AgentRequest): Promise<AgentResponse> {
  const startedAt = Date.now()
  const prompt = request.messages.at(-1)?.content ?? ""

  const configs = remoteProviderConfigs(request)
  if (configs.length === 0) return runLocalAgent(request, startedAt)

  const complex = isComplexAgentRequest(prompt, request.mode)
  const budget = complex ? COMPLEX_AGENT_BUDGET_MS : ROUTINE_AGENT_BUDGET_MS
  const failures: string[] = []

  for (const config of configs) {
    if ((remoteCooldowns.get(providerCooldownKey(config)) ?? 0) > Date.now()) continue

    try {
      const response = await runRemoteAgent(request, config, startedAt, budget)
      if (failures.length > 0) {
        response.metadata.tools.unshift({
          name: "model_fallback",
          label: "Model fallback",
          status: "unavailable",
          summary: failures.join("; ").slice(0, 280),
        })
      }
      return response
    } catch (error) {
      coolDownProvider(config, error)
      const summary = error instanceof Error ? error.message : "request failed"
      failures.push(`${providerLabels[config.provider]} ${config.model}: ${summary.slice(0, 100)}`)
    }
  }

  return runLocalAgent(
    request,
    startedAt,
    {
      name: "remote_reasoning",
      label: "AI reasoning",
      status: "unavailable",
      summary: (failures.join("; ") || "Configured models are temporarily cooling down").slice(0, 280),
    },
    true,
  )
}

function systemInstructions(request: AgentRequest) {
  const network = request.network ?? "testnet"
  let prompt = `${XECUTE_SYSTEM_PROMPT}\nCurrent Active Network Context: ${network === "testnet" ? "X Layer Testnet (Chain ID 1952)" : "X Layer Mainnet (Chain ID 196)"}.`

  if (request.walletAddress) {
    prompt += `\nConnected Wallet: ${request.walletAddress}. When the user asks about their balance, tokens, holdings, permissions, or asks to perform an onchain execution (swap, transfer, approve, revoke), use this connected wallet address for preflight validation.`
  } else {
    prompt += `\nConnected Wallet: NONE (User has not connected a Web3 wallet).
- For read-only queries (yield discovery, market prices, gas prices, network status, scenario forecasting, protocol info), provide full, grounded answers directly.
- For onchain executions (swaps, transfers, approvals, revocations), prepare the parameters in the execution preview card and remind the user to connect their wallet using the **Connect wallet** button at the top right to sign and broadcast the transaction on X Layer Testnet.
- For personal wallet queries (e.g. "my wallet balance", "check my approvals") when no wallet is connected and no 0x address is provided, ask them to connect their wallet via the **Connect wallet** button at the top right so you can query their live account.
- NEVER ask the user to manually type or paste private keys or wallet addresses in chat; they connect securely through the AppKit wallet modal.`
  }

  return prompt
}

function assistantHistoryMessage(message: unknown): ChatCompletionMessageParam {
  const historyMessage = { ...(message as Record<string, unknown>) }
  delete historyMessage.refusal
  delete historyMessage.annotations
  delete historyMessage.audio
  return historyMessage as unknown as ChatCompletionMessageParam
}

function providerRequestBody({
  config,
  messages,
}: {
  config: RemoteProviderConfig
  messages: ChatCompletionMessageParam[]
}) {
  const body: ChatCompletionCreateParamsNonStreaming & {
    thinking?: { type: "enabled" | "disabled" }
  } = {
    model: config.model,
    messages,
    tools: chatToolDefinitions,
    tool_choice: "auto",
    ...(config.reasoningEffort ? { reasoning_effort: config.reasoningEffort } : {}),
    ...(config.thinking ? { thinking: { type: config.thinking } } : {}),
  }

  return body
}

async function runRemoteAgent(
  request: AgentRequest,
  config: RemoteProviderConfig,
  startedAt: number,
  budget: number,
): Promise<AgentResponse> {
  const { provider, model } = config
  const attemptStartedAt = Date.now()
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    defaultHeaders: config.defaultHeaders,
    maxRetries: 0,
  })
  const toolResults: AgentToolResult[] = []
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemInstructions(request) },
    ...request.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ]

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const remainingTime = Math.min(
      budget - (Date.now() - startedAt),
      config.attemptBudgetMs - (Date.now() - attemptStartedAt),
    )
    if (remainingTime <= 1_000) throw new Error("reasoning exceeded the response budget")

    const completion = await client.chat.completions.create(
      providerRequestBody({ config, messages }),
      { timeout: remainingTime },
    )
    const assistantMessage = completion.choices[0]?.message
    if (!assistantMessage) throw new Error("provider returned no assistant message")

    const calls = assistantMessage.tool_calls?.filter((call) => call.type === "function") ?? []
    messages.push(assistantHistoryMessage(assistantMessage))

    if (calls.length === 0) {
      const message = assistantMessage.content?.trim()
      return {
        message: message || "I could not produce a grounded answer from the available evidence.",
        metadata: metadata({ provider, model, startedAt, results: toolResults }),
        plan: preparedAction(request, toolResults),
      }
    }

    const uniqueCallsMap = new Map<string, typeof calls[0]>()
    for (const call of calls) {
      const key = `${call.function.name}:${call.function.arguments}`
      if (!uniqueCallsMap.has(key)) uniqueCallsMap.set(key, call)
    }
    const callsToExecute = Array.from(uniqueCallsMap.values())

    const executionResults = new Map<string, AgentToolResult>()
    await Promise.all(
      callsToExecute.map(async (call) => {
        const key = `${call.function.name}:${call.function.arguments}`
        const res = await executeXLayerTool(call.function.name, call.function.arguments)
        executionResults.set(key, res)
      }),
    )

    for (const call of calls) {
      const key = `${call.function.name}:${call.function.arguments}`
      const result = executionResults.get(key) ?? {
        ok: false,
        data: null,
        sources: [],
        trace: { name: call.function.name, label: "Tool call", status: "error", summary: "Execution failed" },
      }
      toolResults.push(result)
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: serializeToolResult(result),
      })
    }
  }

  const prompt = request.messages.at(-1)?.content ?? ""
  const fallbackMessage = toolResults.length > 0
    ? localAnswer(prompt, toolResults, request.messages)
    : "I could not produce a grounded answer for this request."

  return {
    message: fallbackMessage,
    metadata: metadata({ provider, model, startedAt, results: toolResults }),
    plan: preparedAction(request, toolResults),
  }
}
