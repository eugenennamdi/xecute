import {
  EarnIntentSchema,
  type Intent,
  type Mode,
  PredictIntentSchema,
  ProtectIntentSchema,
  TradeIntentSchema,
} from "@/lib/intents"

const KNOWN_TOKENS = [
  "xUSDT",
  "xWETH",
  "xOKB",
  "USDT0",
  "USDT",
  "USDC",
  "WETH",
  "ETH",
  "WBTC",
  "BTC",
  "OKB",
  "WOKB",
]

function knownTokens(prompt: string) {
  const upperPrompt = prompt.toUpperCase()
  return KNOWN_TOKENS.filter((token) =>
    new RegExp(`\\b${token}\\b`, "i").test(upperPrompt),
  )
}

function extractAmount(prompt: string) {
  const cleanPrompt = prompt.replace(/,/g, "")
  return cleanPrompt.match(/\b(?:\d+\.?\d*|\.\d+)\b/)?.[0] ?? null
}

function extractTradeAmount(prompt: string) {
  const cleanPrompt = prompt.replace(/,/g, "")
  const amountWithKnownToken = cleanPrompt.match(
    new RegExp(`\\b(\\d+(?:\\.\\d+)?)\\s*(?:${KNOWN_TOKENS.join("|")})\\b`, "i"),
  )
  if (amountWithKnownToken?.[1]) return amountWithKnownToken[1]

  const amountWithAnyToken = cleanPrompt.match(
    /\b(?:swap|trade|send|transfer|approve|buy|sell|for|with)?\s*(?:all\s+)?(\d+(?:\.\d+)?)\s+([a-z][a-z0-9.]*)\b/i,
  )
  return amountWithAnyToken?.[1] ?? extractAmount(prompt)
}

function normalizeToken(token: string | null | undefined) {
  return token?.trim() ?? null
}

function extractNetwork(prompt: string, defaultNetwork: "testnet" | "mainnet" = "testnet") {
  if (/\b(mainnet|chain\s*id\s*196)\b/i.test(prompt)) return "mainnet" as const
  if (/\b(testnet|chain\s*id\s*1952|chain\s*id\s*195|xusdt|xweth)\b/i.test(prompt)) return "testnet" as const
  return defaultNetwork
}

function extractSlippage(prompt: string) {
  const percentBefore = prompt.match(
    /(?:max(?:imum)?\s+)?(\d+(?:\.\d+)?)\s*%\s*(?:max(?:imum)?\s*)?slippage/i,
  )
  const slippageBefore = prompt.match(
    /slippage(?:\s+(?:is|of|below|under|at|max(?:imum)?))?\s*(\d+(?:\.\d+)?)\s*%?/i,
  )
  return Number(percentBefore?.[1] ?? slippageBefore?.[1] ?? 0.5)
}

export function classifyIntent(prompt: string, fallback: Mode = "trade"): Mode {
  const text = prompt.toLowerCase()

  if (/\b(revoke|cancel approval)\b/.test(text)) {
    return "trade"
  }
  if (/\b(approval|allowance|malicious|unsafe|scam|risky approvals?)\b/.test(text) && !/\bapprove\s+\d+/i.test(text)) {
    return "protect"
  }
  if (/\b(earn|yield|apy|vault|staking|lend|deposit)\b/.test(text)) {
    return "earn"
  }
  if (/\b(what happens|scenario|forecast|sentiment|drops?|rises?|falls?|exposure)\b/.test(text)) {
    return "predict"
  }
  if (/\b(swap|trade|buy|sell|convert|route|slippage|→|->|send|transfer|approve)\b/.test(text)) {
    return "trade"
  }
  if (/\b(explain|check)\b.*\b(transaction|token|contract|wallet)\b/.test(text)) {
    return "protect"
  }

  return fallback
}

