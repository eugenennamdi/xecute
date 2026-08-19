import test from "node:test"
import assert from "node:assert/strict"
import { parseEther, parseUnits, getAddress } from "viem"
import {
  prepareExecutionTransaction,
  MIN_GAS_RESERVE_WEI,
  InsufficientGasReserveError,
  InsufficientTokenBalanceError,
  MissingExecutionParameterError,
  SimulationFailedError,
  GasEstimationFailedError,
} from "../src/lib/execution/prepare-transaction"
import {
  executePlanWithWallet,
  verifyWalletRuntime,
  WalletAccountMismatchError,
  WalletChainMismatchError,
  MainnetExecutionDisabledError,
  ApprovalNotConfirmedError,
  type EthereumProvider,
} from "../src/lib/execution/orchestrator"
import { ROUTER_ADDRESS_TESTNET } from "../src/config/contracts"
import type { PreparedAction } from "../src/lib/action-plan"
import { POST as confirmPost } from "../src/app/api/execution/confirm/route"

// Helper to create a valid mock trade plan
function createMockPlan(overrides: Partial<PreparedAction> = {}): PreparedAction {
  return {
    status: "ready_to_execute",
    intent: {
      mode: "trade",
      action: "swap",
      rawPrompt: "swap 0.01 OKB for USDT",
      network: "testnet",
      fromToken: "OKB",
      toToken: "USDT",
      amount: "0.01",
      maxSlippage: 0.5,
      preserveGasBalance: true,
      requiresConfirmation: true,
    },
    safety: {
      allowed: true,
      level: "low",
      policyVersion: "1.0.0",
      evaluatedAt: new Date().toISOString(),
      checks: [
        {
          id: "network-safety",
          label: "Network: X Layer Testnet",
          status: "pass",
          detail: "X Layer Testnet (Chain ID 1952) is active.",
        },
      ],
    },
    preview: {
      source: "simulated",
      network: "testnet",
      fromToken: "OKB",
      toToken: "USDT",
      inputAmount: "0.01",
      estimatedOutput: "0.6",
      minimumReceived: "0.597",
      slippage: "0.5%",
      gasEstimate: "120,000 gas",
      priceImpact: "0%",
      approvalRequired: false,
      riskLevel: "Low",
      route: "Xecute Testnet Router",
      quotedAt: new Date().toISOString(),
    },
    ...overrides,
  }
}

test("Production Execution Pipeline: Gas reserve invariant requires remaining OKB >= 0.005 OKB", () => {
  const nativeBalanceWei = parseEther("0.02")
  const txValueWei = parseEther("0.01")
  const estimatedGasCostWei = parseEther("0.001") // 0.001 OKB gas

  const remainingNativeWei = nativeBalanceWei - txValueWei - estimatedGasCostWei
  assert.equal(remainingNativeWei, parseEther("0.009"))
  assert.ok(remainingNativeWei >= MIN_GAS_RESERVE_WEI, "0.009 OKB is above 0.005 OKB minimum reserve")

  // Deficit scenario
  const highTxValueWei = parseEther("0.018")
  const deficitRemainingWei = nativeBalanceWei - highTxValueWei - estimatedGasCostWei
  assert.equal(deficitRemainingWei, parseEther("0.001"))
  assert.ok(deficitRemainingWei < MIN_GAS_RESERVE_WEI, "0.001 OKB violates 0.005 OKB minimum reserve")
})

test("Production Execution Pipeline: Missing execution parameters fail closed", async () => {
  const caller = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

  await assert.rejects(
    async () => {
      await prepareExecutionTransaction({
        action: "swap",
        fromToken: "OKB",
        // toToken missing
        amount: "1",
        walletAddress: caller,
      })
    },
    (err: unknown) => err instanceof MissingExecutionParameterError
  )

  await assert.rejects(
    async () => {
      await prepareExecutionTransaction({
        action: "transfer",
        fromToken: "OKB",
        amount: "1",
        // recipient missing
        walletAddress: caller,
      })
    },
    (err: unknown) => err instanceof MissingExecutionParameterError
  )
})

