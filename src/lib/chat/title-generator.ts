import type { Intent, Mode } from "@/lib/intents"

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      // Keep known crypto tickers uppercase
      if (/^(okb|usdt0|usdt|usdc|usdg|eth|btc|weth|wbtc|dex|defi|rpc|apr|apy|tvl|slippage)$/i.test(word)) {
        return word.toUpperCase()
      }
      if (/^(on|in|to|for|with|and|or|of|a|an|the)$/i.test(word) && index > 0) {
        return word.toLowerCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(" ")
}

export function generateConversationTitle(prompt: string, intent?: Intent | null, mode?: Mode): string {
  const clean = prompt.trim()
  if (!clean) return "New Conversation"

  // Check simple greetings
  if (/^(hi|hello|hey|gm|gn|good\s+(morning|afternoon|evening)|yo|sup)[\s!.]*$/i.test(clean)) {
    return "General Inquiry"
  }

  // 1. If we have a recognized structured Intent
  if (intent) {
    if (intent.mode === "trade") {
      if (intent.action === "transfer") {
        return `Transfer ${intent.amount ? `${intent.amount} ` : ""}${intent.fromToken ?? "OKB"}`
      }
      if (intent.action === "approve") {
        return `Approve ${intent.fromToken ?? "Token"}`
      }
      if (intent.action === "revoke") {
        return `Revoke ${intent.fromToken ?? "Token"} Allowance`
      }
      if (intent.fromToken && intent.toToken) {
        return `Swap ${intent.fromToken} to ${intent.toToken}`
      }
    }
    if (intent.mode === "earn" && intent.asset) {
      return `${intent.asset} Yield Strategy`
    }
    if (intent.mode === "predict" && intent.asset) {
      const change = typeof intent.changePercent === "number" ? ` ${intent.changePercent > 0 ? "+" : ""}${intent.changePercent}%` : ""
      return `${intent.asset}${change} Scenario Analysis`
    }
    if (intent.mode === "protect") {
      return "Wallet Risk & Approvals"
    }
  }

  // 2. Domain Keywords & Phrases
  const lower = clean.toLowerCase()

  if (/swap|trade|exchange|buy|sell/i.test(lower)) {
    const tokens = clean.match(/\b(OKB|USDT0|USDT|USDC|USDG|ETH|BTC|WBTC)\b/gi)
    if (tokens && tokens.length >= 2) {
      return `Swap ${tokens[0].toUpperCase()} to ${tokens[1].toUpperCase()}`
    }
    if (tokens && tokens.length === 1) {
      return `Trade ${tokens[0].toUpperCase()} on X Layer`
    }
    return "X Layer Trading Guide"
  }

  if (/yield|earn|apy|apr|pool|stake|staking|farm|farming|vault/i.test(lower)) {
    const token = clean.match(/\b(OKB|USDT0|USDT|USDC|USDG|ETH)\b/i)
    if (token) return `${token[0].toUpperCase()} Yield Strategy`
    return "X Layer Yield Opportunities"
  }

  if (/bridge|bridging|deposit|withdraw|l1|l2/i.test(lower)) {
    return "X Layer Bridge Guide"
  }

  if (/gas|fee|fees|cost|cheap|gwei/i.test(lower)) {
    return "X Layer Gas & Fees"
  }

  if (/approval|allowance|revoke|drain|hack|safe|risk|protect|audit/i.test(lower)) {
    return "Wallet Security & Approvals"
  }

  if (/drop|crash|pump|predict|scenario|stress|test|forecast/i.test(lower)) {
    const token = clean.match(/\b(OKB|USDT0|USDT|USDC|USDG|ETH)\b/i)
    if (token) return `${token[0].toUpperCase()} Market Scenario`
    return "Market Scenario Simulation"
  }

  if (/what is x layer|about x layer|how does x layer/i.test(lower)) {
    return "About X Layer"
  }

  if (/rpc|chain id|network|testnet|mainnet|explorer|contract/i.test(lower)) {
    return "X Layer Network & Tools"
  }

  // 3. Fallback: Clean Natural Language distillation
  const stripped = clean
    .replace(/^(\/trade|\/earn|\/predict|\/protect)\s*/i, "")
    .replace(/^(i\s+want\s+to|i\s+wanna|can\s+you|how\s+do\s+i|tell\s+me\s+about|what\s+is|what\s+are|where\s+can\s+i|show\s+me|help\s+me\s+with|please)\s+/i, "")
    .replace(/[?.!,:;]+$/g, "")
    .trim()

  if (!stripped) {
    if (mode === "trade") return "Trade Exploration"
    if (mode === "earn") return "Yield Exploration"
    if (mode === "predict") return "Scenario Modeling"
    if (mode === "protect") return "Risk Inspection"
    return "New Conversation"
  }

  const words = stripped.split(/\s+/)
  const truncated = words.slice(0, 5).join(" ")
  const title = toTitleCase(truncated)

  return title.length > 36 ? `${title.slice(0, 33)}...` : title
}
