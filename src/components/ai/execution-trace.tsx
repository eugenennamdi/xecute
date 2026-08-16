"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Sparkles } from "lucide-react"

import { ChevronDownIcon } from "@/components/ui/chevron-down"
import type { Intent, Mode } from "@/lib/intents"
import { cn } from "@/lib/utils"

const traceSteps: Record<Mode, string[]> = {
  trade: ["Understanding execution intent", "Checking X Layer reserves & gas", "Preparing deterministic action plan"],
  earn: ["Understanding asset criteria", "Checking DeFi sources", "Comparing available opportunity data"],
  predict: ["Understanding the scenario", "Checking market context", "Evaluating stated assumptions"],
  protect: ["Understanding the risk request", "Checking available wallet context", "Reviewing safety signals"],
}

function extractTokens(text: string): string[] {
  const matches: Array<{ token: string; index: number }> = []
  const candidates = ["USDT0", "USDG", "USDC", "USDT", "WOKB", "WETH", "OKB", "ETH", "BTC", "SOL"]
  for (const token of candidates) {
    const regex = new RegExp(`\\b${token}\\b`, "gi")
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      matches.push({ token, index: match.index })
    }
  }
  matches.sort((a, b) => a.index - b.index)
  // Deduplicate consecutive tokens
  return [...new Set(matches.map((m) => m.token))]
}

export function getProcessingLabel(
  mode: Mode,
  rawPrompt?: string,
  status?: string,
  intent?: Intent | null,
): string {
  // If the user has signed or confirmed and the transaction is actively executing/broadcasting:
  if (status === "confirming") {
    if (intent?.mode === "trade") {
      if (intent.action === "swap") {
        if (intent.fromToken && intent.toToken) {
          return `Executing swap (${intent.fromToken} → ${intent.toToken})`
        }
        return "Executing swap onchain"
      }
      if (intent.action === "transfer") {
        return "Broadcasting transfer onchain"
      }
      if (intent.action === "approve") {
        return `Submitting approval for ${intent.fromToken ?? "token"}`
      }
      if (intent.action === "revoke") {
        return `Revoking allowance for ${intent.fromToken ?? "token"}`
      }
    }
    return "Broadcasting transaction to X Layer"
  }

  const text = (rawPrompt ?? "").toLowerCase().trim()
  if (!text) {
    switch (mode) {
      case "earn":
        return "Scanning yield opportunities"
      case "predict":
        return "Simulating market scenario"
      case "protect":
        return "Auditing wallet permissions"
      default:
        return "Thinking"
    }
  }

  // 1. Conversational, Identity, Capabilities & Greetings
  if (
    /^(hi|hello|hey|gm|gn|good\s+(morning|afternoon|evening)|yo|sup|help|who\s+are\s+you|what\s+are\s+you|what\s+can\s+you\s+do|how\s+do\s+you\s+work|what\s+is\s+xecute|who\s+made\s+you|who\s+built\s+you|about\s+you|introduce\s+yourself|tell\s+me\s+about\s+yourself|capabilities)\b/i.test(
      text,
    )
  ) {
    return "Thinking"
  }

  // 2. Ecosystem, Architecture, Developer & General Documentation Inquiries
  if (
    /\b(what\s+is\s+x\s*layer|about\s+x\s*layer|how\s+does\s+x\s*layer|polygon\s+cdk|agglayer|zk-?rollup|zero[- ]knowledge|validium|finality|chain\s+id|rpc(\s+url)?|tokenomics|consensus|whitepaper|documentation|docs|metamask|walletconnect|appkit|developer|sdk)\b/i.test(
      text,
    )
  ) {
    return "Consulting X Layer knowledge base"
  }

  // 3. Bridging & Cross-chain Transfers
  if (/\b(bridge|bridging|deposit from ethereum|withdraw to ethereum|l1\s*(to|->)\s*l2|l2\s*(to|->)\s*l1)\b/i.test(text)) {
    return "Checking X Layer bridge guide"
  }

  // 4. Gas & Network Telemetry Queries
  if (/\b(gas price|current gas|gas fee|network status|network health|block height|latest block|rpc status|is x layer online|network snapshot)\b/i.test(text)) {
    return "Checking network gas & block status"
  }

  // 5. Balance, Holdings, Address Inspection
  if (/\b(balance|holding|portfolio|assets? in wallet|how much okb|how many tokens?)\b/i.test(text) || /^0x[a-f0-9]{40}/i.test(text)) {
    return "Inspecting wallet balances on X Layer"
  }

  // 6. Faucet Queries
  if (/\b(faucet|claim okb|test okb|free okb|testnet funds|testnet tokens)\b/i.test(text)) {
    return "Checking official testnet faucet"
  }

  // 7. Token Approvals & Security Audits
  if (/\b(approvals?|allowances?|revok(e|ing)|spenders?|unlimited allowance)\b/i.test(text)) {
    return "Auditing token approvals & allowances"
  }
  if (/\b(honeypots?|security|safety|safe|risk|audits?|malicious|drainers?|phishing)\b/i.test(text)) {
    return "Auditing contract security & risk"
  }

  // 8. Earn & DeFi Yield Pools
  if (/\b(yield|earn|apy|apr|staking|liquidity pool|vault|farm)\b/i.test(text)) {
    const found = extractTokens(text)
    if (found.length > 0) {
      return `Scanning yield pools for ${found[0]}`
    }
    return "Scanning DeFi yield opportunities"
  }

  // 9. Predictions & Market Scenario Stress Tests
  if (/\b(what if|predict|drops?|pumps?|crash|scenario|stress test|simulate|price shock|impermanent loss)\b/i.test(text)) {
    return "Modeling market scenario & risk"
  }

  // 10. Actual Token Swaps & Direct Quotes
  if (/\b(swap|trade|buy|sell|exchange|convert)\b/i.test(text)) {
    const foundTokens = extractTokens(text)
    if (foundTokens.length >= 2) {
      return `Finding best quote for ${foundTokens[0]} → ${foundTokens[1]}`
    }
    if (foundTokens.length === 1) {
      return `Finding live quote for ${foundTokens[0]}`
    }
    return "Analyzing liquidity & gas"
  }

  // 11. Transfers & Sends
  if (/\b(send|transfer)\b/i.test(text)) {
    return "Validating transfer & gas"
  }

  // 12. Token Price & Market Data
  if (/\b(price of|market cap|volume|chart|worth|value of okb|token price)\b/i.test(text)) {
    return "Fetching real-time market data"
  }

  // 13. General Explanatory Questions (How do I, Why is, Where can I, Can you, Tell me)
  if (/^(how|what|why|where|when|can|could|is|are|will|explain|tell|show)\b/i.test(text)) {
    return "Thinking"
  }

  // Fallback by mode
  switch (mode) {
    case "earn":
      return "Scanning yield opportunities"
    case "predict":
      return "Simulating market scenario"
    case "protect":
      return "Auditing wallet permissions"
    case "trade":
      return /\b(0x|[0-9]+)\b/.test(text) ? "Analyzing liquidity & gas" : "Thinking"
    default:
      return "Thinking"
  }
}

