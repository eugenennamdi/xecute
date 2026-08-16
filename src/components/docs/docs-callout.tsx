import { type ReactNode } from "react"

import { cn } from "@/lib/utils"

export type CalloutType =
  | "note"
  | "important"
  | "warning"
  | "testnet"
  | "mainnet"
  | "security"
  | "tip"

interface DocsCalloutProps {
  type?: CalloutType
  title?: string
  children: ReactNode
  className?: string
}

const calloutConfig: Record<
  CalloutType,
  { bg: string; text: string; title: string }
> = {
  note: {
    bg: "bg-white",
    text: "text-foreground",
    title: "Note",
  },
  important: {
    bg: "bg-white",
    text: "text-foreground",
    title: "Core Operating Principle",
  },
  warning: {
    bg: "bg-white",
    text: "text-foreground",
    title: "Warning",
  },
  testnet: {
    bg: "bg-white",
    text: "text-foreground",
    title: "X Layer Testnet (1952)",
  },
  mainnet: {
    bg: "bg-white",
    text: "text-foreground",
    title: "X Layer Mainnet (196)",
  },
  security: {
    bg: "bg-white",
    text: "text-foreground",
    title: "Security Boundary",
  },
  tip: {
    bg: "bg-[#fafafa]",
    text: "text-foreground",
    title: "Pro Tip",
  },
}

export function DocsCallout({
  type = "note",
  title,
  children,
  className,
}: DocsCalloutProps) {
  const config = calloutConfig[type]

  return (
    <div
      className={cn(
        "my-6 rounded-2xl border border-black/[0.08] bg-white p-5 text-xs leading-relaxed transition-colors shadow-2xs",
        config.bg,
        config.text,
        className,
      )}
    >
      <div className="space-y-1.5">
        <p className="text-xs font-semibold tracking-tight text-foreground/90">
          {title || config.title}
        </p>
        <div className="text-xs text-foreground/80 space-y-2 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  )
}