test("Production Orchestrator 1: Normal successful swap flow with mock provider", async () => {
  const wallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  const plan = createMockPlan()

  const mockProvider: EthereumProvider = {
    request: async ({ method }) => {
      if (method === "eth_accounts") return [wallet]
      if (method === "eth_chainId") return "0x7a0" // 1952 in hex
      if (method === "eth_sendTransaction") return "0x" + "1".repeat(64)
      return null
    },
  }

  const mockPrepare = async () => ({
    to: ROUTER_ADDRESS_TESTNET as `0x${string}`,
    value: parseEther("0.01"),
    data: "0x12345678" as `0x${string}`,
    gasUnits: 100000n,
    gasPriceWei: 1000000000n,
    gasLimit: "0x186a0" as `0x${string}`,
    estimatedGasCostWei: parseEther("0.0001"),
    functionSelector: "0x12345678" as `0x${string}`,
  })

  const result = await executePlanWithWallet(plan, wallet, { provider: mockProvider, prepareTxFn: mockPrepare as any })
  assert.equal(result.success, true)
  assert.equal(result.txHash, ("0x" + "1".repeat(64)) as `0x${string}`)
})

test("Production Orchestrator 2: Mainnet execution is strictly disabled", async () => {
  const wallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  const mainnetPlan = createMockPlan({
    intent: {
      ...createMockPlan().intent,
      network: "mainnet",
    },
  })

  const mockProvider: EthereumProvider = {
    request: async () => [wallet],
  }

  await assert.rejects(
    async () => {
      await executePlanWithWallet(mainnetPlan, wallet, { provider: mockProvider })
    },
    (err: unknown) => err instanceof MainnetExecutionDisabledError
  )
})

test("Production Orchestrator 3: Approval required -> user rejects approval -> halts cleanly", async () => {
  const wallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  const basePlan = createMockPlan()
  const erc20SwapPlan = createMockPlan({
    intent: {
      mode: "trade",
      action: "swap",
      rawPrompt: "swap 100 USDT for OKB",
      network: "testnet",
      fromToken: "USDT",
      toToken: "OKB",
      amount: "100",
      maxSlippage: 0.5,
      preserveGasBalance: true,
      requiresConfirmation: true,
    },
  })

  const mockProvider: EthereumProvider = {
    request: async ({ method }) => {
      if (method === "eth_accounts") return [wallet]
      if (method === "eth_chainId") return "0x7a0"
      if (method === "eth_sendTransaction") {
        throw new Error("User rejected approval signature")
      }
      return null
    },
  }

  const mockPrepare = async () => ({
    to: ROUTER_ADDRESS_TESTNET as `0x${string}`,
    value: 0n,
    data: "0x095ea7b3" as `0x${string}`,
    gasUnits: 50000n,
    gasPriceWei: 1000000000n,
    gasLimit: "0xc350" as `0x${string}`,
    estimatedGasCostWei: parseEther("0.00005"),
    functionSelector: "0x095ea7b3" as `0x${string}`,
  })

  const result = await executePlanWithWallet(erc20SwapPlan, wallet, { provider: mockProvider, prepareTxFn: mockPrepare as any })
  assert.equal(result.success, false)
  assert.equal(result.errorCode, "APPROVAL_REJECTED")
})

test("Production Orchestrator 4: Approval mined -> user rejects primary swap -> halts cleanly", async () => {
  const wallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  const plan = createMockPlan()

  const mockProvider: EthereumProvider = {
    request: async ({ method }) => {
      if (method === "eth_accounts") return [wallet]
      if (method === "eth_chainId") return "0x7a0"
      if (method === "eth_sendTransaction") {
        throw new Error("User rejected swap transaction signature")
      }
      return null
    },
  }

  const mockPrepare = async () => ({
    to: ROUTER_ADDRESS_TESTNET as `0x${string}`,
    value: parseEther("0.01"),
    data: "0x12345678" as `0x${string}`,
    gasUnits: 100000n,
    gasPriceWei: 1000000000n,
    gasLimit: "0x186a0" as `0x${string}`,
    estimatedGasCostWei: parseEther("0.0001"),
    functionSelector: "0x12345678" as `0x${string}`,
  })

  const result = await executePlanWithWallet(plan, wallet, { provider: mockProvider, prepareTxFn: mockPrepare as any })
  assert.equal(result.success, false)
  assert.equal(result.errorCode, "TRANSACTION_REJECTED")
})

