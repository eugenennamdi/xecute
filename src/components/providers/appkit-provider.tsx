"use client"

import { useState, type ReactNode } from "react"
import { createAppKit } from "@reown/appkit/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider, type State } from "wagmi"

import {
  reownNetworks,
  reownProjectId,
  wagmiAdapter,
  wagmiConfig,
  xLayerTestnet,
} from "@/lib/chains"

const appUrl = typeof window === "undefined" ? "http://localhost:3000" : window.location.origin

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: reownNetworks,
  defaultNetwork: xLayerTestnet,
  projectId: reownProjectId,
  metadata: {
    name: "Xecute",
    description: "AI-powered onchain execution terminal for X Layer",
    url: appUrl,
    icons: [`${appUrl}/xecute-app-icon.svg`],
  },
  themeMode: "light",
  allowUnsupportedChain: false,
  enableCoinbase: false,
  enableBaseAccount: false,
  features: {
    analytics: false,
    email: false,
    socials: false,
    swaps: false,
    onramp: false,
    send: false,
  },
})

export function AppKitProvider({
  children,
  initialState,
}: {
  children: ReactNode
  initialState?: State
}) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