export function ProcessingTrace({
  mode,
  prompt,
  status,
  intent,
}: {
  mode: Mode
  prompt?: string
  status?: string
  intent?: Intent | null
}) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const started = Date.now()
    const interval = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 100))
    }, 100)
    return () => window.clearInterval(interval)
  }, [status])

  const seconds = (elapsed / 10).toFixed(1)
  const label = useMemo(() => getProcessingLabel(mode, prompt, status, intent), [mode, prompt, status, intent])

  // 3x3 grid animation staggered phase offsets (in ms)
  const pixelDelays = [90, 180, 270, 0, 90, 180, 90, 180, 270]

  return (
    <div className="flex items-center gap-2.5 py-1" role="status" aria-live="polite">
      <span className="sr-only">Xecute is thinking about your {mode} request</span>
      <span aria-hidden="true" className="grid grid-cols-[repeat(3,4px)] gap-[1.5px]">
        {pixelDelays.map((delay, index) => (
          <span
            key={index}
            className="size-[4px] rounded-[1px] bg-foreground"
            style={{
              animation: `pixel-on 650ms ease-in-out ${delay}ms infinite`,
            }}
          />
        ))}
      </span>
      <span
        className="bg-clip-text text-xs font-medium text-transparent"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(18,19,22,0.38) 35%, rgba(18,19,22,0.95) 50%, rgba(18,19,22,0.38) 65%)",
          backgroundSize: "200% 100%",
          animation: "shimmer-text 1.4s linear infinite",
        }}
      >
        {label}
      </span>
      <span className="font-mono text-[11px] tabular-nums text-foreground/40">
        {seconds}s
      </span>
    </div>
  )
}

export function ExecutionTrace({ mode }: { mode: Mode }) {
  const [open, setOpen] = useState(false)
  const steps = useMemo(() => traceSteps[mode], [mode])

  return (
    <div className="mt-3 max-w-md">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="-mx-1.5 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] font-medium text-foreground/50 transition-colors hover:bg-black/[0.04] hover:text-foreground/80 active:scale-[0.98]"
      >
        <Sparkles className="size-3 text-[#FE6501]" />
        <span>Verified X Layer Trace</span>
        <span className="text-foreground/30">·</span>
        <span className="text-foreground/40">Prepared in 0.8s</span>
        <ChevronDownIcon
          size={11}
          className={cn("text-foreground/40 transition-transform duration-300", open && "rotate-180")}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows,opacity] duration-300"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <div className="overflow-hidden">
          <div className="relative ml-2 mt-1 space-y-2 border-l border-foreground/[0.08] py-1.5 pl-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-2.5 text-xs text-foreground/60"
                style={{
                  animation: open
                    ? `xecute-fade-up 260ms cubic-bezier(0.23,1,0.32,1) ${index * 60}ms both`
                    : undefined,
                }}
              >
                <span
                  className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#16845c]/10 text-[#16845c] shadow-[0_0_0_1px_rgba(22,132,92,0.12)]"
                  style={{
                    animation: open
                      ? `pop-in 300ms cubic-bezier(0.23,1,0.32,1) ${index * 60}ms both`
                      : undefined,
                  }}
                >
                  <Check className="size-2.5 stroke-[2.5]" />
                </span>
                <span className="font-medium text-foreground/75">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
