"use client"

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react"
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react"
import { AlertTriangle, Menu, PanelLeft } from "lucide-react"

import { ChatArea } from "@/components/chat/chat-area"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { appKit } from "@/components/providers/appkit-provider"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { XLAYER_NETWORKS } from "@/config/networks"
import { useTerminalStore } from "@/lib/store"

const subscribeToHydration = () => () => undefined
const clientHydrationSnapshot = () => true
const serverHydrationSnapshot = () => false

export function XecuteShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const walletReady = useSyncExternalStore(
    subscribeToHydration,
    clientHydrationSnapshot,
    serverHydrationSnapshot,
  )
  const { address, isConnected, status: walletStatus } = useAppKitAccount({ namespace: "eip155" })
  const { caipNetwork, switchNetwork } = useAppKitNetwork()
  const activeNetwork = useTerminalStore((state) => state.activeNetwork)
  const setWalletConnection = useTerminalStore((state) => state.setWalletConnection)
  const initializeSession = useTerminalStore((state) => state.initializeSession)
  const conversationId = useTerminalStore((state) => state.conversationId)
  const conversations = useTerminalStore((state) => state.conversations)
  const conversationTitle = conversations.find((conversation) => conversation.id === conversationId)?.title

  const currentNetworkConfig = XLAYER_NETWORKS[activeNetwork]
  const targetChainId = currentNetworkConfig.chainId
  const walletChainId = caipNetwork?.id ? Number(caipNetwork.id) : null
  const isMismatch = isConnected && walletChainId !== null && walletChainId !== targetChainId

  useEffect(() => {
    void initializeSession()
  }, [initializeSession])

  useEffect(() => {
    setWalletConnection(
      address as `0x${string}` | undefined ?? null,
      isConnected,
      walletChainId,
    )
  }, [address, isConnected, walletChainId, setWalletConnection])

  const walletLabel = walletReady && isConnected && address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : walletReady && (walletStatus === "connecting" || walletStatus === "reconnecting")
      ? "Connecting..."
      : "Connect wallet"

  return (
    <TooltipProvider>
      <main className="h-dvh overflow-hidden bg-[#fafafa] text-foreground">
        <div
          className="grid h-full min-h-0 grid-cols-1 transition-[grid-template-columns] duration-200 ease-out lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]"
          style={{ "--sidebar-width": sidebarOpen ? "252px" : "56px" } as CSSProperties}
        >
          <div className="hidden min-h-0 overflow-hidden lg:block">
            <AppSidebar
              collapsed={!sidebarOpen}
              onToggle={() => setSidebarOpen((prev) => !prev)}
            />
          </div>

          <section className="flex min-h-0 min-w-0 flex-col">
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-black/[0.04] bg-[#fafafa]/90 px-3 backdrop-blur-sm sm:px-5">
              <div className="flex min-w-0 items-center gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="group/nav-toggle text-foreground/50 hover:bg-foreground/[0.06] hover:text-foreground lg:hidden"
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Open navigation"
                >
                  <Menu className="size-4 transform-gpu transition-transform duration-300 ease-out group-hover/nav-toggle:scale-105" />
                </Button>

                <div className="min-w-0">
                  <h1 className="truncate text-sm font-medium tracking-tight text-foreground/80">
                    {conversationTitle ?? "New chat"}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void appKit.open(isConnected ? { view: "Account" } : { view: "Connect", namespace: "eip155" })
                  }}
                  className="h-8 rounded-full border-black/[0.08] bg-white px-3 text-xs font-medium text-foreground/75 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:bg-[#f3f4f6] hover:text-foreground active:scale-[0.98]"
                >
                  <span className="hidden sm:inline">{walletLabel}</span>
                  <span className="sm:hidden">
                    {walletReady && isConnected && address
                      ? `${address.slice(0, 5)}…${address.slice(-3)}`
                      : "Connect"}
                  </span>
                </Button>
              </div>
            </header>

            {isMismatch ? (
              <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 bg-amber-500/[0.07] px-4 py-2 text-xs text-amber-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                  <span>
                    <strong>Network mismatch:</strong> Your workspace is set to {currentNetworkConfig.name}, but your wallet is on chain {walletChainId}.
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void appKit.open({ view: "Networks" })
                  }}
                  className="h-6 rounded-full border-amber-500/30 bg-white px-2.5 text-[11px] font-medium text-amber-800 shadow-xs hover:bg-amber-50"
                >
                  Switch Network
                </Button>
              </div>
            ) : null}

            <ChatArea />
          </section>
        </div>

        {mobileNavOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-[#172033]/25 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
            />
            <div className="relative h-full w-[min(86vw,292px)] shadow-2xl">
              <AppSidebar onClose={() => setMobileNavOpen(false)} />
            </div>
          </div>
        ) : null}
      </main>
    </TooltipProvider>
  )
}
