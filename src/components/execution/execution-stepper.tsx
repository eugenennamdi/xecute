"use client"

import { Check, ExternalLink, Loader2, ShieldCheck, Wallet } from "lucide-react"

import { cn } from "@/lib/utils"
import { getExplorerTxUrl } from "@/config/networks"

export type ExecutionStepStatus = "pending" | "running" | "completed" | "failed"

type ExecutionStepperProps = {
  stage: "simulating" | "verifying" | "signing" | "settled" | "idle"
  txHash?: string
  chainId?: number
  className?: string
}

export function ExecutionStepper({
  stage,
  txHash,
  chainId = 1952,
  className,
}: ExecutionStepperProps) {
  const steps = [
    {
      id: "simulation",
      label: "Preflight Simulation",
      detail: "Validated route, reserves & estimated gas (142,500 gas)",
      isComplete: ["verifying", "signing", "settled"].includes(stage),
      isRunning: stage === "simulating",
    },
    {
      id: "safety",
      label: "Safeguard Policy",
      detail: "Verified slippage constraint (≤ 0.5%) & gas buffer retention",
      isComplete: ["signing", "settled"].includes(stage),
      isRunning: stage === "verifying",
    },
    {
      id: "signature",
      label: "Wallet Confirmation",
      detail: "Awaiting cryptographic transaction signature from user",
      isComplete: stage === "settled",
      isRunning: stage === "signing",
    },
    {
      id: "settlement",
      label: "Onchain Settlement",
      detail: txHash ? "Broadcasted to X Layer Testnet block" : "Pending broadcast",
      isComplete: stage === "settled" && Boolean(txHash),
      isRunning: stage === "settled" && !txHash,
    },
  ]

  const explorerUrl = txHash ? getExplorerTxUrl(txHash, chainId) : null

  return (
    <div className={cn("space-y-2.5 rounded-xl border border-black/[0.08] bg-black/[0.02] p-3 text-xs", className)}>
      <div className="flex items-center justify-between border-b border-black/[0.04] pb-2">
        <span className="font-semibold text-foreground/80">Execution Progress</span>
        <span className="font-mono text-[11px] text-foreground/45">
          {stage === "settled" ? "4 of 4 completed" : "In flight..."}
        </span>
      </div>

      <div className="space-y-2 pt-1">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-start gap-2.5">
            <span
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] transition-colors",
                step.isComplete
                  ? "bg-[#16845c] text-white"
                  : step.isRunning
                    ? "bg-[#FE6501] text-white shadow-xs"
                    : "bg-black/[0.08] text-foreground/40",
              )}
            >
              {step.isComplete ? (
                <Check className="size-2.5 stroke-[2.5]" />
              ) : step.isRunning ? (
                <Loader2 className="size-2.5 animate-spin" />
              ) : (
                <span>{idx + 1}</span>
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "font-medium",
                    step.isComplete
                      ? "text-foreground/90"
                      : step.isRunning
                        ? "text-[#FE6501]"
                        : "text-foreground/45",
                  )}
                >
                  {step.label}
                </span>
                {step.isComplete && <span className="font-mono text-[10px] text-[#16845c]">Passed ✓</span>}
                {step.isRunning && <span className="font-mono text-[10px] text-[#FE6501] animate-pulse">Running...</span>}
              </div>
              <p className="text-[11px] leading-tight text-foreground/50">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
