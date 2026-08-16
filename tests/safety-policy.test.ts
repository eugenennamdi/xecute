import assert from "node:assert/strict"
import test from "node:test"

import { parseIntent } from "../src/agents/intent-parser"
import { evaluateIntentSafety, getCanonicalPreflightSummary } from "../src/lib/safety/policy"

test("allows a complete conservative swap preview with pending human confirmation", () => {
  const intent = parseIntent("Swap 10 USDT0 to OKB with max 0.5% slippage")
  const report = evaluateIntentSafety(intent)
  const summary = getCanonicalPreflightSummary(report)

  assert.equal(intent.network, "testnet")
  assert.equal(report.allowed, true)
  assert.equal(report.level, "low")
  assert.equal(report.checks.find((item) => item.id === "human-confirmation")?.status, "pending")
  assert.equal(summary.allRequiredPassed, true)
  assert.equal(summary.pending, 1)
})

test("blocks slippage above the hard policy limit", () => {
  const intent = parseIntent("Swap 10 USDT0 to OKB with max 9% slippage")
  const report = evaluateIntentSafety(intent)

  assert.equal(report.allowed, false)
  assert.equal(report.level, "blocked")
  assert.equal(report.checks.find((item) => item.id === "slippage-limit")?.status, "block")
})

test("blocks unsupported assets", () => {
  const intent = parseIntent("Swap 10 FAKE to OKB")
  const report = evaluateIntentSafety(intent)

  assert.equal(report.allowed, false)
  assert.equal(report.checks.find((item) => item.id === "verified-tokens")?.status, "block")
})

test("blocks swaps between the same asset", () => {
  const intent = parseIntent("Swap 10 USDT0 to USDT0")
  const report = evaluateIntentSafety(intent)

  assert.equal(report.allowed, false)
  assert.equal(report.checks.find((item) => item.id === "distinct-assets")?.status, "block")
})

test("keeps incomplete intents non-confirmable without treating them as malicious", () => {
  const intent = parseIntent("Give me a swap quote")
  const report = evaluateIntentSafety(intent)

  assert.equal(report.allowed, false)
  assert.equal(report.level, "medium")
  assert.equal(report.checks.find((item) => item.id === "valid-amount")?.status, "warn")
})
