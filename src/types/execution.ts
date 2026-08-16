import type { Environment } from "@/config/networks"
import type { Intent } from "@/lib/intents"

export type ExecutionStatus =
  | "idle"
  | "parsing"
  | "intent_validated"
  | "fetching_data"
  | "quoting"
  | "simulating"
  | "review_required"
  | "ready_to_execute"
  | "awaiting_confirmation"
  | "awaiting_signature"
  | "submitted"
  | "pending"
  | "executed"
  | "blocked"
  | "error"

export type PreflightStatus = "pass" | "warn" | "block" | "pending" | "required"

export type PreflightCheck = {
  id: string
  label: string
  detail: string
  status: PreflightStatus
}

export type PreflightReport = {
  total: number
  passed: number
  warnings: number
  blocked: number
  pending: number
  allRequiredPassed: boolean
  checks: PreflightCheck[]
}

export type ExecutionQuote = {
  source: "live" | "simulated"
  fromToken: string
  toToken: string
  inputAmount: string
  estimatedOutput: string
  minimumReceived: string
  slippage: string
  gasEstimate: string
  priceImpact: string
  route: string
  quotedAt: string | null
}

export type TransactionRequest = {
  to: `0x${string}`
  data: `0x${string}`
  value: string
  gasLimit?: string
  chainId: number
}

export type SimulationResult = {
  success: boolean
  gasUsed?: string
  logs?: string[]
  error?: string
}

export type ExecutionReceipt = {
  transactionHash: string
  explorerUrl: string
  blockNumber?: number
  timestamp: string
  status: "success" | "reverted"
  fromAmount?: string
  toAmount?: string
  fromToken?: string
  toToken?: string
}

export type Execution = {
  id: string
  network: {
    chainId: 1952 | 196
    name: string
    environment: Environment
  }
  intent: Intent
  mode: "testnet_execution" | "mainnet_explore"
  status: ExecutionStatus
  quote?: ExecutionQuote | null
  simulation?: SimulationResult | null
  transaction?: TransactionRequest | null
  preflight: PreflightReport
  receipt?: ExecutionReceipt | null
  error?: {
    code: string
    message: string
    recoverable: boolean
  }
  createdAt: number
  updatedAt: number
}
