"use client"

import { useId, useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertCircle,
  ArrowDown,
  ArrowLeftRight,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  ExternalLink,
  Gauge,
  LineChart,
  RotateCw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  TriangleAlert,
  X,
} from "lucide-react"

import { IntentCodeBlock } from "@/components/ai/intent-code-block"
import { ScenarioInsight } from "@/components/ai/scenario-insight"
import { ActionConfirmation } from "@/components/execution/action-confirmation"
import { ParameterTuner } from "@/components/execution/parameter-tuner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDownIcon } from "@/components/ui/chevron-down"
import { Copy01Icon } from "@/components/ui/copy-01"
import { isCompleteTradeIntent, toIntentJson, type Intent, type Mode } from "@/lib/intents"
import type { ApprovalFinding, EarnOpportunity, PreparedAction, TradeExecutionPreview } from "@/lib/action-plan"
import { getCanonicalPreflightSummary } from "@/lib/safety/policy"
import type { SafetyCheck, SafetyReport } from "@/lib/safety/types"
import { useTerminalStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const modeIcons: Record<Mode, LucideIcon> = {
  trade: ArrowLeftRight,
  earn: CircleDollarSign,
  predict: LineChart,
  protect: Shield,
}

const modeTitles: Record<Mode, string> = {
  trade: "Execution Intent",
  earn: "Yield & Earn Discovery",
  predict: "Predictive Intelligence",
  protect: "ERC-20 Approval Scan",
}

const actionTitles: Record<string, string> = {
  swap: "Swap Execution Plan",
  transfer: "Transfer Execution Plan",
  approve: "Token Approval Plan",
  revoke: "Allowance Revocation Plan",
}

function formatTvlDisplay(tvl?: string): string | undefined {
  if (!tvl) return undefined
  const num = parseFloat(tvl.replace(/[^0-9.]/g, ""))
  if (isNaN(num)) return tvl
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`
  return `$${num.toFixed(2)}`
}

function DetailRow({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  return (
    <div className="flex min-h-7 items-center justify-between gap-4 text-xs">
      <span className="text-foreground/50">{label}</span>
      <span className={cn(
        "text-right font-medium text-foreground/80",
        tone === "good" && "text-[#16845c]",
        tone === "warn" && "text-[#a8651c]",
      )}>
        {value}
      </span>
    </div>
  )
}

function Disclosure({ label, meta, defaultOpen = false, children }: { label: string; meta?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <div className="border-t border-foreground/[0.07]">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-foreground/65 transition-colors hover:bg-foreground/[0.025] hover:text-foreground/90"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex-1">{label}</span>
        {meta ? <span className="text-[11px] font-normal text-foreground/45">{meta}</span> : null}
        <ChevronDownIcon size={13} className={cn("transition-transform duration-300", open && "rotate-180")} />
      </button>
      <div
        id={contentId}
        className="grid transition-[grid-template-rows,opacity] duration-300"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
          transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
        }}
        aria-hidden={!open}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

function PreflightChecksList({
  walletConnected,
  safety,
  slippage,
  preserveGas,
}: {
  walletConnected: boolean
  safety: SafetyReport
  slippage: number
  preserveGas: boolean
}) {
  const activeChecks = useMemo<SafetyCheck[]>(() => {
    return safety.checks.map((item: SafetyCheck) => {
      if (item.id === "native-gas-reserve") {
        return {
          ...item,
          status: preserveGas ? ("pass" as const) : ("warn" as const),
          detail: preserveGas
            ? "Gas reserve protection active: OKB balance preserved for transaction fees."
            : "Warning: Swapping entire OKB balance may leave insufficient gas for fees.",
        }
      }
      if (item.id === "slippage-limit") {
        const slippageStatus = slippage > 5 ? ("block" as const) : slippage > 1 ? ("warn" as const) : ("pass" as const)
        return {
          ...item,
          label: `Slippage tolerance (${slippage}%)`,
          status: slippageStatus,
          detail: slippageStatus === "pass"
            ? `${slippage}% slippage is within the conservative policy limit.`
            : slippageStatus === "warn"
              ? `${slippage}% slippage exceeds recommended 1% threshold.`
              : `${slippage}% exceeds hard 5% maximum slippage limit.`,
        }
      }
      return item
    })
  }, [safety.checks, preserveGas, slippage])

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Safeguard verification checklist</p>
      <div className="space-y-1.5">
        {activeChecks.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-2.5 rounded-lg border border-black/[0.04] bg-white p-2.5 shadow-2xs transition-colors hover:border-black/[0.08]"
          >
            <span className={cn(
              "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[10px]",
              item.status === "pass"
                ? "bg-[#16845c]/10 text-[#16845c]"
                : item.status === "block"
                  ? "bg-[#d94b2a]/10 text-[#d94b2a]"
                  : item.status === "warn"
                    ? "bg-[#a8651c]/10 text-[#a8651c]"
                    : "bg-black/[0.05] text-foreground/40",
            )}>
              {item.status === "pass" ? (
                <Check className="size-2.5 stroke-[2.5]" />
              ) : item.status === "block" ? (
                <X className="size-2.5 stroke-[2.5]" />
              ) : item.status === "warn" ? (
                <AlertCircle className="size-2.5 stroke-[2.5]" />
              ) : (
                <Clock className="size-2.5 stroke-[2.5]" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground/85">{item.label}</p>
                <span className={cn(
                  "text-[10px] font-medium uppercase tracking-wider",
                  item.status === "pass" ? "text-[#16845c]" : item.status === "warn" ? "text-[#a8651c]" : "text-foreground/40"
                )}>
                  {item.status === "pass" ? "Passed" : item.status === "warn" ? "Warning" : "Pending"}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/50">{item.detail}</p>
            </div>
          </div>
        ))}
        {!walletConnected ? (
          <div className="flex items-center gap-2 pt-1 text-[11px] text-[#a8651c]">
            <TriangleAlert className="size-3.5" />
            Connect a wallet for account-specific balance checks
          </div>
        ) : null}
      </div>
    </div>
  )
}

function TradeQuoteFailed({
  errorMessage,
  onRetry,
}: {
  errorMessage?: string
  onRetry: () => void
}) {
  return (
    <div className="px-4 pb-4">
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.035] p-4 text-center">
        <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-red-500/10 text-red-600">
          <AlertCircle className="size-4" />
        </div>
        <h4 className="text-xs font-semibold text-red-600">Quote Unavailable / Action Blocked</h4>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-foreground/65">
          {errorMessage || "Live DEX quote could not be retrieved from X Layer liquidity pools."}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="mt-3.5 h-7 gap-1.5 rounded-full border-red-500/30 bg-white px-3.5 text-xs font-medium text-red-600 shadow-xs hover:bg-red-50"
        >
          <RotateCw className="size-3" />
          Retry quote
        </Button>
      </div>
    </div>
  )
}

function TradeResult({
  preview,
  walletConnected,
  safety,
  slippage,
  preserveGas,
}: {
  preview: TradeExecutionPreview
  walletConnected: boolean
  safety: SafetyReport
  slippage: number
  preserveGas: boolean
}) {
  const isSimulated = preview.source === "simulated"

  const minReceived = useMemo(() => {
    const numOut = parseFloat(preview.estimatedOutput)
    if (!isNaN(numOut) && numOut > 0) {
      const calculated = numOut * (1 - slippage / 100)
      return calculated >= 1 ? calculated.toFixed(4) : calculated.toFixed(6)
    }
    return preview.minimumReceived
  }, [preview.estimatedOutput, preview.minimumReceived, slippage])

  const passedChecksCount = useMemo(() => {
    let count = 0
    for (const check of safety.checks) {
      if (check.id === "native-gas-reserve") {
        if (preserveGas) count++
      } else if (check.id === "slippage-limit") {
        if (slippage <= 1) count++
      } else if (check.status === "pass") {
        count++
      }
    }
    return count
  }, [safety.checks, preserveGas, slippage])

  return (
    <>
      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        {isSimulated ? (
          <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1.5 text-xs text-amber-700">
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] font-bold text-amber-700">
              SIMULATED
            </Badge>
            <span className="text-[11px]">Simulated estimate only. Not an executable live quote.</span>
          </div>
        ) : null}

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3 rounded-xl border border-black/[0.05] bg-black/[0.02] p-2.5 sm:p-3.5">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/40">You pay</p>
            <p className="mt-0.5 truncate font-mono text-base sm:text-lg font-semibold tracking-tight text-foreground">
              {preview.inputAmount} <span className="font-sans text-xs font-medium text-foreground/50">{preview.fromToken}</span>
            </p>
          </div>
          <span className="flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-full border border-black/[0.08] bg-white text-foreground/50 shadow-sm">
            <ArrowDown className="size-3 sm:size-3.5" />
          </span>
          <div className="min-w-0 text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/40">Estimated receive</p>
            <p className="mt-0.5 truncate font-mono text-base sm:text-lg font-semibold tracking-tight text-[#16845c]">
              {preview.estimatedOutput} <span className="font-sans text-xs font-medium text-foreground/50">{preview.toToken}</span>
            </p>
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-3 divide-x divide-black/[0.06] rounded-xl border border-black/[0.06] bg-white">
          {[["Slippage", `${slippage}%`], ["Gas Est.", preview.gasEstimate], ["Price Impact", preview.priceImpact]].map(([label, value]) => (
            <div key={label} className="min-w-0 px-1 sm:px-2 py-1.5 sm:py-2 text-center">
              <p className="text-[9.5px] sm:text-[10px] text-foreground/40 truncate">{label}</p>
              <p className="mt-0.5 truncate font-mono text-[11px] sm:text-xs font-medium text-foreground/75">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <Disclosure label="Preflight safeguards" meta={`${passedChecksCount} of ${safety.checks.length} checks passed`}>
        <div className="space-y-3 sm:space-y-4">
          <div className="rounded-xl border border-black/[0.06] bg-black/[0.015] p-3 sm:p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-black/[0.05] pb-2 mb-2.5">
              <span className="text-[11px] font-medium text-foreground/50">Liquidity Route</span>
              <span className="inline-flex max-w-full truncate items-center gap-1 rounded-md border border-black/[0.06] bg-white px-2 py-0.5 text-[10.5px] sm:text-[11px] font-medium text-foreground/85 shadow-2xs">
                {preview.route}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
              <div className="min-w-0 rounded-lg border border-black/[0.04] bg-white p-1.5 sm:p-2 shadow-2xs">
                <p className="text-[9.5px] sm:text-[10px] text-foreground/45 truncate">Min. Output</p>
                <p className="mt-0.5 truncate font-mono text-[10.5px] sm:text-[11px] font-semibold text-foreground/90">{minReceived} {preview.toToken}</p>
              </div>
              <div className="min-w-0 rounded-lg border border-black/[0.04] bg-white p-1.5 sm:p-2 shadow-2xs">
                <p className="text-[9.5px] sm:text-[10px] text-foreground/45 truncate">Approval</p>
                <p className="mt-0.5 truncate text-[10.5px] sm:text-[11px] font-semibold text-foreground/90">{preview.approvalRequired ? "Required" : "Not required"}</p>
              </div>
              <div className="min-w-0 rounded-lg border border-black/[0.04] bg-white p-1.5 sm:p-2 shadow-2xs">
                <p className="text-[9.5px] sm:text-[10px] text-foreground/45 truncate">Risk Level</p>
                <p className="mt-0.5 inline-flex items-center justify-center gap-1 text-[10.5px] sm:text-[11px] font-semibold text-[#16845c]">
                  <span className="size-1.5 rounded-full bg-[#16845c]" />
                  {preview.riskLevel}
                </p>
              </div>
            </div>
          </div>
          <PreflightChecksList
            walletConnected={walletConnected}
            safety={safety}
            slippage={slippage}
            preserveGas={preserveGas}
          />
        </div>
      </Disclosure>
    </>
  )
}

function TransferResult({
  intent,
  preview,
  walletConnected,
  safety,
  preserveGas,
}: {
  intent: Extract<Intent, { mode: "trade" }>
  preview: TradeExecutionPreview
  walletConnected: boolean
  safety: SafetyReport
  preserveGas: boolean
}) {
  const isSimulated = preview.source === "simulated"
  const recipientAddress = intent.recipient || preview.toToken || "Unknown recipient"
  const shortRecipient = recipientAddress.length > 16
    ? `${recipientAddress.slice(0, 8)}...${recipientAddress.slice(-6)}`
    : recipientAddress

  const passedChecksCount = useMemo(() => {
    let count = 0
    for (const check of safety.checks) {
      if (check.id === "native-gas-reserve") {
        if (preserveGas) count++
      } else if (check.id === "slippage-limit") {
        count++ // Not applicable to direct transfers
      } else if (check.status === "pass") {
        count++
      }
    }
    return count
  }, [safety.checks, preserveGas])

  return (
    <>
      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        {isSimulated ? (
          <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1.5 text-xs text-amber-700">
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] font-bold text-amber-700">
              SIMULATED
            </Badge>
            <span className="text-[11px]">Simulated estimate only. Not an executable live transaction.</span>
          </div>
        ) : null}

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3 rounded-xl border border-black/[0.05] bg-black/[0.02] p-2.5 sm:p-3.5">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/40">You send</p>
            <p className="mt-0.5 truncate font-mono text-base sm:text-lg font-semibold tracking-tight text-foreground">
              {intent.amount ?? preview.inputAmount}{" "}
              <span className="font-sans text-xs font-medium text-foreground/50">{intent.fromToken ?? preview.fromToken}</span>
            </p>
          </div>
          <span className="flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#FE6501] shadow-sm">
            <Send className="size-3 sm:size-3.5" />
          </span>
          <div className="min-w-0 text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/40">Recipient</p>
            <p className="mt-0.5 truncate font-mono text-xs font-semibold text-foreground/80" title={recipientAddress}>
              {shortRecipient}
            </p>
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-3 divide-x divide-black/[0.06] rounded-xl border border-black/[0.06] bg-white">
          {[
            ["Network", "X Layer Testnet"],
            ["Gas Est.", preview.gasEstimate || "21,000 gas"],
            ["Asset Type", intent.fromToken === "OKB" ? "Native OKB" : "ERC-20 Token"],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 px-1 sm:px-2 py-1.5 sm:py-2 text-center">
              <p className="text-[9.5px] sm:text-[10px] text-foreground/40 truncate">{label}</p>
              <p className="mt-0.5 truncate font-mono text-[11px] sm:text-xs font-medium text-foreground/75">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <Disclosure label="Preflight safeguards" meta={`${passedChecksCount} of ${safety.checks.length} checks passed`}>
        <div className="space-y-3 sm:space-y-4">
          <div className="rounded-xl border border-black/[0.06] bg-black/[0.015] p-3 sm:p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-black/[0.05] pb-2 mb-2.5">
              <span className="text-[11px] font-medium text-foreground/50">Execution Route</span>
              <span className="inline-flex max-w-full truncate items-center gap-1 rounded-md border border-black/[0.06] bg-white px-2 py-0.5 text-[10.5px] sm:text-[11px] font-medium text-foreground/85 shadow-2xs">
                {intent.fromToken === "OKB" ? "Direct Native Transfer" : "ERC-20 transfer() Call"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
              <div className="min-w-0 rounded-lg border border-black/[0.04] bg-white p-1.5 sm:p-2 shadow-2xs">
                <p className="text-[9.5px] sm:text-[10px] text-foreground/45 truncate">Transfer Method</p>
                <p className="mt-0.5 truncate font-mono text-[10.5px] sm:text-[11px] font-semibold text-foreground/90">
                  {intent.fromToken === "OKB" ? "Native Send" : "Token Transfer"}
                </p>
              </div>
              <div className="min-w-0 rounded-lg border border-black/[0.04] bg-white p-1.5 sm:p-2 shadow-2xs">
                <p className="text-[9.5px] sm:text-[10px] text-foreground/45 truncate">Target</p>
                <p className="mt-0.5 truncate font-mono text-[10.5px] sm:text-[11px] font-semibold text-foreground/90">
                  {shortRecipient}
                </p>
              </div>
              <div className="min-w-0 rounded-lg border border-black/[0.04] bg-white p-1.5 sm:p-2 shadow-2xs">
                <p className="text-[9.5px] sm:text-[10px] text-foreground/45 truncate">Risk Level</p>
                <p className="mt-0.5 inline-flex items-center justify-center gap-1 text-[10.5px] sm:text-[11px] font-semibold text-[#16845c]">
                  <span className="size-1.5 rounded-full bg-[#16845c]" />
                  {preview.riskLevel || "Low"}
                </p>
              </div>
            </div>
          </div>
          <PreflightChecksList
            walletConnected={walletConnected}
            safety={safety}
            slippage={0.5}
            preserveGas={preserveGas}
          />
        </div>
      </Disclosure>
    </>
  )
}

function ApprovalResult({
  intent,
  preview,
  walletConnected,
  safety,
  preserveGas,
}: {
  intent: Extract<Intent, { mode: "trade" }>
  preview: TradeExecutionPreview
  walletConnected: boolean
  safety: SafetyReport
  preserveGas: boolean
}) {
  const isRevoke = intent.action === "revoke"
  const spenderAddress = intent.spender || "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"
  const shortSpender = spenderAddress.length > 16
    ? `${spenderAddress.slice(0, 8)}...${spenderAddress.slice(-6)}`
    : spenderAddress

  const passedChecksCount = useMemo(() => {
    let count = 0
    for (const check of safety.checks) {
      if (check.id === "native-gas-reserve") {
        if (preserveGas) count++
      } else if (check.id === "slippage-limit") {
        count++ // Not applicable to approvals
      } else if (check.status === "pass") {
        count++
      }
    }
    return count
  }, [safety.checks, preserveGas])

  return (
    <>
      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3 rounded-xl border border-black/[0.05] bg-black/[0.02] p-2.5 sm:p-3.5">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/40">
              {isRevoke ? "Revoke Token" : "Approve Token"}
            </p>
            <p className="mt-0.5 truncate font-mono text-base sm:text-lg font-semibold tracking-tight text-foreground">
              {isRevoke ? "0" : (intent.amount ?? "Unlimited")}{" "}
              <span className="font-sans text-xs font-medium text-foreground/50">{intent.fromToken ?? preview.fromToken}</span>
            </p>
          </div>
          <span className="flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#FE6501] shadow-sm">
            <ShieldCheck className="size-3 sm:size-3.5" />
          </span>
          <div className="min-w-0 text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/40">Spender Contract</p>
            <p className="mt-0.5 truncate font-mono text-xs font-semibold text-foreground/80" title={spenderAddress}>
              {shortSpender}
            </p>
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-3 divide-x divide-black/[0.06] rounded-xl border border-black/[0.06] bg-white">
          {[
            ["Network", "X Layer Testnet"],
            ["Gas Est.", preview.gasEstimate || "45,000 gas"],
            ["Action Type", isRevoke ? "Revocation (0)" : "Approval Grant"],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 px-1 sm:px-2 py-1.5 sm:py-2 text-center">
              <p className="text-[9.5px] sm:text-[10px] text-foreground/40 truncate">{label}</p>
              <p className="mt-0.5 truncate font-mono text-[11px] sm:text-xs font-medium text-foreground/75">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <Disclosure label="Preflight safeguards" meta={`${passedChecksCount} of ${safety.checks.length} checks passed`}>
        <div className="space-y-3 sm:space-y-4">
          <PreflightChecksList
            walletConnected={walletConnected}
            safety={safety}
            slippage={0.5}
            preserveGas={preserveGas}
          />
        </div>
      </Disclosure>
    </>
  )
}

function ModeResult({ intent, plan }: { intent: Exclude<Intent, { mode: "trade" }>; plan: PreparedAction }) {
  if (intent.mode === "earn") {
    const opps = plan.earnOpportunities ?? []
    if (opps.length > 0) {
      return (
        <div className="divide-y divide-foreground/[0.07] border-t border-foreground/[0.07]">
          {opps.map((opportunity) => {
            const depositUrl = opportunity.url || "https://www.okx.com/web3/defi"
            const formattedName = opportunity.name.replace(/-/g, " · ")
            return (
              <div
                key={opportunity.name}
                className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 px-3.5 sm:px-4 py-3 transition-colors hover:bg-black/[0.015]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded bg-black/[0.05] px-1.5 py-0.5 text-[10px] font-semibold text-foreground/75">
                      {opportunity.protocol}
                    </span>
                    <span className="truncate font-mono text-xs font-semibold text-foreground/90">
                      {formattedName}
                    </span>
                  </div>
                  {opportunity.tvlUsd && (
                    <p className="mt-1 text-[10px] text-foreground/45">
                      TVL: <span className="font-mono font-medium text-foreground/70">{formatTvlDisplay(opportunity.tvlUsd)}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t border-black/[0.04] sm:border-0">
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="font-mono text-sm font-bold text-[#16845c]">{opportunity.apy}</p>
                    <p className="text-[9px] uppercase tracking-wider text-foreground/40">Variable</p>
                  </div>
                  <a
                    href={depositUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-[#FE6501]/30 bg-[#FE6501]/[0.06] px-2.5 text-[11px] font-semibold text-[#FE6501] shadow-2xs transition-all hover:bg-[#FE6501] hover:text-white"
                  >
                    <span>Deposit</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    return (
      <div className="border-t border-foreground/[0.07] px-4 py-5 text-center">
        <div className="mx-auto mb-2 flex size-7 items-center justify-center rounded-full bg-black/[0.04] text-foreground/50">
          <CircleDollarSign className="size-4" />
        </div>
        <p className="text-xs font-semibold text-foreground/80">No active yield pools found for {intent.asset ?? "this token"}</p>
        <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-foreground/50">
          The OKX DeFi discovery API currently reports 0 active single-token earn opportunities on X Layer mainnet for this asset.
        </p>
      </div>
    )
  }


  if (intent.mode === "predict") {
    return (
      <div className="border-t border-foreground/[0.07] px-3 sm:px-4 py-3 sm:py-4">
        <ScenarioInsight asset={intent.asset ?? "OKB"} change={intent.changePercent ?? -10} embedded />
      </div>
    )
  }

  const scanStatus = plan.scanStatus ?? "complete"
  const findings = plan.approvalFindings ?? []
  const inactiveFindings = plan.inactiveFindings ?? []
  const activeFindings = findings.filter(
    (f) =>
      f.status === "active" ||
      f.status === "unlimited" ||
      f.status === "unknown" ||
      (f.allowance && f.allowance !== "0" && f.allowance !== "0.00"),
  )

  if (scanStatus === "failed") {
    return (
      <div className="border-t border-foreground/[0.07] px-4 py-5 text-center">
        <div className="mx-auto mb-2 flex size-7 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
          <AlertCircle className="size-4" />
        </div>
        <p className="text-xs font-semibold text-foreground/85">Approval Scan Incomplete</p>
        <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-foreground/55">
          {plan.scanScope || "Unable to verify onchain allowance state via X Layer RPC. Retry the scan before treating this result as complete."}
        </p>
      </div>
    )
  }

  if (activeFindings.length > 0) {
    return (
      <div className="border-t border-foreground/[0.07]">
        <div className="divide-y divide-foreground/[0.07]">
          {activeFindings.map((finding) => {
            const isUnlimited = finding.status === "unlimited" || finding.allowance === "Unlimited"
            const isUnknown = finding.status === "unknown" || finding.allowance === "Unknown"
            return (
              <div key={`${finding.token}-${finding.spender}`} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 px-3.5 sm:px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground/85">{finding.label}</p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-foreground/45">
                    Spender: {finding.spenderName ? `${finding.spenderName} (${finding.spender.slice(0, 6)}...${finding.spender.slice(-4)})` : finding.spender}
                  </p>
                  {finding.detail ? (
                    <p className="mt-1 text-[10px] text-foreground/55 leading-relaxed">
                      {finding.detail}
                    </p>
                  ) : null}
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 w-fit shrink-0 rounded px-1.5 text-[9px] font-medium",
                    isUnlimited
                      ? "border-[#d94b2a]/20 bg-[#d94b2a]/[0.06] text-[#d94b2a]"
                      : isUnknown
                        ? "border-amber-500/20 bg-amber-500/[0.06] text-amber-700"
                        : "border-black/[0.08] bg-black/[0.02] text-foreground/75",
                  )}
                >
                  {isUnlimited ? "Unlimited approval" : isUnknown ? "Unverified" : "Active approval"}
                </Badge>
              </div>
            )
          })}
        </div>

        {inactiveFindings.length > 0 ? (
          <div className="border-t border-foreground/[0.07] px-3.5 sm:px-4 py-2.5 bg-black/[0.01]">
            <p className="text-[11px] font-medium text-foreground/55 mb-1.5">
              Inactive relationships ({inactiveFindings.length})
            </p>
            <div className="space-y-1.5">
              {inactiveFindings.map((item) => (
                <div key={`${item.token}-${item.spender}`} className="flex items-center justify-between text-[10px]">
                  <span className="text-foreground/70">{item.token ?? "Token"} · <span className="font-mono text-foreground/45">{item.spender.slice(0, 6)}...{item.spender.slice(-4)}</span></span>
                  <span className="text-foreground/40 font-mono">Current allowance: 0 · Inactive</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="border-t border-foreground/[0.07] px-4 py-5 text-center">
      <div className="mx-auto mb-2 flex size-7 items-center justify-center rounded-full bg-black/[0.04] text-foreground/60">
        <Shield className="size-4" />
      </div>
      <p className="text-xs font-semibold text-foreground/85">No active ERC-20 approvals found</p>
      <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-foreground/50">
        Xecute found no spendable ERC-20 allowances within this scan&apos;s scope.
      </p>
      {plan.startBlock !== undefined && plan.endBlock !== undefined ? (
        <p className="mt-2 text-[10px] font-mono text-foreground/40">
          ERC-20 allowances · scanned blocks {plan.startBlock}–{plan.endBlock}
        </p>
      ) : plan.scannedBlockNumber ? (
        <p className="mt-2 text-[10px] font-mono text-foreground/40">
          ERC-20 allowances · scanned through block {plan.scannedBlockNumber}
        </p>
      ) : null}

      {inactiveFindings.length > 0 ? (
        <div className="mt-4 border-t border-foreground/[0.06] pt-3 text-left">
          <p className="text-[11px] font-medium text-foreground/55 mb-1.5">
            Inactive relationships ({inactiveFindings.length})
          </p>
          <div className="space-y-1 text-[10px]">
            {inactiveFindings.map((item) => (
              <div key={`${item.token}-${item.spender}`} className="flex items-center justify-between py-0.5 text-foreground/60">
                <span>{item.token ?? "Token"} · <span className="font-mono">{item.spender.slice(0, 6)}...{item.spender.slice(-4)}</span></span>
                <span className="text-foreground/40">Current allowance: 0 · Inactive</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Receipt() {
  const [copied, setCopied] = useState(false)
  const receipt = useTerminalStore((state) => state.receipt)
  if (!receipt) return null

  const shortHash = `${receipt.transactionHash.slice(0, 8)}…${receipt.transactionHash.slice(-6)}`
  const explorerUrl = `https://www.okx.com/web3/explorer/xlayer-test/tx/${receipt.transactionHash}`

  async function copyHash() {
    await navigator.clipboard.writeText(receipt!.transactionHash)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="border-t border-[#16845c]/15 bg-[#16845c]/[0.035] px-3.5 sm:px-4 py-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#16845c]">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Transaction successful</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyHash}
            className="inline-flex items-center gap-1.5 rounded-md border border-black/[0.08] bg-white px-2 py-1 font-mono text-[10px] font-medium text-foreground/75 shadow-2xs transition-all hover:border-black/[0.16] hover:bg-[#fafafa] hover:text-foreground active:scale-[0.98]"
            title="Click to copy full transaction hash"
          >
            <span>{shortHash}</span>
            {copied ? (
              <Check className="size-3 text-[#16845c] stroke-[2.5]" />
            ) : (
              <Copy01Icon size={12} className="text-foreground/45" />
            )}
          </button>

          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#16845c] transition-colors hover:bg-[#16845c]/10"
          >
            <span>View in Explorer ↗</span>
          </a>
        </div>
      </div>
    </div>
  )
}

