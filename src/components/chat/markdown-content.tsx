"use client"

import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"

type MarkdownContentProps = {
  content: string
  className?: string
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="group/code my-3.5 overflow-hidden rounded-xl border border-black/[0.08] bg-[#18191d] text-white shadow-xs">
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-mono text-white/50">
        <span className="uppercase tracking-wider">{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 text-xs font-mono leading-relaxed text-emerald-300 selection:bg-emerald-500/30">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn("xecute-markdown text-[14.5px] leading-7 text-foreground/80", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-5 mb-2.5 text-lg font-bold tracking-tight text-[#121316] first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-4 mb-2 text-[15px] font-semibold tracking-tight text-[#121316] first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3.5 mb-1.5 text-sm font-semibold tracking-tight text-[#121316] first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-7 text-foreground/80">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground/90">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-foreground/85">{children}</em>,
          ul: ({ children }) => (
            <ul className="my-2.5 ml-4 list-disc space-y-1 text-foreground/80 marker:text-foreground/35">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2.5 ml-4 list-decimal space-y-1.5 text-foreground/80 marker:text-foreground/45">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-6">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-[#FE6501]/70 bg-[#FE6501]/[0.03] py-2 pl-3.5 pr-3 italic text-foreground/75 rounded-r-md">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-black/[0.07]" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#FE6501] underline underline-offset-2 transition-opacity hover:opacity-80 break-all"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-3.5 overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse divide-y divide-black/[0.06]">
                  {children}
                </table>
              </div>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-black/[0.03] text-[10px] font-semibold uppercase tracking-wider text-foreground/55">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-black/[0.04] bg-white text-foreground/80">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="transition-colors hover:bg-black/[0.015]">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-semibold text-foreground/65 first:pl-4 last:pr-4">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2 text-xs text-foreground/80 align-middle first:pl-4 last:pr-4">
              {children}
            </td>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const match = /language-(\w+)/.exec(codeClassName || "")
            const isCodeBlock = Boolean(match)
            const codeString = String(children).replace(/\n$/, "")

            if (isCodeBlock) {
              return <CodeBlock language={match?.[1] ?? ""} code={codeString} />
            }

            return (
              <code
                className="rounded bg-black/[0.05] px-1.5 py-0.5 font-mono text-[12.5px] font-medium text-[#121316] break-all"
                {...props}
              >
                {children}
              </code>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
