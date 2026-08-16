"use client"

import { useState } from "react"
import { Braces, Check } from "lucide-react"

import { Copy01Icon } from "@/components/ui/copy-01"

export function IntentCodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-foreground/[0.09] bg-[#f5f7f9] shadow-[0_1px_2px_rgba(23,32,51,0.05)]">
      <div className="flex h-8 items-center justify-between border-b border-foreground/[0.08] bg-white/65 px-2.5">
        <div className="flex items-center gap-2">
          <Braces className="size-3 text-[#FE6501]" />
          <span className="font-mono text-[10px] text-foreground/45">intent.json</span>
          <span className="text-[9px] text-foreground/22">validated</span>
        </div>
        <button
          type="button"
          onClick={copyCode}
          className="flex size-6 items-center justify-center rounded-md text-foreground/28 transition-colors hover:bg-foreground/[0.05] hover:text-foreground/65"
          aria-label="Copy parsed intent"
        >
          {copied ? <Check className="size-3" /> : <Copy01Icon size={13} />}
        </button>
      </div>
      <div className="max-h-52 overflow-auto py-2.5">
        {code.split("\n").map((line, index) => (
          <div key={`${index}-${line}`} className="grid grid-cols-[28px_1fr] px-2.5 font-mono text-[10px] leading-[17px]">
            <span className="select-none text-right text-foreground/16">{index + 1}</span>
            <span className="whitespace-pre pl-3 text-foreground/52">{line}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