export function InlineExecution() {
  const plan = useTerminalStore((state) => state.currentPlan)
  const status = useTerminalStore((state) => state.status)
  const walletConnected = useTerminalStore((state) => state.walletConnected)
  const confirmAction = useTerminalStore((state) => state.confirmAction)
  const submitPrompt = useTerminalStore((state) => state.submitPrompt)
  const intent = plan?.intent ?? null
  const parsedJson = useMemo(() => intent ? JSON.stringify(toIntentJson(intent), null, 2) : "", [intent])

  const initialSlippage = intent && intent.mode === "trade" ? (intent.maxSlippage ?? 0.5) : 0.5
  const initialPreserveGas = intent && intent.mode === "trade" ? (intent.preserveGasBalance ?? true) : true

  const [slippage, setSlippage] = useState(initialSlippage)
  const [preserveGas, setPreserveGas] = useState(initialPreserveGas)

  if (!intent || !plan) return null

  const Icon = modeIcons[intent.mode]
  const completeTrade = isCompleteTradeIntent(intent)
  const isQuoteFailed = plan.status === "quote_failed"
  const isSimulated = plan.preview?.source === "simulated" || plan.status === "simulated_preview"
  const statusLabel =
    status === "executed"
      ? "Executed"
      : status === "reverted"
        ? "Reverted"
        : status === "pending"
          ? "Pending (Mining)"
          : status === "broadcast"
            ? "Broadcast"
            : status === "awaiting_signature"
              ? "Awaiting signature"
              : status === "preparing"
                ? "Preparing"
                : isQuoteFailed
                  ? "Quote unavailable"
                  : plan.status === "blocked" || status === "blocked"
                    ? "Blocked"
                    : isSimulated
                      ? "Simulated"
                      : intent.mode === "trade" && !completeTrade
                        ? "Needs details"
                        : intent.mode === "trade"
                          ? "Ready to execute"
                          : "Analysis ready"

  const networkDisplay = intent.network === "mainnet" ? "X Layer Mainnet" : "X Layer Testnet"

  return (
    <section className="mt-3.5 w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.04)]" aria-label={modeTitles[intent.mode]}>
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-foreground/75">
            <Icon className="size-3.5 sm:size-4" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-xs font-semibold text-foreground/85">
              {intent.mode === "trade" ? (actionTitles[intent.action] ?? "Execution Intent") : modeTitles[intent.mode]}
            </h3>
            <p className="truncate text-[10px] text-foreground/45">
              {intent.mode === "trade"
                ? intent.action === "transfer"
                  ? `${networkDisplay} · Direct onchain transfer`
                  : intent.action === "approve" || intent.action === "revoke"
                    ? `${networkDisplay} · Token permission`
                    : `${networkDisplay} · ${isQuoteFailed ? "Quote failed" : isSimulated ? "Simulated" : "Live quote"}`
                : "Intelligence analysis"}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "h-5 shrink-0 rounded px-1.5 text-[9px] font-medium",
            status === "executed"
              ? "border-[#16845c]/20 text-[#16845c]"
              : isQuoteFailed || plan.status === "blocked"
                ? "border-[#d94b2a]/20 text-[#d94b2a]"
                : isSimulated
                  ? "border-amber-500/30 text-amber-700"
                  : completeTrade || intent.mode !== "trade"
                    ? "border-black/[0.1] bg-black/[0.03] text-foreground/75"
                    : "border-[#a8651c]/20 text-[#a8651c]",
          )}
        >
          {statusLabel}
        </Badge>
      </div>

      {intent.mode === "trade" ? (
        isQuoteFailed && intent.action === "swap" ? (
          <TradeQuoteFailed
            errorMessage={plan.errorMessage}
            onRetry={() => submitPrompt(intent.rawPrompt)}
          />
        ) : plan.preview ? (
          intent.action === "transfer" ? (
            <TransferResult
              intent={intent}
              preview={plan.preview}
              walletConnected={walletConnected}
              safety={plan.safety}
              preserveGas={preserveGas}
            />
          ) : intent.action === "approve" || intent.action === "revoke" ? (
            <ApprovalResult
              intent={intent}
              preview={plan.preview}
              walletConnected={walletConnected}
              safety={plan.safety}
              preserveGas={preserveGas}
            />
          ) : (
            <TradeResult
              preview={plan.preview}
              walletConnected={walletConnected}
              safety={plan.safety}
              slippage={slippage}
              preserveGas={preserveGas}
            />
          )
        ) : null
      ) : (
        <ModeResult intent={intent} plan={plan} />
      )}

      <Disclosure label="Execution Intent" meta="Raw JSON">
        <IntentCodeBlock code={parsedJson} />
      </Disclosure>

      {intent.mode === "trade" ? (
        <ActionConfirmation
          intent={intent}
          complete={completeTrade}
          confirmed={status === "executed"}
          confirming={status === "awaiting_signature" || status === "broadcast" || status === "pending"}
          safety={plan.safety}
          quoteFailed={isQuoteFailed}
          walletConnected={walletConnected}
          slippage={slippage}
          preserveGas={preserveGas}
          onSlippageChange={setSlippage}
          onPreserveGasChange={setPreserveGas}
          onConfirm={confirmAction}
        />
      ) : (
        <div className="flex items-center gap-2 border-t border-foreground/[0.07] px-3.5 sm:px-4 py-2.5 text-[10px] text-foreground/40">
          <Gauge className="size-3.5" />
          Read Only · No onchain transaction prepared
        </div>
      )}

      <Receipt />
    </section>
  )
}
