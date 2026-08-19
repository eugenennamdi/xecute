import { getAddress, isAddress, parseUnits } from "viem"
import { findToken } from "@/config/tokens"
import { ROUTER_ADDRESS_TESTNET } from "@/config/contracts"
import { getXLayerTokenAllowance, getXLayerTransactionReceipt } from "@/lib/xlayer/rpc"
import { prepareExecutionTransaction, type PreparedExecutionTransaction } from "@/lib/execution/prepare-transaction"
import type { PreparedAction } from "@/lib/action-plan"
import type { ExecutionReceipt } from "@/config/constants"

export class WalletExecutionError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = "WalletExecutionError"
  }
}

export class WalletAccountMismatchError extends WalletExecutionError {
  constructor(expected: string, actual: string) {
    super(
      `Execution blocked: Active wallet account changed. Expected ${expected}, but wallet is currently ${actual}.`,
      "ACCOUNT_MISMATCH",
    )
  }
}

export class WalletChainMismatchError extends WalletExecutionError {
  constructor(actualChainId: number) {
    super(
      `Execution blocked: Wallet is on chain ID ${actualChainId}. X Layer Testnet (Chain ID 1952) is required.`,
      "CHAIN_MISMATCH",
    )
  }
}

export class AllowanceUnavailableError extends WalletExecutionError {
  constructor(details: string) {
    super(`Execution blocked: Onchain allowance verification is unavailable: ${details}`, "ALLOWANCE_UNAVAILABLE")
  }
}

export class ApprovalNotConfirmedError extends WalletExecutionError {
  constructor() {
    super("Token approval was not confirmed onchain. Swap cancelled.", "APPROVAL_NOT_CONFIRMED")
  }
}

export class MainnetExecutionDisabledError extends WalletExecutionError {
  constructor() {
    super(
      "Execution blocked: X Layer Mainnet execution is disabled in this release. Please switch to X Layer Testnet.",
      "MAINNET_DISABLED",
    )
  }
}

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<any>
}

export interface OrchestrationResult {
  success: boolean
  txHash?: `0x${string}`
  preparedTx?: PreparedExecutionTransaction
  receipt?: ExecutionReceipt
  error?: string
  errorCode?: string
}

export interface WalletExecutionDependencies {
  provider?: EthereumProvider
  confirmApiUrl?: string
  pollIntervalMs?: number
  maxPollAttempts?: number
  prepareTxFn?: typeof prepareExecutionTransaction
  checkApprovalMinedFn?: (txHash: string) => Promise<boolean>
}

/**
 * Verify connected wallet runtime account and chain ID directly from provider
 */
export async function verifyWalletRuntime(
  provider: EthereumProvider,
  expectedWallet: string,
): Promise<{ account: `0x${string}`; chainId: number }> {
  // 1. Verify active account
  const accounts = (await provider.request({ method: "eth_accounts" })) as string[]
  if (!accounts || accounts.length === 0 || !accounts[0]) {
    throw new WalletExecutionError("No active wallet account detected.", "NO_ACCOUNT")
  }
  const activeAccount = getAddress(accounts[0])
  const expected = getAddress(expectedWallet)
  if (activeAccount.toLowerCase() !== expected.toLowerCase()) {
    throw new WalletAccountMismatchError(expected, activeAccount)
  }

  // 2. Verify active chain ID
  const chainHex = (await provider.request({ method: "eth_chainId" })) as string
  const chainId = Number.parseInt(chainHex, 16)
  if (chainId !== 1952) {
    throw new WalletChainMismatchError(chainId)
  }

  return { account: activeAccount, chainId }
}

/**
 * Execute the production onchain transaction lifecycle:
 * validated action -> live account/chain verify -> approval if needed -> prepare tx -> live account/chain verify -> eth_sendTransaction -> receipt binding
 */
