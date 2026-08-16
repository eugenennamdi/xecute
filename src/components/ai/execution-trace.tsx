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

  if (!rawPrompt) {
    switch (mode) {
      case "trade":
        return "Analyzing liquidity & gas"
      case "earn":
        return "Scanning yield opportunities"
      case "predict":
        return "Simulating market scenario"
      case "protect":
        return "Auditing wallet permissions"
      default:
        return "Processing request"
    }
  }

  const text = rawPrompt.toLowerCase().trim()

  // 1. Gas / Network queries
  if (text.includes("gas") || text.includes("block height") || text.includes("rpc") || text.includes("snapshot")) {
    return "Checking network gas & block"
  }

  // 2. Balance / Holdings / Address queries
  if (text.includes("balance") || text.includes("holding") || text.includes("holds") || text.includes("wallet") || text.startsWith("0x")) {
    return "Fetching real-time balances"
  }

  // 3. Faucet queries
  if (text.includes("faucet") || text.includes("test okb")) {
    return "Checking official faucet"
  }

  // 4. Token Approvals & Security Audits
  if (text.includes("approval") || text.includes("allowance") || text.includes("revoke") || text.includes("spender")) {
    return "Auditing token approvals"
  }
  if (text.includes("honeypot") || text.includes("security") || text.includes("risk") || text.includes("scan")) {
    return "Auditing contract security"
  }

  // 5. Earn & Yield Pools
  if (text.includes("yield") || text.includes("earn") || text.includes("pool") || text.includes("vault") || text.includes("apy")) {
    const tokens = ["USDT0", "USDT", "USDC", "OKB", "WOKB", "WETH", "ETH", "USDG", "BTC", "SOL"]
    const matched = tokens.filter((t) => text.toUpperCase().includes(t))
    if (matched.length > 0) {
      return `Scanning yield pools for ${matched[0]}`
    }
    return "Scanning DeFi yield opportunities"
  }

  // 6. Predictions & Scenarios
  if (text.includes("what if") || text.includes("predict") || text.includes("drops") || text.includes("pumps") || text.includes("scenario") || text.includes("simulate")) {
    return "Simulating market scenario"
  }

  // 7. Swaps & Trades
  if (text.includes("swap") || text.includes("trade") || text.includes("buy") || text.includes("sell") || text.includes("exchange")) {
    const tokens = ["USDT0", "USDT", "USDC", "OKB", "WOKB", "WETH", "ETH", "USDG", "BTC", "SOL"]
    const foundTokens = tokens.filter((t) => text.toUpperCase().includes(t))
    if (foundTokens.length >= 2) {
      return `Finding best quote for ${foundTokens[0]} → ${foundTokens[1]}`
    }
    return "Analyzing liquidity & gas"
  }

  // 8. Transfers
  if (text.includes("send") || text.includes("transfer")) {
    return "Validating transfer & gas"
  }

  // Fallback by mode
  switch (mode) {
    case "trade":
      return "Analyzing liquidity & gas"
    case "earn":
      return "Scanning yield opportunities"
    case "predict":
      return "Simulating market scenario"
    case "protect":
      return "Auditing wallet permissions"
    default:
      return "Processing request"
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
