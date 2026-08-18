import assert from "node:assert/strict"
import test from "node:test"

import { parseIntent } from "../src/agents/intent-parser"
import { getNetworkConfig, isExecutionEnabled, XLAYER_NETWORKS } from "../src/config/networks"
import { findToken } from "../src/config/tokens"
import { prepareAction } from "../src/lib/action-plan"
import { registeredAdapters, resolveAdapter } from "../src/lib/adapters/registry"
import { evaluateIntentSafety, getCanonicalPreflightSummary } from "../src/lib/safety/policy"

test("Case 1: Valid Testnet swap is confirmable with execution enabled", async () => {
  const intent = parseIntent("Swap 100 USDT to OKB with max 0.5% slippage", "trade", "testnet")
  const safety = evaluateIntentSafety(intent)
  const adapter = resolveAdapter(intent, { chainId: 1952 })

  assert.ok(adapter)
  assert.equal(adapter.executionEnabled, true)
  assert.equal(intent.network, "testnet")

  const preview = await adapter.getPreview(intent, { chainId: 1952 })
  assert.ok(preview.quote)
  assert.equal(preview.quote.source, "simulated") // Explicit deterministic testnet router pricing
  assert.equal(preview.quote.fromToken, "USDT")
  assert.equal(preview.quote.toToken, "OKB")

  const sim = await adapter.simulate?.(intent, { chainId: 1952, walletAddress: "0x1111111111111111111111111111111111111111" })
  assert.ok(sim !== undefined)
  assert.ok(typeof sim?.success === "boolean")

  const summary = getCanonicalPreflightSummary(safety)
  assert.equal(summary.allRequiredPassed, true)
  assert.equal(summary.pending, 1) // Human confirmation is pending
})

test("Case 2: Mainnet intent has execution disabled in current Xecute version", async () => {
  const intent = parseIntent("Swap 100 USDT0 to OKB with max 0.5% slippage", "trade", "mainnet")
  const safety = evaluateIntentSafety(intent)
  const adapter = resolveAdapter(intent, { chainId: 196 })

  assert.ok(adapter)
  assert.equal(adapter.executionEnabled, false)
  assert.equal(isExecutionEnabled(196), false)
  assert.equal(XLAYER_NETWORKS.mainnet.executionEnabled, false)

  const gatedCheck = safety.checks.find((c) => c.id === "mainnet-execution-gated")
  assert.ok(gatedCheck)
  assert.equal(gatedCheck.status, "warn")
})

test("Case 3: Canonical tokens are resolved per network with isTestAsset flags", () => {
  const testUsdt = findToken("USDT", 1952)
  assert.ok(testUsdt)
  assert.equal(testUsdt.isTestAsset, true)
  assert.equal(testUsdt.chainId, 1952)

  const mainnetUsdt = findToken("USDT0", 196)
  assert.ok(mainnetUsdt)
  assert.equal(mainnetUsdt.isTestAsset, false)
  assert.equal(mainnetUsdt.chainId, 196)
})

test("Case 4: Failed quote produces quote_failed without fabricating numbers", () => {
  const intent = parseIntent("Swap 100 USDT0 to OKB", "trade", "mainnet")
  const safety = evaluateIntentSafety(intent)
  const plan = prepareAction(intent, safety, null, "DEX liquidity route timeout")

  assert.equal(plan.status, "quote_failed")
  assert.equal(plan.preview, null)
  assert.equal(plan.errorMessage, "DEX liquidity route timeout")
})

test("Case 5: Excessive slippage (>5%) is hard blocked by preflight policy", () => {
  const intent = parseIntent("Swap 100 USDT to USDC with max 8% slippage", "trade", "testnet")
  const safety = evaluateIntentSafety(intent)
  const summary = getCanonicalPreflightSummary(safety)

  assert.equal(safety.allowed, false)
  assert.equal(safety.level, "blocked")
  assert.equal(summary.blocked, 1)
  assert.equal(summary.allRequiredPassed, false)
})

test("Case 6: Distinct asset check blocks swapping token for itself", () => {
  const intent = parseIntent("Swap 100 USDT to USDT", "trade", "testnet")
  const safety = evaluateIntentSafety(intent)

  assert.equal(safety.allowed, false)
  assert.equal(safety.checks.find((c) => c.id === "distinct-assets")?.status, "block")
})

test("Case 7: Native OKB gas reserve is checked when swapping native token", () => {
  const intentWithReserve = parseIntent("Swap 10 OKB to xUSDT keep gas reserve", "trade", "testnet")
  const safetyWithReserve = evaluateIntentSafety(intentWithReserve)
  assert.equal(safetyWithReserve.checks.find((c) => c.id === "native-gas-reserve")?.status, "pass")

  const intentWithoutReserve = parseIntent("Swap 10 OKB to xUSDT", "trade", "testnet")
  const safetyWithoutReserve = evaluateIntentSafety(intentWithoutReserve)
  assert.equal(safetyWithoutReserve.checks.find((c) => c.id === "native-gas-reserve")?.status, "warn")
})

test("Case 8: Human confirmation is strictly pending before user confirmation", () => {
  const intent = parseIntent("Swap 100 xUSDT to xWETH", "trade", "testnet")
  const safety = evaluateIntentSafety(intent)
  const summary = getCanonicalPreflightSummary(safety)

  const humanCheck = safety.checks.find((c) => c.id === "human-confirmation")
  assert.equal(humanCheck?.status, "pending")
  assert.equal(summary.pending, 1)
})

test("Case 9: Testnet Earn vault adapter is disabled from execution until live contract deployed", async () => {
  const intent = parseIntent("Find yield for my testnet USDT", "earn", "testnet")
  const adapter = resolveAdapter(intent, { chainId: 1952 })

  assert.ok(adapter)
  assert.equal(adapter.category, "earn")
  assert.equal(adapter.executionEnabled, false) // Fail closed: disabled

  const tx = await adapter.buildTransaction?.(intent, { chainId: 1952 })
  assert.equal(tx, null)
})

test("Case 10: Mainnet Earn adapter discovery is read-only", async () => {
  const intent = parseIntent("Find yield for USDT0 on X Layer", "earn", "mainnet")
  const adapter = resolveAdapter(intent, { chainId: 196 })

  assert.ok(adapter)
  assert.equal(adapter.category, "earn")
  assert.equal(adapter.executionEnabled, false)

  const tx = await adapter.buildTransaction?.(intent, { chainId: 196 })
  assert.equal(tx, null) // No transaction construction on mainnet
})

test("Case 11: Network security gating allows 1952 and strictly blocks 196 and 195", () => {
  assert.equal(isExecutionEnabled(1952), true)
  assert.equal(isExecutionEnabled(196), false)
  assert.equal(isExecutionEnabled(195), false)
  assert.equal(isExecutionEnabled(1), false)
})
