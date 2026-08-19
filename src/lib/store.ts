"use client"

import { create } from "zustand"

import { classifyIntent } from "@/agents/intent-parser"
import type { PreparedAction } from "@/lib/action-plan"
import { AgentResponseSchema, type AgentMetadata } from "@/lib/agent-types"
import type { Intent, Mode } from "@/lib/intents"
import { type ExecutionReceipt, createExecutionReceipt } from "@/config/constants"

export type ChatMessage = {
  id: string
  role: "assistant" | "user"
  content: string
  mode?: Mode
  agent?: AgentMetadata
  plan?: PreparedAction | null
  streaming?: boolean
}

export type ConversationSummary = {
  id: string
  title: string
  mode: Mode
  updatedAt: string
}

export type ExecutionStatus =
  | "idle"
  | "preparing"
  | "ready"
  | "awaiting_signature"
  | "broadcast"
  | "pending"
  | "executed"
  | "reverted"
  | "failed"
  | "blocked"

type HistoryStatus = "idle" | "loading" | "ready" | "unavailable"

type TerminalState = {
  activeMode: Mode
  activeNetwork: "testnet" | "mainnet"
  messages: ChatMessage[]
  currentIntent: Intent | null
  currentPlan: PreparedAction | null
  receipt: ExecutionReceipt | null
  status: ExecutionStatus
  isAgentRunning: boolean
  walletConnected: boolean
  walletAddress: `0x${string}` | null
  walletChainId: number | null
  sessionId: string | null
  conversationId: string | null
  conversations: ConversationSummary[]
  historyStatus: HistoryStatus
  setMode: (mode: Mode) => void
  setNetwork: (network: "testnet" | "mainnet") => void
  initializeSession: () => Promise<void>
  refreshConversations: () => Promise<void>
  loadConversation: (conversationId: string) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  submitPrompt: (prompt: string) => Promise<void>
  setPlanSlippage: (slippage: number) => void
  confirmAction: () => Promise<void>
  finishStreamingMessage: (messageId: string) => void
  newChat: () => void
  setWalletConnection: (address: `0x${string}` | null, connected: boolean, chainId?: number | null) => void
}

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome to Xecute.\n\nI can help you execute supported actions on X Layer Testnet and inspect verified X Layer Mainnet data.",
}

const SESSION_KEY = "xecute-session-id"
let processingRun = 0
const conversationCache = new Map<string, { id: string; mode: Mode; messages: ChatMessage[] }>()

function browserSessionId() {
  const existing = window.localStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const created = globalThis.crypto.randomUUID()
  window.localStorage.setItem(SESSION_KEY, created)
  return created
}

function statusForPlan(plan: PreparedAction | null): ExecutionStatus {
  if (!plan) return "idle"
  if (plan.status === "ready_to_execute" || plan.status === "preview-ready" || plan.status === "simulated_preview") return "ready"
  if (plan.status === "blocked" || plan.status === "quote_failed") return "blocked"
  return "idle"
}

