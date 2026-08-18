"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  LineChart,
  RefreshCw,
  Shield,
} from "lucide-react"

import { ExecutionTrace, ProcessingTrace } from "@/components/ai/execution-trace"
import { GroundingDetails } from "@/components/ai/grounding-details"
import { StreamingText } from "@/components/ai/streaming-text"
import { MarkdownContent } from "@/components/chat/markdown-content"
import { XLayerIcon } from "@/components/brand/x-layer-icon"
import { XecuteMark } from "@/components/brand/xecute-mark"
import { InlineExecution } from "@/components/execution/inline-execution"
import { Button } from "@/components/ui/button"
import { Copy01Icon, type Copy01IconHandle } from "@/components/ui/copy-01"
import { SentIcon, type SentIconHandle } from "@/components/ui/sent"
import { Textarea } from "@/components/ui/textarea"
import type { Mode } from "@/lib/intents"
import { modeCopy } from "@/config/constants"
import type { ChatMessage } from "@/lib/store"
import { useTerminalStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Kbd } from "@/components/ui/kbd"

const promptIcons: Record<Mode, LucideIcon> = {
  trade: ArrowLeftRight,
  earn: CircleDollarSign,
  predict: LineChart,
  protect: Shield,
}

const modePlaceholders: Record<Mode, string> = {
  trade: "Describe an onchain action, swap, transfer, or yield query...",
  earn: "Search live yield opportunities or liquidity strategies on X Layer...",
  predict: "Model a market scenario, price stress test, or liquidity shock...",
  protect: "Inspect wallet security, contract risk, or token approvals...",
}

const exampleChips: { label: string; mode: Mode; prompt: string }[] = [
  { label: "Swap 5 USDT → OKB", mode: "trade", prompt: "Swap 5 USDT to OKB with max 0.5% slippage" },
  { label: "Best USDT yield on X Layer", mode: "earn", prompt: "Find the best live USDT yield opportunities on X Layer" },
  { label: "Scan wallet for risky approvals", mode: "protect", prompt: "Check my risky token approvals and allowances" },
  { label: "Stress-test OKB -10% drop", mode: "predict", prompt: "What happens if OKB drops 10%?" },
]

const commands = (Object.keys(promptIcons) as Mode[]).map((mode) => ({
  mode,
  command: `/${mode}`,
  description: modeCopy[mode].description,
  Icon: promptIcons[mode],
}))