export async function executePlanWithWallet(
  plan: PreparedAction,
  walletAddress: string,
  deps: WalletExecutionDependencies = {},
): Promise<OrchestrationResult> {
  const provider = deps.provider ?? (typeof window !== "undefined" ? (window as unknown as { ethereum?: EthereumProvider }).ethereum : undefined)
  if (!provider) {
    throw new WalletExecutionError("No EVM wallet provider detected.", "NO_PROVIDER")
  }

  if (!walletAddress || !isAddress(walletAddress, { strict: false })) {
    throw new WalletExecutionError("Valid wallet address is required.", "INVALID_WALLET")
  }
  const expectedFrom = getAddress(walletAddress)

  // 1. Network check: Mainnet execution is strictly disabled
  if (plan.intent.network !== "testnet") {
    throw new MainnetExecutionDisabledError()
  }

  // 2. Validate plan state
  const validStatuses = ["ready_to_execute", "preview-ready", "simulated_preview"]
  if (!validStatuses.includes(plan.status) || plan.intent.mode !== "trade") {
    throw new WalletExecutionError(`Plan is not ready for execution (status: ${plan.status}).`, "PLAN_NOT_READY")
  }

  // 3. Immediately verify wallet runtime account and chain ID BEFORE any preparation or RPC queries
  await verifyWalletRuntime(provider, expectedFrom)

  const prepareTx = deps.prepareTxFn ?? prepareExecutionTransaction
  const action = plan.intent.action || "swap"

  // 4. Handle Token Approval Lifecycle if required for ERC-20 swap
  if (action === "swap") {
    const fromSym = (plan.intent.fromToken || "").toUpperCase()
    const fromCfg = findToken(fromSym, 1952)
    if (!fromCfg) {
      throw new WalletExecutionError(`Unsupported token for swap: ${fromSym}`, "UNSUPPORTED_TOKEN")
    }

    if (fromCfg.address !== "native") {
      if (!plan.intent.amount) {
        throw new WalletExecutionError("Swap amount is required to evaluate approval.", "MISSING_AMOUNT")
      }
      const requiredTokens = parseUnits(plan.intent.amount, fromCfg.decimals)

      const allowRes = await getXLayerTokenAllowance(
        fromCfg.address,
        expectedFrom,
        ROUTER_ADDRESS_TESTNET,
        fromCfg.decimals,
        "testnet",
      )
      if (!allowRes.success || allowRes.rawBigInt === undefined) {
        throw new AllowanceUnavailableError(allowRes.error || "RPC query failed")
      }

      if (allowRes.rawBigInt < requiredTokens) {
        // Step A: Prepare Approval Transaction
        const approvePrep = await prepareTx({
          action: "approve",
          fromToken: fromSym,
          amount: plan.intent.amount,
          spender: ROUTER_ADDRESS_TESTNET,
          walletAddress: expectedFrom,
        })

        // Step B: Verify wallet account and chain immediately before approval send
        await verifyWalletRuntime(provider, expectedFrom)

        // Step C: Request user signature for approval
        let approvalTxHash: string
        try {
          approvalTxHash = await provider.request({
            method: "eth_sendTransaction",
            params: [
              {
                from: expectedFrom,
                to: approvePrep.to,
                data: approvePrep.data,
                value: approvePrep.value,
                gas: approvePrep.gasLimit,
              },
            ],
          })
        } catch (approvalErr) {
          const msg = approvalErr instanceof Error ? approvalErr.message : "User rejected approval"
          return { success: false, error: msg, errorCode: "APPROVAL_REJECTED" }
        }

        // Step D: Poll for approval confirmation
        let approvalConfirmed = false

        if (deps.checkApprovalMinedFn) {
          approvalConfirmed = await deps.checkApprovalMinedFn(approvalTxHash)
        } else {
          const pollInterval = deps.pollIntervalMs ?? 2000
          const maxAttempts = deps.maxPollAttempts ?? 30
          for (let i = 0; i < maxAttempts; i++) {
            await new Promise((resolve) => setTimeout(resolve, pollInterval))
            const receipt = await getXLayerTransactionReceipt(approvalTxHash, "testnet")
            if (receipt.status === "mined") {
              if (receipt.success) {
                approvalConfirmed = true
              }
              break
            }
          }
        }

        if (!approvalConfirmed) {
          throw new ApprovalNotConfirmedError()
        }

        // Step E: Re-verify wallet account and chain immediately after approval mining
        await verifyWalletRuntime(provider, expectedFrom)

        // Step F: Re-verify onchain allowance
        const postAllowRes = await getXLayerTokenAllowance(
          fromCfg.address,
          expectedFrom,
          ROUTER_ADDRESS_TESTNET,
          fromCfg.decimals,
          "testnet",
        )
        if (!postAllowRes.success || postAllowRes.rawBigInt === undefined || postAllowRes.rawBigInt < requiredTokens) {
          throw new WalletExecutionError("Allowance remains unverified after approval transaction.", "ALLOWANCE_UNVERIFIED")
        }
      }
    }
  }

  // 5. Prepare Primary Transaction
  const prep: PreparedExecutionTransaction = await prepareTx({
    action,
    fromToken: plan.intent.fromToken ?? undefined,
    toToken: plan.intent.toToken ?? undefined,
    amount: plan.intent.amount ?? undefined,
    recipient: plan.intent.recipient ?? undefined,
    spender: plan.intent.spender ?? undefined,
    slippage: plan.intent.maxSlippage ?? 0.5,
    walletAddress: expectedFrom,
  })

  // 5. Verify wallet account and chain immediately before primary transaction send
  await verifyWalletRuntime(provider, expectedFrom)

  // 6. Broadcast primary transaction
  let onchainTxHash: `0x${string}`
  try {
    const rawHash = (await provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: expectedFrom,
          to: prep.to,
          data: prep.data,
          value: prep.value,
          gas: prep.gasLimit,
        },
      ],
    })) as string
    onchainTxHash = rawHash as `0x${string}`
  } catch (sendErr) {
    const msg = sendErr instanceof Error ? sendErr.message : "User rejected transaction"
    return { success: false, error: msg, errorCode: "TRANSACTION_REJECTED" }
  }

  return {
    success: true,
    txHash: onchainTxHash,
    preparedTx: prep,
  }
}