function parseTrade(
  prompt: string,
  defaultNetwork: "testnet" | "mainnet" = "testnet",
  history?: Array<{ role: string; content: string }>,
): Intent {
  const cleanPrompt = prompt.replace(/,/g, "")
  const text = prompt.toLowerCase()
  const ethAddress = prompt.match(/\b(0x[a-fA-F0-9]{40})\b/)?.[1] ?? null
  const tokens = knownTokens(prompt)

  // 1. Transfer Intent: Send / Transfer [Amount] [Token] to [0x...]
  if (/\b(send|transfer)\b/i.test(text)) {
    const transferMatch = cleanPrompt.match(
      /\b(?:send|transfer)\s+(?:(\d+(?:\.\d+)?)\s+)?([a-z][a-z0-9.]*)\s*(?:to\s+)?(0x[a-fA-F0-9]{40})?/i,
    )
    const amount = transferMatch?.[1] ?? extractAmount(prompt)
    const fromToken = normalizeToken(transferMatch?.[2] ?? tokens[0] ?? "OKB")
    const recipient = ethAddress

    return TradeIntentSchema.parse({
      mode: "trade",
      action: "transfer",
      rawPrompt: prompt,
      network: extractNetwork(prompt, defaultNetwork),
      fromToken,
      toToken: fromToken,
      recipient,
      amount,
      maxSlippage: 0.5,
      preserveGasBalance: true,
      requiresConfirmation: true,
    })
  }

  // 2. Approve Intent: Approve [Amount] [Token] for/to [0x...]
  if (/\b(approve)\b/i.test(text)) {
    const approveMatch = cleanPrompt.match(
      /\bapprove\s+(?:(\d+(?:\.\d+)?)\s+)?([a-z][a-z0-9.]*)\s*(?:for|to|spender\s+)?(0x[a-fA-F0-9]{40})?/i,
    )
    const amount = approveMatch?.[1] ?? extractAmount(prompt)
    const fromToken = normalizeToken(approveMatch?.[2] ?? tokens[0] ?? "USDT")
    const spender = ethAddress

    return TradeIntentSchema.parse({
      mode: "trade",
      action: "approve",
      rawPrompt: prompt,
      network: extractNetwork(prompt, defaultNetwork),
      fromToken,
      toToken: fromToken,
      spender,
      amount,
      maxSlippage: 0.5,
      preserveGasBalance: true,
      requiresConfirmation: true,
    })
  }

  // 3. Revoke Intent: Revoke [Token] access/approval for [0x...]
  if (/\b(revoke)\b/i.test(text)) {
    const fromToken = normalizeToken(tokens[0] ?? "USDT")
    const spender = ethAddress

    return TradeIntentSchema.parse({
      mode: "trade",
      action: "revoke",
      rawPrompt: prompt,
      network: extractNetwork(prompt, defaultNetwork),
      fromToken,
      toToken: fromToken,
      spender,
      amount: "0",
      maxSlippage: 0.5,
      preserveGasBalance: true,
      requiresConfirmation: true,
    })
  }

  // 4. Swap Intent (Default)
  const tokenPattern = `(?:${KNOWN_TOKENS.join("|")})`
  const directSwap = cleanPrompt.match(
    /\b(?:swap|trade|convert|sell)\s+(?:all\s+)?(?:(\d+(?:\.\d+)?)\s+)?([a-z][a-z0-9.]*)\s*(?:to|for|into|->|→)\s*([a-z][a-z0-9.]*)/i,
  )
  const planSwap = cleanPrompt.match(
    /\b(?:plan\s+(?:for\s+)?|prepare\s+(?:a\s+)?(?:confirmed\s+)?(?:swap\s+)?(?:plan\s+)?(?:for\s+)?)(?:all\s+)?(?:(\d+(?:\.\d+)?)\s+)?([a-z][a-z0-9.]*)\s*(?:to|for|into|->|→)\s*([a-z][a-z0-9.]*)/i,
  )
  const buyWith = cleanPrompt.match(
    /\bbuy\s+([a-z][a-z0-9.]*)\s+with\s+(?:(\d+(?:\.\d+)?)\s+)?([a-z][a-z0-9.]*)/i,
  )
  const arrowSwap = cleanPrompt.match(
    /(?:(\d+(?:\.\d+)?)\s+)?([a-z][a-z0-9.]*)\s*(?:->|→)\s*([a-z][a-z0-9.]*)/i,
  )

  let fromToken = normalizeToken(directSwap?.[2] ?? planSwap?.[2] ?? buyWith?.[3] ?? arrowSwap?.[2] ?? tokens[0])
  let toToken = normalizeToken(directSwap?.[3] ?? planSwap?.[3] ?? buyWith?.[1] ?? arrowSwap?.[3] ?? tokens[1])
  let amount = directSwap?.[1] ?? planSwap?.[1] ?? buyWith?.[2] ?? arrowSwap?.[1] ?? extractTradeAmount(prompt)

  // Contextual fallback from history if this is a follow-up or confirmation turn
  if (history && history.length > 0 && (!amount || !fromToken || !toToken)) {
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i]?.content ?? ""
      const cleanMsg = msg.replace(/,/g, "")
      const msgTokens = knownTokens(msg)

      const historySwapMatch = cleanMsg.match(
        new RegExp(`(?:(\\d+(?:\\.\\d+)?)\\s+)?(${tokenPattern})\\s*(?:to|for|into|->|→)\\s*(${tokenPattern})`, "i"),
      )
      if (historySwapMatch) {
        if (!amount && historySwapMatch[1]) amount = historySwapMatch[1]
        if (!fromToken && historySwapMatch[2]) fromToken = normalizeToken(historySwapMatch[2])
        if (!toToken && historySwapMatch[3]) toToken = normalizeToken(historySwapMatch[3])
      }

      if (!fromToken && msgTokens[0]) fromToken = normalizeToken(msgTokens[0])
      if (!toToken && msgTokens[1]) toToken = normalizeToken(msgTokens[1])

      if (!amount) {
        const historyAmount = extractTradeAmount(msg)
        if (historyAmount) amount = historyAmount
      }

      if (amount && fromToken && toToken) break
    }
  }

  return TradeIntentSchema.parse({
    mode: "trade",
    action: "swap",
    rawPrompt: prompt,
    network: extractNetwork(prompt, defaultNetwork),
    fromToken,
    toToken,
    amount,
    maxSlippage: extractSlippage(prompt),
    preserveGasBalance: /\b(gas|reserve|keep enough)\b/i.test(prompt),
    requiresConfirmation: true,
  })
}