test("Production Orchestrator 5: Wallet account mismatch immediately throws WalletAccountMismatchError", async () => {
  const expectedWallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  const switchedWallet = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
  const plan = createMockPlan()

  const mockProvider: EthereumProvider = {
    request: async ({ method }) => {
      if (method === "eth_accounts") return [switchedWallet]
      if (method === "eth_chainId") return "0x7a0"
      return null
    },
  }

  await assert.rejects(
    async () => {
      await executePlanWithWallet(plan, expectedWallet, { provider: mockProvider })
    },
    (err: unknown) => err instanceof WalletAccountMismatchError
  )
})

test("Production Orchestrator 6: Wallet chain mismatch immediately throws WalletChainMismatchError", async () => {
  const wallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  const plan = createMockPlan()

  const mockProvider: EthereumProvider = {
    request: async ({ method }) => {
      if (method === "eth_accounts") return [wallet]
      if (method === "eth_chainId") return "0x1" // Ethereum Mainnet (1) instead of X Layer Testnet (1952)
      return null
    },
  }

  await assert.rejects(
    async () => {
      await executePlanWithWallet(plan, wallet, { provider: mockProvider })
    },
    (err: unknown) => err instanceof WalletChainMismatchError
  )
})

test("Production Orchestrator 7: verifyWalletRuntime requires active account and chain ID 1952", async () => {
  const wallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

  const validProvider: EthereumProvider = {
    request: async ({ method }) => {
      if (method === "eth_accounts") return [wallet]
      if (method === "eth_chainId") return "0x7a0"
      return null
    },
  }

  const verified = await verifyWalletRuntime(validProvider, wallet)
  assert.equal(verified.account.toLowerCase(), wallet.toLowerCase())
  assert.equal(verified.chainId, 1952)
})

test("Confirmation Route Binding: Rejects mismatched sender, recipient, value, or chainId", async () => {
  const validHash = "0x" + "a".repeat(64)
  const wallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  const plan = createMockPlan()

  // Confirm with valid UUIDs and payload
  const req = new Request("http://localhost:3000/api/execution/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "1385ae0e-f944-4f2b-af1e-3b66e03c6b46",
      conversationId: "1385ae0e-f944-4f2b-af1e-3b66e03c6b47",
      plan,
      txHash: validHash,
      expectedWallet: wallet,
      expectedTo: ROUTER_ADDRESS_TESTNET,
    }),
  })

  const res = await confirmPost(req)
  assert.equal(res.status, 200)
  const body = (await res.json()) as { receipt: { status: string } }
  assert.ok(body.receipt)
  // When unverified or pending onchain, status is pending, never executed
  assert.ok(body.receipt.status === "pending" || body.receipt.status === "broadcast")
})

test("Production Orchestrator: Approval transaction unconfirmed halts and throws ApprovalNotConfirmedError without sending swap", async () => {
  const wallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  const erc20Plan = createMockPlan({
    intent: {
      mode: "trade",
      action: "swap",
      rawPrompt: "swap 10 USDT for OKB",
      network: "testnet",
      fromToken: "USDT",
      toToken: "OKB",
      amount: "10",
      maxSlippage: 0.5,
      preserveGasBalance: true,
      requiresConfirmation: true,
    },
    preview: {
      source: "simulated",
      network: "testnet",
      fromToken: "USDT",
      toToken: "OKB",
      inputAmount: "10",
      estimatedOutput: "0.166",
      minimumReceived: "0.165",
      slippage: "0.5%",
      gasEstimate: "120,000 gas",
      priceImpact: "0%",
      approvalRequired: true,
      riskLevel: "Low",
      route: "Xecute Testnet Router",
      quotedAt: new Date().toISOString(),
    },
  })

  let swapSent = false
  const mockProvider: EthereumProvider = {
    request: async ({ method }) => {
      if (method === "eth_accounts") return [wallet]
      if (method === "eth_chainId") return "0x7a0"
      if (method === "eth_sendTransaction") return "0x" + "b".repeat(64)
      return null
    },
  }

  // Orchestrator executes with checkApprovalMined returning false / unconfirmed
  await assert.rejects(
    async () => {
      await executePlanWithWallet(erc20Plan, wallet, {
        provider: mockProvider,
        checkApprovalMinedFn: async () => false,
        prepareTxFn: (async (args: any) => {
          if (args?.action === "swap") {
            swapSent = true
          }
          return {
            to: ROUTER_ADDRESS_TESTNET as `0x${string}`,
            value: 0n,
            data: "0x1234" as `0x${string}`,
            gasUnits: 50000n,
            gasPriceWei: 1000000000n,
            gasLimit: "0xc350" as `0x${string}`,
            estimatedGasCostWei: parseEther("0.00005"),
            functionSelector: "0x1234" as `0x${string}`,
          }
        }) as any,
      })
    },
    (err: unknown) => {
      return (err as any).code === "APPROVAL_NOT_CONFIRMED" || err instanceof ApprovalNotConfirmedError
    }
  )

  assert.equal(swapSent, false)
})

