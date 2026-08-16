"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"

interface DocsCodeBlockProps {
  code: string
  language?: string
  filename?: string
  className?: string
}

export function DocsCodeBlock({
  code,
  language = "bash",
  filename,
  className,
}: DocsCodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.trim())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div
      className={cn(
        "group relative my-5 overflow-hidden rounded-xl border border-black/[0.08] bg-[#18191d] text-white shadow-2xs",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[11px] font-mono text-white/50">
        <span className="truncate">{filename || language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-sans font-medium text-white/75 transition-all hover:bg-white/[0.12] hover:text-white active:scale-95"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3 text-white/60" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-zinc-100 selection:bg-[#FE6501]/40 selection:text-white">
        <pre className="m-0 font-mono">
          <code>{code.trim()}</code>
        </pre>
      </div>
    </div>
  )
}