function parseEarn(prompt: string, defaultNetwork: "testnet" | "mainnet" = "testnet"): Intent {
  const asset = knownTokens(prompt)[0] ?? null
  return EarnIntentSchema.parse({
    mode: "earn",
    action: "discover",
    rawPrompt: prompt,
    network: extractNetwork(prompt, defaultNetwork),
    asset,
    amount: extractAmount(prompt),
    riskPreference: /\blow[- ]?risk\b/i.test(prompt) ? "low" : "balanced",
    requiresConfirmation: false,
  })
}

function parsePredict(prompt: string, defaultNetwork: "testnet" | "mainnet" = "testnet"): Intent {
  const movement = prompt.match(/(?:drops?|falls?|rises?|moves?)\s+(\d+(?:\.\d+)?)\s*%/i)
  const isDown = /\b(drop|drops|fall|falls|down)\b/i.test(prompt)
  const change = movement ? Number(movement[1]) * (isDown ? -1 : 1) : null

  return PredictIntentSchema.parse({
    mode: "predict",
    action: "scenario",
    rawPrompt: prompt,
    network: extractNetwork(prompt, defaultNetwork),
    asset: knownTokens(prompt)[0] ?? null,
    changePercent: change,
    requiresConfirmation: false,
  })
}

function parseProtect(prompt: string, defaultNetwork: "testnet" | "mainnet" = "testnet"): Intent {
  const text = prompt.toLowerCase()
  const action = text.includes("approval") || text.includes("allowance")
    ? "approval-scan"
    : text.includes("token")
      ? "token-check"
      : "transaction-check"

  return ProtectIntentSchema.parse({
    mode: "protect",
    action,
    rawPrompt: prompt,
    network: extractNetwork(prompt, defaultNetwork),
    target: knownTokens(prompt)[0] ?? null,
    requiresConfirmation: false,
  })
}

export function parseIntent(
  prompt: string,
  fallback: Mode = "trade",
  defaultNetwork: "testnet" | "mainnet" = "testnet",
  history?: Array<{ role: string; content: string }>,
): Intent {
  const mode = classifyIntent(prompt, fallback)

  switch (mode) {
    case "earn":
      return parseEarn(prompt, defaultNetwork)
    case "predict":
      return parsePredict(prompt, defaultNetwork)
    case "protect":
      return parseProtect(prompt, defaultNetwork)
    default:
      return parseTrade(prompt, defaultNetwork, history)
  }
}
