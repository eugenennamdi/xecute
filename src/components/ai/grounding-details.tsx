"use client"

import { useState } from "react"
import { AlertCircle, Check, Cpu, ExternalLink, Library, ServerOff } from "lucide-react"

import { ChevronDownIcon } from "@/components/ui/chevron-down"
import type { AgentMetadata } from "@/lib/agent-types"
import { cn } from "@/lib/utils"

export function GroundingDetails({ metadata }: { metadata: AgentMetadata }) {
  const [open, setOpen] = useState(false)
  const sourceCount = metadata.sources.length
  const toolCount = metadata.tools.length
  const unavailableCount = metadata.tools.filter((tool) => tool.status !== "complete").length
  const label = metadata.provider === "local" ? "X Layer Knowledge" : "Grounded Intelligence"

  if (metadata.provider === "local" && toolCount === 0 && sourceCount === 0) return null

  return (
    <div className="mt-3 max-w-2xl">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="group inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-2.5 py-1 text-[11.5px] font-medium text-foreground/70 shadow-2xs transition-all hover:border-black/[0.14] hover:bg-[#fafafa] hover:text-foreground active:scale-[0.98]"
      >
        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#FE6501]/10 text-[#FE6501]">
          <Cpu className="size-2.5" />
        </span>
        <span className="font-medium text-foreground/80">{label}</span>
        <span className="text-foreground/25 font-normal">·</span>
        <span className="text-foreground/50 tabular-nums font-normal">
          {toolCount} tool{toolCount === 1 ? "" : "s"} · {sourceCount} source{sourceCount === 1 ? "" : "s"}
        </span>
        {unavailableCount > 0 ? (
          <span className="size-1.5 rounded-full bg-[#a8651c]" title={`${unavailableCount} unavailable tool`} />
        ) : null}
        <ChevronDownIcon
          size={11}
          className={cn("text-foreground/40 transition-transform duration-300 group-hover:text-foreground/60", open && "rotate-180")}
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
          <div className="mt-2 space-y-3 rounded-2xl border border-black/[0.07] bg-[#fafafa] p-3 text-xs shadow-sm">
            {metadata.tools.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10.5px] font-semibold tracking-wider text-foreground/45 uppercase">
                  Executed Tools & Onchain Telemetry
                </p>
                <div className="space-y-1.5">
                  {metadata.tools.map((tool, index) => (
                    <div
                      key={`${tool.name}-${index}`}
                      className="flex items-start gap-2.5 rounded-xl border border-black/[0.05] bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors hover:border-black/[0.1]"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[10px]",
                          tool.status === "complete"
                            ? "bg-[#16845c]/10 text-[#16845c]"
                            : tool.status === "partial" || tool.status === "unavailable"
                              ? "bg-[#a8651c]/10 text-[#a8651c]"
                              : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {tool.status === "complete" ? (
                          <Check className="size-2.5 stroke-[2.5]" />
                        ) : tool.status === "unavailable" ? (
                          <ServerOff className="size-2.5" />
                        ) : tool.status === "partial" ? (
                          <AlertCircle className="size-2.5" />
                        ) : (
                          <AlertCircle className="size-2.5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono text-xs font-semibold text-foreground/90">{tool.label}</p>
                          <span
                            className={cn(
                              "inline-flex h-4 items-center rounded-full px-1.5 text-[9.5px] font-medium",
                              tool.status === "complete"
                                ? "bg-[#16845c]/10 text-[#16845c]"
                                : tool.status === "partial"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : tool.status === "unavailable"
                                    ? "bg-[#a8651c]/10 text-[#a8651c]"
                                    : "bg-destructive/10 text-destructive",
                            )}
                          >
                            {tool.status === "complete"
                              ? "Complete"
                              : tool.status === "partial"
                                ? "Partial"
                                : tool.status === "unavailable"
                                  ? "Unavailable"
                                  : "Error"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/60">{tool.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {metadata.sources.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                <p className="text-[10.5px] font-semibold tracking-wider text-foreground/45 uppercase">
                  Data & Protocol Sources
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {metadata.sources.map((source) => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex max-w-full items-center gap-1.5 rounded-full border border-black/[0.07] bg-white px-2.5 py-1 text-[11px] font-medium text-foreground/75 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:border-[#FE6501]/40 hover:text-[#FE6501]"
                    >
                      <span className="truncate">{source.title}</span>
                      <ExternalLink className="size-2.5 shrink-0 text-foreground/35 transition-transform group-hover:translate-x-0.5 group-hover:text-[#FE6501]" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between border-t border-black/[0.06] pt-2 font-mono text-[10.5px] text-foreground/45">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground/70">Model</span>
                <span>·</span>
                <span className="rounded bg-black/[0.04] px-1 py-0.5 font-medium text-foreground/80">{metadata.model}</span>
              </div>
              <span className="tabular-nums">{(metadata.durationMs / 1000).toFixed(1)}s latency</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