function safeMode(mode: unknown): Mode {
  if (typeof mode === "string" && (mode === "trade" || mode === "earn" || mode === "predict" || mode === "protect")) {
    return mode
  }
  return "trade"
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  activeMode: "trade",
  activeNetwork: "testnet",
  messages: [welcomeMessage],
  currentIntent: null,
  currentPlan: null,
  receipt: null,
  status: "idle",
  isAgentRunning: false,
  walletConnected: false,
  walletAddress: null,
  walletChainId: null,
  sessionId: null,
  conversationId: null,
  conversations: [],
  historyStatus: "idle",
  setMode: (activeMode) => set({ activeMode: safeMode(activeMode) }),
  setNetwork: (activeNetwork) => set({ activeNetwork }),
  initializeSession: async () => {
    const sessionId = browserSessionId()
    set({ sessionId })
    await get().refreshConversations()
  },
  refreshConversations: async () => {
    const sessionId = get().sessionId ?? browserSessionId()
    set({ sessionId, historyStatus: "loading" })

    try {
      const response = await fetch(`/api/conversations?sessionId=${encodeURIComponent(sessionId)}`, {
        cache: "no-store",
      })
      if (!response.ok) throw new Error("History request failed")
      const payload = (await response.json()) as {
        conversations?: ConversationSummary[]
        persistence?: "stored" | "unavailable"
      }
      set({
        conversations: payload.conversations ?? [],
        historyStatus: payload.persistence === "stored" ? "ready" : "unavailable",
      })
    } catch {
      set({ historyStatus: "unavailable" })
    }
  },
  loadConversation: async (conversationId) => {
    const sessionId = get().sessionId ?? browserSessionId()
    processingRun += 1

    // If cached, load immediately without network latency or flash
    const cached = conversationCache.get(conversationId)
    if (cached) {
      const latestPlan = [...cached.messages].reverse().find((message) => message.plan)?.plan ?? null
      set({
        conversationId: cached.id,
        activeMode: safeMode(latestPlan?.intent.mode ?? cached.mode),
        messages: cached.messages.length ? cached.messages : [welcomeMessage],
        currentIntent: latestPlan?.intent ?? null,
        currentPlan: latestPlan,
        receipt: null,
        status: statusForPlan(latestPlan),
      })
    }

    try {
      const response = await fetch(
        `/api/conversations/${encodeURIComponent(conversationId)}?sessionId=${encodeURIComponent(sessionId)}`,
        { cache: "no-store" },
      )
      if (!response.ok) throw new Error("Conversation request failed")
      const payload = (await response.json()) as {
        id: string
        mode: Mode
        messages: ChatMessage[]
      }
      // Ensure all loaded historical messages do not stream
      const sanitizedMessages = (payload.messages ?? []).map((msg) => ({
        ...msg,
        streaming: false,
      }))

      conversationCache.set(conversationId, {
        id: payload.id,
        mode: safeMode(payload.mode),
        messages: sanitizedMessages,
      })

      const latestPlan = [...sanitizedMessages].reverse().find((message) => message.plan)?.plan ?? null
      set({
        conversationId: payload.id,
        activeMode: safeMode(latestPlan?.intent.mode ?? payload.mode),
        messages: sanitizedMessages.length ? sanitizedMessages : [welcomeMessage],
        currentIntent: latestPlan?.intent ?? null,
        currentPlan: latestPlan,
        receipt: null,
        status: statusForPlan(latestPlan),
      })
    } catch {
      if (!cached) set({ status: "idle" })
    }
  },
  deleteConversation: async (conversationId) => {
    const sessionId = get().sessionId ?? browserSessionId()
    const activeConversationId = get().conversationId

    conversationCache.delete(conversationId)

    // Optimistically update conversations list
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== conversationId),
      ...(activeConversationId === conversationId
        ? {
            conversationId: null,
            messages: [welcomeMessage],
            currentIntent: null,
            currentPlan: null,
            receipt: null,
            status: "idle",
          }
        : {}),
    }))

    try {
      await fetch(
        `/api/conversations/${encodeURIComponent(conversationId)}?sessionId=${encodeURIComponent(sessionId)}`,
        { method: "DELETE" },
      )
    } catch {
      await get().refreshConversations()
    }
  },
  submitPrompt: async (prompt) => {
    const cleanPrompt = prompt.trim()
    if (
      !cleanPrompt ||
      get().isAgentRunning ||
      get().status === "preparing" ||
      get().status === "awaiting_signature" ||
      get().status === "broadcast" ||
      get().status === "pending"
    )
      return

    const suffix = Date.now().toString(36)
    const mode = classifyIntent(cleanPrompt, get().activeMode)
    const run = ++processingRun
    const sessionId = get().sessionId ?? browserSessionId()
    const requestMessages = [
      ...get()
        .messages.filter((message) => message.id !== "welcome")
        .slice(-11)
        .map(({ role, content }) => ({ role, content })),
      { role: "user" as const, content: cleanPrompt },
    ]

    set((state) => ({
      sessionId,
      activeMode: mode,
      currentIntent: null,
      currentPlan: null,
      receipt: null,
      status: "idle",
      isAgentRunning: true,
      messages: [
        ...state.messages,
        { id: `user-${suffix}`, role: "user", content: cleanPrompt, mode },
      ],
    }))

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: requestMessages,
          mode,
          network: get().activeNetwork,
          sessionId,
          conversationId: get().conversationId ?? undefined,
          walletAddress: get().walletAddress ?? undefined,
        }),
      })
      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as {
          error?: string
          detail?: string
        } | null
        throw new Error(errorData?.detail || errorData?.error || `Agent request returned ${response.status}`)
      }
      const agentResponse = AgentResponseSchema.parse(await response.json())
      if (run !== processingRun) return

      const resolvedConversationId = agentResponse.conversationId ?? get().conversationId
      const resolvedTitle = agentResponse.conversationTitle

      set((state) => {
        let updatedConversations = state.conversations
        if (resolvedConversationId && resolvedTitle) {
          const exists = updatedConversations.some((c) => c.id === resolvedConversationId)
          if (exists) {
            updatedConversations = updatedConversations.map((c) =>
              c.id === resolvedConversationId
                ? {
                    ...c,
                    title: c.title && c.title !== "New conversation" ? c.title : (resolvedTitle || c.title),
                    updatedAt: new Date().toISOString(),
                  }
                : c,
            )
          } else {
            updatedConversations = [
              {
                id: resolvedConversationId,
                title: resolvedTitle,
                mode: agentResponse.plan?.intent.mode ?? mode,
                updatedAt: new Date().toISOString(),
              },
              ...updatedConversations,
            ]
          }
        }

        const newMessages: ChatMessage[] = [
          ...state.messages,
          {
            id: agentResponse.runId ? `assistant-${agentResponse.runId}` : `assistant-${suffix}`,
            role: "assistant",
            content: agentResponse.message,
            mode: agentResponse.plan?.intent.mode,
            agent: agentResponse.metadata,
            plan: agentResponse.plan,
            streaming: true, // Live streamed response
          },
        ]

        if (resolvedConversationId) {
          conversationCache.set(resolvedConversationId, {
            id: resolvedConversationId,
            mode: agentResponse.plan?.intent.mode ?? mode,
            messages: newMessages,
          })
        }

        return {
          conversationId: resolvedConversationId,
          conversations: updatedConversations,
          currentIntent: agentResponse.plan?.intent ?? null,
          currentPlan: agentResponse.plan,
          status: statusForPlan(agentResponse.plan),
          isAgentRunning: false,
          messages: newMessages,
        }
      })
      if (agentResponse.persistence === "stored") void get().refreshConversations()
    } catch (error) {
      const isNetworkError =
        error instanceof TypeError &&
        (error.message.includes("Failed to fetch") || error.message.includes("NetworkError"))

      const errorMessage = isNetworkError
        ? "The connection was momentarily interrupted while reaching the agent. Please send your prompt again."
        : error instanceof Error && error.message && !error.message.startsWith("Agent request returned")
          ? `I could not process this request: ${error.message}`
          : "I could not reach the grounded agent service. No action was prepared. Please try again in a moment."

      set((state) => ({
        status: "idle",
        isAgentRunning: false,
        messages: [
          ...state.messages,
          {
            id: `assistant-${suffix}`,
            role: "assistant",
            content: errorMessage,
            streaming: false,
          },
        ],
      }))
    }
  },
  setPlanSlippage: (slippage: number) => {
    const { currentPlan } = get()
    if (!currentPlan || currentPlan.intent.mode !== "trade") return
    const updatedIntent: Extract<Intent, { mode: "trade" }> = {
      ...currentPlan.intent,
      maxSlippage: slippage,
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { evaluateIntentSafety } = require("@/lib/safety/policy")
    const safety = evaluateIntentSafety(updatedIntent)
    let preview = currentPlan.preview
    if (preview) {
      const numOut = parseFloat(preview.estimatedOutput)
      let minReceived = preview.minimumReceived
      if (!isNaN(numOut) && numOut > 0) {
        const calculated = numOut * (1 - slippage / 100)
        minReceived = calculated >= 1 ? calculated.toFixed(4) : calculated.toFixed(6)
      }
      preview = {
        ...preview,
        slippage: `${slippage}%`,
        minimumReceived: minReceived,
      }
    }
    set({
      currentIntent: updatedIntent,
      currentPlan: {
        ...currentPlan,
        intent: updatedIntent,
        safety,
        preview,
      },
    })
  },
  confirmAction: async () => {
    const { currentPlan, conversationId, walletConnected, walletAddress } = get()
    const sessionId = get().sessionId ?? browserSessionId()
    if (
      !currentPlan ||
      (currentPlan.status !== "ready_to_execute" &&
        currentPlan.status !== "preview-ready" &&
        currentPlan.status !== "simulated_preview") ||
      !conversationId
    ) {
      return
    }

    if (!walletConnected || !walletAddress) {
      const { appKit } = await import("@/components/providers/appkit-provider")
      void appKit.open({ view: "Connect", namespace: "eip155" })
      return
    }

    // Network Execution Policy: Mainnet execution is strictly disabled
    if (currentPlan.intent.network !== "testnet") {
      set({ status: "ready" })
      alert("Execution blocked: X Layer Mainnet execution is disabled in this release. Please select X Layer Testnet.")
      return
    }

    const updatedChecks = currentPlan.safety.checks.map((c) =>
      c.id === "human-confirmation"
        ? { ...c, status: "pass" as const, detail: "User confirmed transaction action." }
        : c,
    )
    const updatedPlan: PreparedAction = {
      ...currentPlan,
      safety: { ...currentPlan.safety, checks: updatedChecks },
    }

    set({ sessionId, status: "awaiting_signature", currentPlan: updatedPlan })

    let onchainTxHash: `0x${string}` | undefined
    let preparedTxEvidence: import("@/lib/execution/prepare-transaction").PreparedExecutionTransaction | undefined

    // Prompt user's connected wallet to sign and broadcast onchain on X Layer Testnet via orchestrator
    if (typeof window !== "undefined" && currentPlan.intent.mode === "trade") {
      try {
        const { executePlanWithWallet } = await import("@/lib/execution/orchestrator")
        const result = await executePlanWithWallet(updatedPlan, walletAddress)
        if (!result.success || !result.txHash) {
          if (result.error && result.errorCode !== "APPROVAL_REJECTED" && result.errorCode !== "TRANSACTION_REJECTED") {
            alert(result.error)
          }
          set({ status: "ready" })
          return
        }
        onchainTxHash = result.txHash
        preparedTxEvidence = result.preparedTx
      } catch (walletError) {
        console.warn("Wallet execution rejected or failed:", walletError)
        const msg = walletError instanceof Error ? walletError.message : "Transaction rejected"
        set({ status: "ready" })
        alert(msg)
        return
      }
    }

    if (!onchainTxHash) {
      set({ status: "ready" })
      return
    }

    // Set status to broadcast immediately upon receiving onchain hash and preserve receipt
    set({
      status: "broadcast",
      receipt: createExecutionReceipt(currentPlan.intent, onchainTxHash, { status: "broadcast" }),
    })

    try {
      const response = await fetch("/api/execution/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          conversationId,
          plan: updatedPlan,
          txHash: onchainTxHash,
          expectedWallet: walletAddress,
          expectedTo: preparedTxEvidence?.to,
          expectedValue: preparedTxEvidence?.value !== undefined ? preparedTxEvidence.value.toString() : undefined,
          expectedFunctionSelector: preparedTxEvidence?.functionSelector,
        }),
      })
      if (!response.ok) throw new Error("Confirmation request failed")
      const payload = (await response.json()) as { receipt: ExecutionReceipt }

      const initialStatus = payload.receipt.status === "executed"
        ? "executed"
        : payload.receipt.status === "reverted"
          ? "reverted"
          : "pending"

      set({ receipt: payload.receipt, status: initialStatus })

      // If status is pending, poll until mined receipt arrives
      if (initialStatus === "pending") {
        const { getXLayerTransactionReceipt } = await import("@/lib/xlayer/rpc")
        for (let i = 0; i < 30; i++) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
          const polled = await getXLayerTransactionReceipt(onchainTxHash, "testnet")
          if (polled.status === "mined") {
            const minedStatus = polled.success ? "executed" : "reverted"
            set((state) => {
              if (!state.receipt) return state
              return {
                status: minedStatus,
                receipt: {
                  ...state.receipt,
                  status: minedStatus,
                  gasUsed: polled.gasUsed,
                  blockNumber: polled.blockNumber,
                },
              }
            })
            break
          }
        }
      }
    } catch {
      // If API confirm fails after broadcast, NEVER revert to ready!
      // Keep status as pending/broadcast with preserved onchain txHash
      set((state) => ({
        status: "pending",
        receipt: state.receipt ?? createExecutionReceipt(currentPlan.intent, onchainTxHash!, { status: "pending" }),
      }))
    }
  },
  finishStreamingMessage: (messageId: string) => {
    set((state) => {
      const updatedMessages = state.messages.map((m) =>
        m.id === messageId ? { ...m, streaming: false } : m,
      )
      if (state.conversationId) {
        const cached = conversationCache.get(state.conversationId)
        if (cached) {
          conversationCache.set(state.conversationId, {
            ...cached,
            messages: updatedMessages,
          })
        }
      }
      return { messages: updatedMessages }
    })
  },
  newChat: () => {
    processingRun += 1
    set({
      messages: [welcomeMessage],
      conversationId: null,
      currentIntent: null,
      currentPlan: null,
      receipt: null,
      status: "idle",
    })
  },
  setWalletConnection: (walletAddress, walletConnected, walletChainId = null) =>
    set({ walletAddress, walletConnected, walletChainId }),
}))
