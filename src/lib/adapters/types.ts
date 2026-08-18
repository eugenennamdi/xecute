import type { Intent } from "@/lib/intents"
import type { ExecutionQuote, SimulationResult, TransactionRequest } from "@/types/execution"

export type ExecutionContext = {
  walletAddress?: `0x${string}` | null
  chainId: 1952 | 196
  rawPrompt?: string
}

export type AdapterPreview = {
  quote?: ExecutionQuote
  routeDescription?: string
  earnOpportunities?: Array<{
    name: string
    protocol: string
    apy: string
    tvlUsd?: string
    risk?: string
    isTestVault?: boolean
  }>
  approvalFindings?: Array<{
    label: string
    spender: string
    spenderName?: string
    spenderType?: string
    token?: string
    tokenAddress?: string
    allowance?: string
    status?: "active" | "unlimited" | "inactive" | "unknown"
    lastUsed?: string
    risk: string
    detail?: string
  }>
  inactiveFindings?: Array<{
    label: string
    spender: string
    spenderName?: string
    spenderType?: string
    token?: string
    tokenAddress?: string
    allowance?: string
    status?: "active" | "unlimited" | "inactive" | "unknown"
    lastUsed?: string
    risk: string
    detail?: string
  }>
}

export interface XecuteAdapter {
  id: string
  name: string
  category: "trade" | "earn" | "protect" | "predict" | "market"
  chainIds: number[]
  executionEnabled: boolean

  supports(intent: Intent, context: ExecutionContext): boolean

  getPreview(intent: Intent, context: ExecutionContext): Promise<AdapterPreview>

  simulate?(
    intent: Intent,
    context: ExecutionContext,
  ): Promise<SimulationResult>

  buildTransaction?(
    intent: Intent,
    context: ExecutionContext,
  ): Promise<TransactionRequest | null>
}