function MessageActions({
  content,
  onRetry,
  disabled,
}: {
  content: string
  onRetry?: () => void
  disabled: boolean
}) {
  const [copied, setCopied] = useState(false)
  const copyIconRef = useRef<Copy01IconHandle>(null)

  async function copyResponse() {
    try {
      await navigator.clipboard.writeText(content)
      copyIconRef.current?.startAnimation()
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mt-2 flex min-h-7 items-center gap-1 text-foreground/32 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/message:opacity-100 sm:group-focus-within/message:opacity-100">
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={copyResponse}
              className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-foreground/[0.055] hover:text-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={copied ? "Response copied" : "Copy response"}
            >
              {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy01Icon ref={copyIconRef} size={14} />}
            </button>
          }
        />
        <TooltipContent>{copied ? "Copied to clipboard" : "Copy response"}</TooltipContent>
      </Tooltip>

      {onRetry ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={onRetry}
                disabled={disabled}
                className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-foreground/[0.055] hover:text-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-35"
                aria-label="Try this prompt again"
              >
                <RefreshCw className="size-3.5" />
              </button>
            }
          />
          <TooltipContent>Retry prompt</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}

function precedingUserPrompt(messages: ChatMessage[], messageIndex: number) {
  for (let index = messageIndex - 1; index >= 0; index -= 1) {
    if (messages[index].role === "user") return messages[index].content
  }

  return undefined
}

export function ChatArea() {
  const [prompt, setPrompt] = useState("")
  const [activeCommand, setActiveCommand] = useState(0)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const messages = useTerminalStore((state) => state.messages)
  const activeMode = useTerminalStore((state) => state.activeMode)
  const status = useTerminalStore((state) => state.status)
  const isAgentRunning = useTerminalStore((state) => state.isAgentRunning)
  const currentIntent = useTerminalStore((state) => state.currentIntent)
  const setMode = useTerminalStore((state) => state.setMode)
  const submitPrompt = useTerminalStore((state) => state.submitPrompt)
  const finishStreamingMessage = useTerminalStore((state) => state.finishStreamingMessage)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const shouldFollowRef = useRef(true)
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const sendIconRef = useRef<SentIconHandle>(null)
  const hasConversation = messages.length > 1
  const isProcessing =
    isAgentRunning ||
    status === "preparing" ||
    status === "awaiting_signature" ||
    status === "broadcast" ||
    status === "pending" ||
    messages.some((m) => m.streaming)
  const commandMatch = prompt.match(/^\/([a-z]*)$/i)
  const filteredCommands = commandMatch
    ? commands.filter((item) => item.command.slice(1).startsWith(commandMatch[1].toLowerCase()))
    : []
  const commandMenuOpen = filteredCommands.length > 0
  const latestAssistantId = [...messages].reverse().find((message) => message.role === "assistant")?.id
  const visibleMessages = messages.filter((message) => message.id !== "welcome")

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      const scroller = scrollerRef.current
      if (!scroller || !shouldFollowRef.current) {
        setShowScrollButton(true)
        return
      }

      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" })
      setShowScrollButton(false)
    })

    return () => window.cancelAnimationFrame(animationFrame)
  }, [messages.length, status])

  function submit(value = prompt) {
    if (!value.trim() || isProcessing) return
    shouldFollowRef.current = true
    setShowScrollButton(false)
    sendIconRef.current?.startAnimation()
    submitPrompt(value)
    setPrompt("")
  }

  function scrollToLatest() {
    const scroller = scrollerRef.current
    if (!scroller) return
    shouldFollowRef.current = true
    setShowScrollButton(false)
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" })
  }

  const followStreamingResponse = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller || !shouldFollowRef.current) return
    scroller.scrollTop = scroller.scrollHeight
  }, [])

  function selectCommand(mode: Mode) {
    setMode(mode)
    setPrompt("")
    window.requestAnimationFrame(() => promptRef.current?.focus())
  }

  const safeMode: Mode = activeMode in modeCopy ? activeMode : "trade"
  const ActiveModeIcon = promptIcons[safeMode] ?? promptIcons.trade
  const composer = (
    <div className="relative w-full">
      {commandMenuOpen ? (
        <div
          className="absolute inset-x-0 bottom-[calc(100%+10px)] z-20 overflow-hidden rounded-2xl border border-black/[0.07] bg-white p-1.5 shadow-[0_16px_44px_rgba(20,20,20,0.1)]"
          role="listbox"
          aria-label="Xecute commands"
        >
          {filteredCommands.map((item, index) => (
            <button
              key={item.mode}
              type="button"
              role="option"
              aria-selected={index === activeCommand}
              onMouseEnter={() => setActiveCommand(index)}
              onClick={() => selectCommand(item.mode)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                index === activeCommand ? "bg-black/[0.05]" : "hover:bg-black/[0.03]",
              )}
            >
              <span className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                index === activeCommand ? "bg-white text-[#FE6501] shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "bg-black/[0.04] text-foreground/60"
              )}>
                <item.Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-foreground/85">{modeCopy[item.mode]?.label ?? item.mode}</span>
                <span className="block truncate text-[11px] text-foreground/45">{item.description}</span>
              </span>
              {item.mode === safeMode ? <Check className="size-3.5 text-[#FE6501]" /> : null}
            </button>
          ))}
        </div>
      ) : null}

      <form
        className={cn(
          "w-full rounded-[22px] border border-black/[0.08] bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_12px_36px_rgba(0,0,0,0.05)] transition-[border-color,box-shadow] duration-200 focus-within:border-black/[0.2] focus-within:shadow-[0_1px_3px_rgba(0,0,0,0.04),0_16px_40px_rgba(0,0,0,0.07)]",
        )}
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <Textarea
          ref={promptRef}
          value={prompt}
          onChange={(event) => {
            setPrompt(event.target.value)
            setActiveCommand(0)
          }}
          onKeyDown={(event) => {
            if (commandMenuOpen && event.key === "ArrowDown") {
              event.preventDefault()
              setActiveCommand((current) => (current + 1) % filteredCommands.length)
              return
            }
            if (commandMenuOpen && event.key === "ArrowUp") {
              event.preventDefault()
              setActiveCommand((current) => (current - 1 + filteredCommands.length) % filteredCommands.length)
              return
            }
            if (commandMenuOpen && event.key === "Escape") {
              event.preventDefault()
              setPrompt("")
              return
            }
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              if (commandMenuOpen) {
                selectCommand(filteredCommands[activeCommand].mode)
                return
              }
              submit()
            }
          }}
          disabled={isProcessing}
          placeholder={modePlaceholders[safeMode] ?? modePlaceholders.trade}
          className="min-h-[58px] max-h-40 resize-none border-0 bg-transparent px-3 py-2.5 text-[15px] leading-6 text-foreground shadow-none placeholder:text-foreground/40 focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
          aria-label="Onchain action prompt"
        />
        <div className="flex items-center justify-between gap-3 px-1 pt-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="group/mode flex h-8 items-center gap-1.5 rounded-full bg-black/[0.045] px-2.5 text-xs font-medium text-foreground/70 transition-colors hover:bg-black/[0.075] hover:text-foreground"
                    aria-label="Change mode"
                  >
                    <ActiveModeIcon className="size-3.5 transform-gpu transition-transform duration-300 ease-out group-hover/mode:translate-x-0.5" />
                    <span>{modeCopy[safeMode]?.label ?? "Trade"}</span>
                    <ChevronDown className="size-3 transform-gpu text-foreground/38 transition-transform duration-300 ease-out group-hover/mode:translate-y-0.5" />
                  </button>
                }
              />
              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-64 rounded-2xl border border-black/[0.08] bg-white p-1.5 shadow-[0_16px_40px_rgba(20,20,20,0.1)]"
              >
                {(Object.keys(modeCopy) as Mode[]).map((mode) => {
                  const Icon = promptIcons[mode]
                  const isSelected = safeMode === mode
                  return (
                    <DropdownMenuItem
                      key={mode}
                      onClick={() => {
                        setMode(mode)
                        if (prompt.startsWith("/")) setPrompt("")
                        window.requestAnimationFrame(() => promptRef.current?.focus())
                      }}
                      className={cn(
                        "group flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                        isSelected ? "bg-black/[0.045]" : "hover:bg-black/[0.035]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                          isSelected
                            ? "bg-white text-[#FE6501] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                            : "bg-black/[0.04] text-foreground/60 group-hover:text-foreground/80",
                        )}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-foreground/90">{modeCopy[mode]?.label ?? mode}</span>
                        <span className="block truncate text-[11px] text-foreground/45">{modeCopy[mode]?.description}</span>
                      </span>
                      {isSelected ? <Check className="size-3.5 text-[#FE6501]" /> : null}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={
                  <div
                    role="button"
                    tabIndex={0}
                    className="group/network hidden h-8 cursor-default items-center gap-1.5 rounded-full bg-black/[0.045] px-2.5 text-xs font-medium text-foreground/70 transition-colors hover:bg-black/[0.075] hover:text-foreground sm:flex"
                    aria-label="X Layer Network Environments"
                  >
                    <XLayerIcon className="size-3.5 text-foreground/80" />
                    <span>X Layer</span>
                  </div>
                }
              />
              <TooltipContent side="top" align="start" className="w-[280px] border border-black/10 bg-white p-3.5 shadow-xl">
                <div className="space-y-2.5 text-left text-xs">
                  <div className="border-b border-black/[0.06] pb-2">
                    <span className="font-semibold text-foreground">X Layer Environments</span>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-foreground/90">
                      Testnet (Chain ID 1952)
                    </div>
                    <p className="text-[11px] leading-relaxed text-foreground/60">
                      Active onchain execution for swaps, transfers, approvals & testnet faucet sandbox.
                    </p>
                  </div>
                  <div className="space-y-1 border-t border-black/[0.06] pt-2">
                    <div className="font-medium text-foreground/90">
                      Mainnet (Chain ID 196)
                    </div>
                    <p className="text-[11px] leading-relaxed text-foreground/60">
                      Live DeFi yield discovery, DEX quotes & security scans (Read-only in this version).
                    </p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="submit"
                  size="icon"
                  disabled={!prompt.trim() || isProcessing}
                  onMouseEnter={() => sendIconRef.current?.startAnimation()}
                  onFocus={() => sendIconRef.current?.startAnimation()}
                  className="size-9 shrink-0 rounded-full bg-[#FE6501] text-white shadow-[0_2px_8px_rgba(254,101,1,0.25)] transition-all hover:bg-[#e55b01] active:scale-95 disabled:bg-black/[0.06] disabled:text-foreground/22 disabled:shadow-none"
                  aria-label="Send prompt"
                >
                  <SentIcon ref={sendIconRef} size={17} />
                </Button>
              }
            />
            <TooltipContent side="top">
              <span>Send prompt</span>
              <Kbd className="ml-1.5 text-[9px]">Enter</Kbd>
            </TooltipContent>
          </Tooltip>
        </div>
      </form>
    </div>
  )

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[#fafafa]">
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollerRef}
          onScroll={(event) => {
            const scroller = event.currentTarget
            const isNearBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 96
            shouldFollowRef.current = isNearBottom
            setShowScrollButton(!isNearBottom)
          }}
          className="absolute inset-0 overflow-y-auto"
        >
        <div className="mx-auto flex min-h-full w-full max-w-[820px] flex-col px-3.5 pb-8 sm:px-6">
          {!hasConversation ? (
            <div className="my-auto w-full py-6 sm:py-12">
              <div className="mb-6 text-center sm:mb-8">
                <div className="group/brand mb-4 flex items-center justify-center sm:mb-5" aria-hidden>
                  <XecuteMark className="size-8 transform-gpu text-[#FE6501] transition-transform duration-300 ease-out group-hover/brand:scale-105 sm:size-9" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-[#121316] sm:text-[32px]">
                  Execute anything on X Layer.
                </h1>
                <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-foreground/60 sm:mt-2.5 sm:text-sm">
                  Natural language execution, verified onchain state, and preflight safety checks.
                </p>
              </div>

              {composer}

              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 sm:mt-4 sm:gap-2">
                {exampleChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => {
                      setMode(chip.mode)
                      submit(chip.prompt)
                    }}
                    className="inline-flex items-center rounded-full border border-black/[0.08] bg-white px-3 py-1 text-[11.5px] sm:px-3.5 sm:py-1.5 sm:text-xs font-medium text-foreground/75 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-150 hover:border-black/[0.18] hover:bg-[#fafafa] hover:text-foreground active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-7 pb-8 pt-6 sm:space-y-9 sm:pb-10 sm:pt-12">
              {visibleMessages.map((message, messageIndex) => {
                const retryPrompt = precedingUserPrompt(visibleMessages, messageIndex)

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="group/message flex w-full min-w-0 items-start gap-2.5 sm:gap-3">
                        <div className="mt-1 flex size-5.5 sm:size-6 shrink-0 items-center justify-center" aria-hidden>
                          <XecuteMark className="size-4 sm:size-[18px] text-[#FE6501]" />
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          {message.id === "welcome" ? (
                            <p className="text-[14.5px] sm:text-[15px] leading-7 text-foreground/78">
                              {message.content}
                            </p>
                          ) : message.streaming ? (
                            <StreamingText
                              text={message.content}
                              onProgress={message.id === latestAssistantId ? followStreamingResponse : undefined}
                              onComplete={() => finishStreamingMessage(message.id)}
                            />
                          ) : (
                            <MarkdownContent content={message.content} />
                          )}
                          {message.agent ? (
                            <GroundingDetails metadata={message.agent} />
                          ) : message.mode ? (
                            <ExecutionTrace mode={message.mode} />
                          ) : null}
                          {message.id === latestAssistantId && currentIntent && !message.streaming ? (
                            <InlineExecution key={currentIntent.rawPrompt} />
                          ) : null}
                          {message.id !== "welcome" ? (
                            <MessageActions
                              content={message.content}
                              onRetry={retryPrompt ? () => submit(retryPrompt) : undefined}
                              disabled={isProcessing}
                            />
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-[90%] rounded-[18px] border border-black/[0.04] bg-black/[0.045] px-3.5 py-2 text-[13.5px] leading-6 text-foreground/85 sm:max-w-[76%] sm:px-4 sm:py-2.5 sm:text-[14px] break-words">
                        {message.content}
                      </div>
                    )}
                  </div>
                )
              })}
              {isProcessing ? (
                <div className="flex justify-start">
                  <div className="flex max-w-[96%] items-start gap-2.5 sm:max-w-[86%] sm:gap-3">
                    <div className="mt-1 flex size-5.5 sm:size-6 shrink-0 items-center justify-center" aria-hidden>
                      <XecuteMark className="size-4 sm:size-[18px] text-[#FE6501]" />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <ProcessingTrace
                        mode={activeMode}
                        prompt={[...visibleMessages].reverse().find((m) => m.role === "user")?.content}
                        status={status}
                        intent={currentIntent}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
        </div>
        {showScrollButton ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={scrollToLatest}
            className="absolute bottom-3 right-3 z-10 size-8 rounded-full border-black/[0.08] bg-white text-foreground/55 shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:bg-white hover:text-foreground sm:bottom-4 sm:right-8 sm:size-9"
            aria-label="Scroll to latest message"
            title="Scroll to latest"
          >
            <ArrowDownToLine className="size-3.5 sm:size-4" />
          </Button>
        ) : null}
      </div>

      {hasConversation ? (
        <div className="shrink-0 bg-[linear-gradient(to_top,#fafafa_82%,rgba(250,250,250,0))] px-3 pb-3 pt-3 sm:px-6 sm:pb-6 sm:pt-5">
          <div className="mx-auto w-full max-w-[820px]">{composer}</div>
        </div>
      ) : null}
    </div>
  )
}
