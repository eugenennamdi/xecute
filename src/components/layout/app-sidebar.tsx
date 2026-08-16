"use client"

import Link from "next/link"
import { useRef } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowLeftRight,
  BookOpen,
  CircleDollarSign,
  LineChart,
  MessageSquare,
  MoreHorizontal,
  PanelLeft,
  PanelLeftClose,
  Shield,
  Trash2,
} from "lucide-react"

import { GithubIcon } from "@/components/brand/github-icon"
import { XSocialIcon } from "@/components/brand/x-social-icon"
import { XecuteMark } from "@/components/brand/xecute-mark"
import { AddCircleIcon, type AddCircleIconHandle } from "@/components/ui/add-circle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import type { Mode } from "@/lib/intents"
import { modeCopy } from "@/config/constants"
import { useTerminalStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const modeIcons: Record<Mode, LucideIcon> = {
  trade: ArrowLeftRight,
  earn: CircleDollarSign,
  predict: LineChart,
  protect: Shield,
}

type AppSidebarProps = {
  collapsed?: boolean
  onToggle?: () => void
  onClose?: () => void
}

export function AppSidebar({ collapsed = false, onToggle, onClose }: AppSidebarProps) {
  const newChatIconRef = useRef<AddCircleIconHandle>(null)
  const activeMode = useTerminalStore((state) => state.activeMode)
  const setMode = useTerminalStore((state) => state.setMode)
  const newChat = useTerminalStore((state) => state.newChat)
  const conversations = useTerminalStore((state) => state.conversations)
  const conversationId = useTerminalStore((state) => state.conversationId)
  const historyStatus = useTerminalStore((state) => state.historyStatus)
  const loadConversation = useTerminalStore((state) => state.loadConversation)
  const deleteConversation = useTerminalStore((state) => state.deleteConversation)

  function selectMode(mode: Mode) {
    setMode(mode)
    onClose?.()
  }

  // ----------------------------------------------------
  // Collapsed Sidebar (Icon Rail)
  // ----------------------------------------------------
  if (collapsed) {
    return (
      <aside className="flex h-full min-h-0 w-14 flex-col items-center border-r border-black/[0.06] bg-[#f7f8f9] px-1.5 py-2.5">
        {/* Logo / Expand trigger */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={onToggle}
                className="group/brand flex size-9 items-center justify-center rounded-lg hover:bg-black/[0.04] active:scale-95"
                aria-label="Expand sidebar"
              >
                <XecuteMark className="size-5 transform-gpu text-[#FE6501] transition-transform duration-200 ease-out group-hover/brand:scale-110" />
              </button>
            }
          />
          <TooltipContent side="right">Expand sidebar</TooltipContent>
        </Tooltip>

        {/* New chat icon button */}
        <div className="mt-3">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="group/new-chat size-9 rounded-lg bg-black/[0.035] text-foreground/75 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-black/[0.06] hover:text-foreground active:scale-[0.98]"
                  onMouseEnter={() => newChatIconRef.current?.startAnimation()}
                  onFocus={() => newChatIconRef.current?.startAnimation()}
                  onClick={() => {
                    newChat()
                    onClose?.()
                  }}
                  aria-label="New chat"
                >
                  <AddCircleIcon ref={newChatIconRef} size={16} className="text-foreground/60 transition-colors group-hover/new-chat:text-foreground" />
                </Button>
              }
            />
            <TooltipContent side="right">New chat</TooltipContent>
          </Tooltip>
        </div>

        {/* Modes Icon Rail */}
        <nav className="mt-5 flex flex-col items-center gap-1" aria-label="Xecute modes">
          {(Object.keys(modeCopy) as Mode[]).map((mode) => {
            const Icon = modeIcons[mode]
            const isActive = activeMode === mode
            return (
              <Tooltip key={mode}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      data-icon-motion={mode}
                      onClick={() => selectMode(mode)}
                      className={cn(
                        "group flex size-9 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "border border-black/[0.05] bg-white text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                          : "text-foreground/55 hover:bg-black/[0.035] hover:text-foreground/85",
                      )}
                      aria-label={modeCopy[mode].label}
                    >
                      <Icon
                        className={cn(
                          "xecute-responsive-icon size-4 transform-gpu transition-colors",
                          isActive ? "text-[#FE6501]" : "text-foreground/50 group-hover:text-foreground/80",
                        )}
                      />
                    </button>
                  }
                />
                <TooltipContent side="right">{modeCopy[mode].label}</TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto flex flex-col items-center gap-1.5 pt-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href="/docs"
                  className="flex size-8 items-center justify-center rounded-lg text-foreground/40 hover:bg-black/[0.04] hover:text-foreground"
                  aria-label="Documentation"
                >
                  <BookOpen className="size-4" />
                </Link>
              }
            />
            <TooltipContent side="right">Documentation</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <a
                  href="https://x.com/xecute_xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-8 items-center justify-center rounded-lg text-foreground/40 hover:bg-black/[0.04] hover:text-foreground"
                  aria-label="X (Twitter)"
                >
                  <XSocialIcon className="size-3.5" />
                </a>
              }
            />
            <TooltipContent side="right">X (@xecute_xyz)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-8 text-foreground/40 hover:bg-foreground/[0.06] hover:text-foreground"
                  onClick={onToggle}
                  aria-label="Expand sidebar"
                >
                  <PanelLeft className="size-4" />
                </Button>
              }
            />
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    )
  }

  // ----------------------------------------------------
  // Expanded Sidebar
  // ----------------------------------------------------
  return (
    <aside className="flex h-full min-h-0 w-[252px] flex-col border-r border-black/[0.06] bg-[#f7f8f9] px-2.5 py-2.5">
      <div className="flex h-10 items-center justify-between px-1.5">
        <div className="group/brand flex items-center gap-2">
          <XecuteMark className="size-5 shrink-0 transform-gpu text-[#FE6501] transition-transform duration-300 ease-out group-hover/brand:scale-105" />
          <p className="text-[15px] font-semibold text-[#121316]">Xecute</p>
        </div>
        {onToggle || onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 text-foreground/40 hover:bg-foreground/[0.06] hover:text-foreground"
            onClick={onClose || onToggle}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="mt-3">
        <Button
          type="button"
          variant="outline"
          className="group/new-chat flex h-9 w-full items-center justify-start gap-2 rounded-lg border-black/[0.08] bg-white px-2.5 text-xs font-medium text-foreground/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-black/20 hover:bg-white hover:text-foreground active:scale-[0.99]"
          onMouseEnter={() => newChatIconRef.current?.startAnimation()}
          onFocus={() => newChatIconRef.current?.startAnimation()}
          onClick={() => {
            newChat()
            onClose?.()
          }}
        >
          <AddCircleIcon ref={newChatIconRef} size={16} className="text-foreground/60 transition-colors group-hover/new-chat:text-foreground" />
          <span>New chat</span>
        </Button>
      </div>

      <nav className="mt-5 space-y-1" aria-label="Xecute modes">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/55">Modes</p>
        <div className="mt-1.5 space-y-0.5">
          {(Object.keys(modeCopy) as Mode[]).map((mode) => {
            const Icon = modeIcons[mode]
            const isActive = activeMode === mode
            return (
              <button
                key={mode}
                type="button"
                data-icon-motion={mode}
                onClick={() => selectMode(mode)}
                className={cn(
                  "group flex min-h-8 w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                  isActive
                    ? "border border-black/[0.05] bg-white font-semibold text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    : "font-normal text-foreground/75 hover:bg-black/[0.04] hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "xecute-responsive-icon size-3.5 shrink-0 transform-gpu transition-colors",
                    isActive ? "text-[#FE6501]" : "text-foreground/50 group-hover:text-foreground/80",
                  )}
                />
                <span className="flex-1">{modeCopy[mode].label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <div className="mt-6 min-h-0 flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/55">Recents</p>
          {historyStatus === "loading" ? <span className="size-1.5 animate-pulse rounded-full bg-[#18191d]" /> : null}
        </div>
        <div className="mt-1.5 max-h-full space-y-0.5 overflow-y-auto pb-3">
          {conversations.length ? conversations.map((conversation) => {
            const isCurrent = conversation.id === conversationId
            return (
              <div
                key={conversation.id}
                className={cn(
                  "group relative flex min-h-8 w-full items-center rounded-lg px-2 py-1 text-left text-xs transition-colors",
                  isCurrent
                    ? "bg-black/[0.065] font-semibold text-foreground"
                    : "font-normal text-foreground/72 hover:bg-black/[0.04] hover:text-foreground",
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    void loadConversation(conversation.id)
                    onClose?.()
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  title={conversation.title}
                >
                  <MessageSquare className="size-3.5 shrink-0 transform-gpu text-foreground/45 transition-transform duration-300 ease-out group-hover:-rotate-[4deg] group-hover:scale-105" />
                  <span className="min-w-0 flex-1 truncate">{conversation.title}</span>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="flex size-6 shrink-0 items-center justify-center rounded-md text-foreground/45 opacity-0 transition-opacity hover:bg-black/[0.06] hover:text-foreground group-hover:opacity-100 data-open:opacity-100"
                        aria-label="Chat options"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </button>
                    }
                  />
                  <DropdownMenuContent side="right" align="start" sideOffset={6} className="w-36">
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        void deleteConversation(conversation.id)
                      }}
                      className="cursor-pointer gap-2 text-xs font-medium text-red-600 focus:bg-red-50 focus:text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Delete chat</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          }) : (
            <p className="px-2.5 py-3 text-xs leading-relaxed text-foreground/50">
              {historyStatus === "unavailable" ? "History unavailable" : "No saved conversations yet"}
            </p>
          )}
        </div>
      </div>

      {/* Sidebar Utility Footer */}
      <div className="mt-auto border-t border-black/[0.06] pt-2.5 px-1 space-y-0.5">
        <Link
          href="/docs"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground/65 transition-colors hover:bg-black/[0.04] hover:text-foreground"
        >
          <BookOpen className="size-3.5 text-foreground/45" />
          <span className="font-medium">Documentation</span>
        </Link>
        <a
          href="https://x.com/xecute_xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground/65 transition-colors hover:bg-black/[0.04] hover:text-foreground"
        >
          <XSocialIcon className="size-3.5 text-foreground/45" />
          <span>X (@xecute_xyz)</span>
        </a>
        <a
          href="https://github.com/eugenennamdi/xecute"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground/65 transition-colors hover:bg-black/[0.04] hover:text-foreground"
        >
          <GithubIcon className="size-3.5 text-foreground/45" />
          <span>GitHub</span>
        </a>
      </div>
    </aside>
  )
}
