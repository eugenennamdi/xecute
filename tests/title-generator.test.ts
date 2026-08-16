import assert from "node:assert/strict"
import test from "node:test"

import { generateConversationTitle } from "../src/lib/chat/title-generator"

test("generates smart trading titles", () => {
  assert.equal(
    generateConversationTitle("i wanna make a trade, how do i go about it?", null, "trade"),
    "X Layer Trading Guide",
  )
  assert.equal(
    generateConversationTitle("swap 10 USDT0 to OKB with 0.5% slippage", {
      mode: "trade",
      action: "swap",
      fromToken: "USDT0",
      toToken: "OKB",
      amount: "10",
      maxSlippage: 0.5,
      preserveGasBalance: true,
      network: "mainnet",
      requiresConfirmation: true,
      rawPrompt: "swap 10 USDT0 to OKB with 0.5% slippage",
    }, "trade"),
    "Swap USDT0 to OKB",
  )
})

test("generates smart yield and earn titles", () => {
  assert.equal(
    generateConversationTitle("where can i earn with usdt0 on x layer?", null, "earn"),
    "USDT0 Yield Strategy",
  )
  assert.equal(
    generateConversationTitle("what are the best apy pools?", null, "earn"),
    "X Layer Yield Opportunities",
  )
})

test("generates smart risk and prediction titles", () => {
  assert.equal(
    generateConversationTitle("what happens if okb drops 10%?", null, "predict"),
    "OKB Market Scenario",
  )
  assert.equal(
    generateConversationTitle("check my risky approvals and allowances", null, "protect"),
    "Wallet Security & Approvals",
  )
})

test("handles greetings and network inquiries cleanly", () => {
  assert.equal(
    generateConversationTitle("hello!", null, "trade"),
    "General Inquiry",
  )
  assert.equal(
    generateConversationTitle("tell me about x layer bridge", null, "trade"),
    "X Layer Bridge Guide",
  )
})
