"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, Check, Clock, Info, LoaderCircle, RotateCw, ShieldAlert, ShieldCheck, WalletCards, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ChevronDownIcon } from "@/components/ui/chevron-down"
import { CircleCheckIcon, type CircleCheckIconHandle } from "@/components/ui/circle-check"
import { ExecutionStepper } from "@/components/execution/execution-stepper"
import { ParameterTuner } from "@/components/execution/parameter-tuner"
import { appKit } from "@/components/providers/appkit-provider"
import type { TradeIntent } from "@/lib/intents"
import { getCanonicalPreflightSummary } from "@/lib/safety/policy"
import type { SafetyCheck, SafetyReport } from "@/lib/safety/types"
import { useTerminalStore } from "@/lib/store"
import { formatDisplayAmount } from "@/lib/format"
import { cn } from "@/lib/utils"

type ActionConfirmationProps = {
  intent: TradeIntent
  complete: boolean
  confirmed: boolean
  confirming: boolean
  safety: SafetyReport
  quoteFailed?: boolean
  walletConnected: boolean
  slippage?: number
  preserveGas?: boolean
  onSlippageChange?: (val: number) => void
  onPreserveGasChange?: (val: boolean) => void
  onConfirm: () => void
}

export function ActionConfirmation({
  intent,
  complete,
  confirmed,
  confirming,
  safety,
  quoteFailed = false,
  walletConnected,
  slippage: propSlippage,
  preserveGas: propPreserveGas,
  onSlippageChange,
  onPreserveGasChange,
  onConfirm,
}: ActionConfirmationProps) {
  const [checksOpen, setChecksOpen] = useState(false)
  const [internalSlippage, setInternalSlippage] = useState(intent.maxSlippage ?? 0.5)
  const [internalPreserveGas, setInternalPreserveGas] = useState(intent.preserveGasBalance ?? true)

  const slippage = propSlippage !== undefined ? propSlippage : internalSlippage
  const preserveGas = propPreserveGas !== undefined ? propPreserveGas : internalPreserveGas

  function handleSlippageChange(val: number) {
    if (onSlippageChange) onSlippageChange(val)
    else setInternalSlippage(val)
  }

  function handlePreserveGasChange(val: boolean) {
    if (onPreserveGasChange) onPreserveGasChange(val)
    else setInternalPreserveGas(val)
  }

  const receipt = useTerminalStore((state) => state.receipt)

  const confirmedIconRef = useRef<CircleCheckIconHandle>(null)
  const confirmButtonIconRef = useRef<CircleCheckIconHandle>(null)
  const isMainnet = intent.network === "mainnet"

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

  const passedCount = useMemo(() => activeChecks.filter((c: SafetyCheck) => c.status === "pass").length, [activeChecks])
  const totalCount = activeChecks.length
  const blockedCount = useMemo(() => activeChecks.filter((c: SafetyCheck) => c.status === "block").length, [activeChecks])
  const allRequiredPassed = useMemo(() => {
    const requiredChecks = activeChecks.filter((c: SafetyCheck) => c.id !== "human-confirmation")
    return requiredChecks.every((c: SafetyCheck) => c.status === "pass" || c.status === "warn") && blockedCount === 0
  }, [activeChecks, blockedCount])

  const missingFields = [
    !intent.amount ? "input amount" : null,
    !intent.fromToken ? "source token" : null,
    !intent.toToken ? "destination token" : null,
  ].filter(Boolean) as string[]

  useEffect(() => {
    if (confirmed) confirmedIconRef.current?.startAnimation()
  }, [confirmed])

  if (confirmed) {
    return (
      <div className="border-t border-[#16845c]/15 bg-[#16845c]/[0.035] p-3.5">
        <ExecutionStepper
          stage="settled"
          txHash={receipt?.transactionHash}
          chainId={1952}
        />
      </div>
    )
  }

  if (confirming) {
    return (
      <div className="border-t border-black/[0.08] p-3.5">
        <ExecutionStepper
          stage="signing"
          chainId={1952}
        />
      </div>
    )
  }

  const blocked = safety.level === "blocked" || blockedCount > 0
  const confirmable = complete && !blocked && !quoteFailed && allRequiredPassed && !isMainnet

  const isTransfer = intent.action === "transfer"
  const isApprove = intent.action === "approve"
  const isRevoke = intent.action === "revoke"
  const actionVerb = isTransfer ? "transfer" : isApprove ? "approve" : isRevoke ? "revoke" : "swap"

  const buttonLabel = !walletConnected && !isMainnet
    ? `Connect wallet to ${actionVerb}`
    : confirming
      ? isTransfer
        ? "Transferring..."
        : isApprove
          ? "Approving..."
          : isRevoke
            ? "Revoking..."
            : "Swapping..."
      : quoteFailed
        ? "Quote unavailable"
        : blocked
          ? isTransfer
            ? "Transfer blocked"
            : "Action blocked"
          : !complete
            ? isTransfer
              ? "Complete transfer"
              : "Complete intent"
            : isTransfer
              ? "Confirm transfer"
              : isApprove
                ? "Confirm approval"
                : isRevoke
                  ? "Confirm revocation"
                  : "Confirm swap"

  return (
    <div className="border-t border-foreground/[0.07]">
      {isMainnet ? (
        <div className="border-b border-foreground/[0.06] bg-foreground/[0.02] px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs text-foreground/75">
            <Info className="size-3.5 shrink-0 text-foreground/50" />
            <span className="font-medium">Mainnet preview</span>
            <span className="text-[11px] text-foreground/45">· Mainnet operates in read-only intelligence mode in this Xecute version.</span>
          </div>
        </div>
      ) : null}

      {!walletConnected && !isMainnet && complete && !blocked && !quoteFailed ? (
        <div className="border-b border-amber-500/15 bg-amber-500/[0.035] px-4 py-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-800">
              <WalletCards className="size-3.5 shrink-0 text-amber-600" />
              <span className="font-medium">Connect wallet to execute</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 rounded-full px-2.5 text-[11px] font-semibold text-[#FE6501] hover:bg-[#FE6501]/10"
              onClick={() => void appKit.open({ view: "Connect", namespace: "eip155" })}
            >
              Connect wallet
            </Button>
          </div>
        </div>
      ) : null}

      {!complete ? (
        <div className="px-4 pt-3">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-black/[0.04] text-foreground/60">
              <WalletCards className="size-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground/78">
                More details needed
              </p>
              <p className="mt-1 text-[10px] leading-4 text-foreground/36">
                Add {missingFields.join(", ")} to prepare a confirmable preview.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Pre-flight Balance Delta Diff for Transfer */}
      {complete && isTransfer && intent.fromToken && intent.amount && (
        <div className="px-4 pt-3">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-black/[0.07] bg-[#fafafa] p-2.5 text-xs shadow-2xs">
            <div className="rounded-xl border border-black/[0.04] bg-white p-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">You Send</span>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="font-mono text-sm font-semibold text-foreground/90 tabular-nums">-{formatDisplayAmount(intent.amount)}</span>
                <span className="text-xs font-semibold text-foreground/60">{intent.fromToken}</span>
              </div>
            </div>
            <div className="rounded-xl border border-black/[0.04] bg-white p-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Recipient</span>
              <div className="mt-0.5">
                <span className="font-mono text-xs font-semibold text-foreground/80" title={intent.recipient || ""}>
                  {intent.recipient ? `${intent.recipient.slice(0, 6)}...${intent.recipient.slice(-4)}` : "Target Address"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pre-flight Permission Summary for Approve / Revoke */}
      {complete && (isApprove || isRevoke) && intent.fromToken && (
        <div className="px-3 sm:px-4 pt-2.5 sm:pt-3">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 rounded-2xl border border-black/[0.07] bg-[#fafafa] p-2 sm:p-2.5 text-xs shadow-2xs">
            <div className="min-w-0 rounded-xl border border-black/[0.04] bg-white p-2">
              <span className="text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-wider text-foreground/45 truncate block">
                {isRevoke ? "Revoke Token" : "Approve Token"}
              </span>
              <div className="mt-0.5 flex min-w-0 items-baseline gap-1">
                <span className="truncate font-mono text-xs sm:text-sm font-semibold text-foreground/90 tabular-nums">
                  {isRevoke ? "0" : (formatDisplayAmount(intent.amount) || "Unlimited")}
                </span>
                <span className="truncate text-[11px] sm:text-xs font-semibold text-foreground/60">{intent.fromToken}</span>
              </div>
            </div>
            <div className="min-w-0 rounded-xl border border-black/[0.04] bg-white p-2">
              <span className="text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-wider text-foreground/45 truncate block">Spender Contract</span>
              <div className="mt-0.5">
                <span className="truncate block font-mono text-[11px] sm:text-xs font-semibold text-foreground/80" title={intent.spender || ""}>
                  {intent.spender ? `${intent.spender.slice(0, 6)}...${intent.spender.slice(-4)}` : "Verified Contract"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pre-flight Balance Delta Diff for Swap */}
      {complete && !isTransfer && !isApprove && !isRevoke && intent.fromToken && intent.toToken && intent.amount && (
        <div className="px-3 sm:px-4 pt-2.5 sm:pt-3">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 rounded-2xl border border-black/[0.07] bg-[#fafafa] p-2 sm:p-2.5 text-xs shadow-2xs">
            <div className="min-w-0 rounded-xl border border-black/[0.04] bg-white p-2">
              <span className="text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-wider text-foreground/45 truncate block">You Pay</span>
              <div className="mt-0.5 flex min-w-0 items-baseline gap-1">
                <span className="truncate font-mono text-xs sm:text-sm font-semibold text-foreground/90 tabular-nums">-{formatDisplayAmount(intent.amount)}</span>
                <span className="truncate text-[11px] sm:text-xs font-semibold text-foreground/60">{intent.fromToken}</span>
              </div>
            </div>
            <div className="min-w-0 rounded-xl border border-[#16845c]/15 bg-[#16845c]/[0.03] p-2">
              <span className="text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-wider text-[#16845c]/80 truncate block">Est. Receive</span>
              <div className="mt-0.5 flex min-w-0 items-baseline gap-1">
                <span className="truncate font-mono text-xs sm:text-sm font-semibold text-[#16845c] tabular-nums">
                  Market quote
                </span>
                <span className="truncate text-[11px] sm:text-xs font-semibold text-[#16845c]/90">{intent.toToken}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parameter Tuner for Trade on Testnet */}
      {complete && !isMainnet && !blocked && (
        <div className="px-3 sm:px-4 pt-2.5 sm:pt-3">
          <ParameterTuner
            slippage={slippage}
            preserveGas={preserveGas}
            showSlippage={!isTransfer && !isApprove && !isRevoke}
            onChangeSlippage={(val) => handleSlippageChange(val)}
            onTogglePreserveGas={(val) => handlePreserveGasChange(val)}
          />
        </div>
      )}

      <div className="px-3.5 sm:px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
          <button
            type="button"
            aria-expanded={checksOpen}
            onClick={() => setChecksOpen((value) => !value)}
            className="group flex min-w-0 items-center gap-2 rounded-lg text-left text-xs font-medium text-foreground/65 transition-colors hover:text-foreground active:scale-[0.98]"
          >
            <span className="flex gap-0.5" aria-hidden>
              {[0, 1, 2].map((bar) => (
                <span
                  key={bar}
                  className={cn(
                    "h-3 w-[3px] rounded-full transition-colors",
                    blocked
                      ? "bg-[#d94b2a]"
                      : isMainnet
                        ? "bg-foreground/30"
                        : confirmable
                          ? "bg-[#16845c]"
                          : "bg-[#a8651c]",
                  )}
                />
              ))}
            </span>
            <span className="truncate">
              {blocked
                ? "Preflight checks blocked"
                : isMainnet
                  ? `${passedCount} of ${totalCount} checks passed (Preview mode)`
                  : confirmable
                    ? `${passedCount} of ${totalCount} checks passed`
                    : "Intent incomplete"}
            </span>
            <ChevronDownIcon
              size={11}
              className={cn("shrink-0 text-foreground/40 transition-transform duration-300", checksOpen && "rotate-180")}
            />
          </button>

          {isMainnet ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8.5 w-full sm:w-auto rounded-full border-black/[0.1] bg-white px-3.5 text-xs font-medium text-foreground/75 shadow-xs transition-all hover:bg-black/[0.04] active:scale-[0.97] justify-center"
              onClick={() => onConfirm()}
            >
              <RotateCw className="mr-1.5 size-3" />
              Refresh quote
            </Button>
          ) : !walletConnected ? (
            <Button
              type="button"
              size="sm"
              className="h-9 sm:h-8.5 w-full sm:w-auto rounded-full bg-[#FE6501] px-4 text-xs font-semibold text-white shadow-xs transition-all duration-150 hover:bg-[#e25a00] active:scale-[0.97] disabled:opacity-40 disabled:hover:bg-[#FE6501] justify-center"
              disabled={!complete || blocked || quoteFailed}
              onClick={() => {
                void appKit.open({ view: "Connect", namespace: "eip155" })
              }}
            >
              <WalletCards className="mr-1.5 size-3.5 shrink-0" />
              <span className="truncate">{buttonLabel}</span>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="h-9 sm:h-8.5 w-full sm:w-auto rounded-full bg-[#FE6501] px-4 text-xs font-semibold text-white shadow-xs transition-all duration-150 hover:bg-[#e25a00] active:scale-[0.97] disabled:opacity-40 disabled:hover:bg-[#FE6501] justify-center"
              disabled={!confirmable || confirming}
              onMouseEnter={() => confirmButtonIconRef.current?.startAnimation()}
              onFocus={() => confirmButtonIconRef.current?.startAnimation()}
              onClick={() => {
                if (!confirming) confirmButtonIconRef.current?.startAnimation()
                onConfirm()
              }}
            >
              {confirming ? (
                <LoaderCircle className="mr-1.5 size-3 shrink-0 animate-spin" />
              ) : (
                <CircleCheckIcon ref={confirmButtonIconRef} size={14} className="mr-1.5 shrink-0" />
              )}
              <span className="truncate">{buttonLabel}</span>
            </Button>
          )}
        </div>

        {checksOpen ? (
          <div className="mt-3 space-y-2 rounded-xl border border-black/[0.06] bg-black/[0.02] p-3 text-xs">
            {activeChecks.map((item) => (
              <div key={item.id} className="flex items-start gap-2 text-foreground/75">
                <span className={cn(
                  "mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full text-[10px]",
                  item.status === "pass"
                    ? "bg-[#16845c]/15 text-[#16845c]"
                    : item.status === "block"
                      ? "bg-[#d94b2a]/15 text-[#d94b2a]"
                      : item.status === "warn"
                        ? "bg-[#a8651c]/15 text-[#a8651c]"
                        : "bg-black/[0.06] text-foreground/40",
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
                  <span className="font-medium text-foreground/90">{item.label}</span>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/50">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