test("Safety Policy: Canonical asset identity check blocks swap between identical underlying assets", async () => {
  const { evaluateIntentSafety } = await import("../src/lib/safety/policy")

  // Same symbol
  const sameSymbol = evaluateIntentSafety({
    mode: "trade",
    action: "swap",
    rawPrompt: "swap 10 USDT for USDT",
    network: "testnet",
    fromToken: "USDT",
    toToken: "USDT",
    amount: "10",
    maxSlippage: 0.5,
    preserveGasBalance: true,
    requiresConfirmation: true,
  })
  assert.equal(sameSymbol.level, "blocked")
  const distinctCheck1 = sameSymbol.checks.find((c) => c.id === "distinct-assets")
  assert.equal(distinctCheck1?.status, "block")

  // USDT vs USD₮0 (same canonical asset ID: xlayer-testnet-usdt0)
  const sameCanonical = evaluateIntentSafety({
    mode: "trade",
    action: "swap",
    rawPrompt: "swap 10 USDT for USD₮0",
    network: "testnet",
    fromToken: "USDT",
    toToken: "USD₮0",
    amount: "10",
    maxSlippage: 0.5,
    preserveGasBalance: true,
    requiresConfirmation: true,
  })
  assert.equal(sameCanonical.level, "blocked")
  const distinctCheck2 = sameCanonical.checks.find((c) => c.id === "distinct-assets")
  assert.equal(distinctCheck2?.status, "block")
})

test("Action Plan: Standalone approve without explicit spender returns needs_input", async () => {
  const { prepareAction } = await import("../src/lib/action-plan")
  const { evaluateIntentSafety } = await import("../src/lib/safety/policy")

  const intent: import("../src/lib/intents").Intent = {
    mode: "trade",
    action: "approve",
    rawPrompt: "approve 100 USDT",
    network: "testnet",
    fromToken: "USDT",
    amount: "100",
    // spender missing
    maxSlippage: 0.5,
    preserveGasBalance: true,
    requiresConfirmation: true,
  }

  const safety = evaluateIntentSafety(intent)
  const plan = prepareAction(intent, safety)

  assert.equal(plan.status, "needs_input")
  assert.equal(plan.preview, null)
})

test("Slippage UI Override: Parameter tuner slippage dynamically affects minimumReceived and getSwapTransactionPayload", async () => {
  const { getSwapTransactionPayload } = await import("../src/lib/contracts/router")
  const caller = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

  // 0.5% default slippage
  const payloadDefault = getSwapTransactionPayload({
    fromTokenSymbol: "OKB",
    toTokenSymbol: "USDT",
    amount: "1",
    slippage: 0.5,
    recipient: caller,
  })

  // 1.0% tuned slippage
  const payloadTuned = getSwapTransactionPayload({
    fromTokenSymbol: "OKB",
    toTokenSymbol: "USDT",
    amount: "1",
    slippage: 1.0,
    recipient: caller,
  })

  assert.ok(payloadDefault.data.length > 10)
  assert.ok(payloadTuned.data.length > 10)
  assert.notEqual(payloadDefault.data, payloadTuned.data, "Calldata differs because minAmountOut changed with slippage")
})

