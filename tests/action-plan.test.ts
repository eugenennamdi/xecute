import assert from "node:assert/strict"
import test from "node:test"

import { parseIntent } from "../src/agents/intent-parser"
import { prepareAction } from "../src/lib/action-plan"
import { evaluateIntentSafety } from "../src/lib/safety/policy"

test("produces quote_failed without fabricating numbers when live quote is unavailable", () => {
  const intent = parseIntent("swap 100 USDT0 to OKB", "trade", "mainnet")
  const safety = evaluateIntentSafety(intent)
  const plan = prepareAction(intent, safety, null, "DEX quote service unavailable")

  assert.equal(plan.status, "quote_failed")
  assert.equal(plan.preview, null)
  assert.equal(plan.errorMessage, "DEX quote service unavailable")
})

test("builds live trade preview when read-only quote data is available", () => {
  const intent = parseIntent("swap 100 USDT0 to OKB", "trade", "mainnet")
  const safety = evaluateIntentSafety(intent)
  const quoteData = {
    readOnly: true,
    outputAmount: "1.6745",
    priceImpactPercentage: "0.05",
    estimatedGasUnits: "185000",
    liquiditySources: ["OKX DEX", "QuickSwap"],
    quotedAt: "2026-08-14T18:00:00.000Z",
  }
  const plan = prepareAction(intent, safety, quoteData)

  assert.equal(plan.status, "ready_to_execute")
  assert.equal(plan.preview?.source, "live")
  assert.equal(plan.preview?.estimatedOutput, "1.6745")
  assert.equal(plan.preview?.route, "OKX DEX + QuickSwap")
  assert.equal(plan.preview?.gasEstimate, "185000 gas")
  assert.equal(plan.preview?.network, intent.network)
})

test("builds simulated trade preview when explicitly simulated", () => {
  const intent = parseIntent("simulate swap 100 USDT0 to OKB")
  const safety = evaluateIntentSafety(intent)
  const plan = prepareAction(intent, safety, null, null, true)

  assert.equal(plan.status, "simulated_preview")
  assert.equal(plan.preview?.source, "simulated")
  assert.equal(plan.preview?.fromToken, "USDT0")
  assert.equal(plan.preview?.toToken, "OKB")
  assert.equal(plan.preview?.inputAmount, "100")
})

test("handles arrow token syntax and comma-formatted amounts correctly", () => {
  const arrowIntent = parseIntent("Swap 1,000 USDT0 → OKB", "trade", "mainnet")
  assert.equal(arrowIntent.mode, "trade")
  assert.equal(arrowIntent.amount, "1000")
  assert.equal(arrowIntent.fromToken, "USDT0")
  assert.equal(arrowIntent.toToken, "OKB")

  const asciiArrowIntent = parseIntent("100 USDT -> USDC", "trade", "testnet")
  assert.equal(asciiArrowIntent.mode, "trade")
  assert.equal(asciiArrowIntent.amount, "100")
  assert.equal(asciiArrowIntent.fromToken, "USDT")
  assert.equal(asciiArrowIntent.toToken, "USDC")
})

test("encodes swapExactOKBForTokens calldata for onchain testnet execution", async () => {
  const { getSwapTransactionPayload, ROUTER_ADDRESS_TESTNET } = await import("../src/lib/contracts/router")
  const recipient = "0x727ee5dc96e729d8f6c6930cd02ad1695498f3b8" as const

  const okbToUsdt = getSwapTransactionPayload({
    fromTokenSymbol: "OKB",
    toTokenSymbol: "USDT",
    amount: "0.01",
    recipient,
    slippage: 0.5,
  })

  assert.equal(okbToUsdt.to, ROUTER_ADDRESS_TESTNET)
  assert.equal(okbToUsdt.value, "0x2386f26fc10000") // 0.01 ether in wei
  assert.ok(okbToUsdt.data.startsWith("0x")) // calldata is non-empty
  assert.ok(okbToUsdt.data.length > 10)

  const usdtToOkb = getSwapTransactionPayload({
    fromTokenSymbol: "USDT",
    toTokenSymbol: "OKB",
    amount: "10",
    recipient,
    slippage: 1.0,
  })

  assert.equal(usdtToOkb.to, ROUTER_ADDRESS_TESTNET)
  assert.equal(usdtToOkb.value, "0x0")
  assert.ok(usdtToOkb.data.startsWith("0x"))
})

