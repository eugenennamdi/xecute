import assert from "node:assert/strict"
import test from "node:test"

import { parseIntent } from "../src/agents/intent-parser"
import { prepareAction } from "../src/lib/action-plan"
import { evaluateIntentSafety } from "../src/lib/safety/policy"
import { getTransferTransactionPayload, getApprovalTransactionPayload } from "../src/lib/contracts/router"

test("parses and prepares native OKB transfer with recipient validation", () => {
  const recipient = "0x727eE574Fa5cf4d9C73A601E83a7c64eb398f3B8"
  const intent = parseIntent(`Send 0.05 OKB to ${recipient}`)
  const safety = evaluateIntentSafety(intent)
  const plan = prepareAction(intent, safety)

  assert.equal(intent.mode, "trade")
  assert.equal(intent.action, "transfer")
  assert.equal(intent.amount, "0.05")
  assert.equal(intent.fromToken, "OKB")
  assert.equal(intent.recipient, recipient)
  assert.equal(safety.allowed, true)
  assert.equal(plan.status, "ready_to_execute")
  assert.equal(plan.preview?.fromToken, "OKB")
  assert.equal(plan.preview?.approvalRequired, false)

  const payload = getTransferTransactionPayload({
    tokenSymbol: "OKB",
    amount: "0.05",
    recipient: recipient as `0x${string}`,
  })
  assert.equal(payload.to.toLowerCase(), recipient.toLowerCase())
  assert.equal(payload.data, "0x")
  assert.equal(payload.value, "0xb1a2bc2ec50000") // 0.05 ether in hex
})

test("parses and prepares ERC-20 token transfer", () => {
  const recipient = "0x727eE574Fa5cf4d9C73A601E83a7c64eb398f3B8"
  const intent = parseIntent(`Transfer 20 USDT to ${recipient}`)
  const safety = evaluateIntentSafety(intent)
  const plan = prepareAction(intent, safety)

  assert.equal(intent.mode, "trade")
  assert.equal(intent.action, "transfer")
  assert.equal(intent.amount, "20")
  assert.equal(intent.fromToken, "USDT")
  assert.equal(intent.recipient, recipient)
  assert.equal(safety.allowed, true)
  assert.equal(plan.status, "ready_to_execute")

  const payload = getTransferTransactionPayload({
    tokenSymbol: "USDT",
    amount: "20",
    recipient: recipient as `0x${string}`,
  })
  assert.notEqual(payload.data, "0x")
  assert.equal(payload.value, "0x0")
})

test("parses and prepares token approval", () => {
  const spender = "0x9be3af8223f49b9357941db269a39775f7802acb"
  const intent = parseIntent(`Approve 100 USDT for ${spender}`)
  const safety = evaluateIntentSafety(intent)
  const plan = prepareAction(intent, safety)

  assert.equal(intent.mode, "trade")
  assert.equal(intent.action, "approve")
  assert.equal(intent.amount, "100")
  assert.equal(intent.fromToken, "USDT")
  assert.equal(intent.spender, spender)
  assert.equal(safety.allowed, true)
  assert.equal(plan.status, "ready_to_execute")

  const payload = getApprovalTransactionPayload({
    tokenSymbol: "USDT",
    amount: "100",
    spender: spender as `0x${string}`,
  })
  assert.notEqual(payload.data, "0x")
  assert.equal(payload.value, "0x0")
})

test("parses and prepares approval revocation (setting 0 allowance)", () => {
  const spender = "0x9be3af8223f49b9357941db269a39775f7802acb"
  const intent = parseIntent(`Revoke USDT approval for ${spender}`)
  const safety = evaluateIntentSafety(intent)
  const plan = prepareAction(intent, safety)

  assert.equal(intent.mode, "trade")
  assert.equal(intent.action, "revoke")
  assert.equal(intent.amount, "0")
  assert.equal(intent.fromToken, "USDT")
  assert.equal(intent.spender, spender)
  assert.equal(safety.allowed, true)
  assert.equal(plan.status, "ready_to_execute")

  const payload = getApprovalTransactionPayload({
    tokenSymbol: "USDT",
    amount: "0",
    spender: spender as `0x${string}`,
  })
  assert.notEqual(payload.data, "0x")
})

test("parses gas assistance query without fake execution mode", () => {
  const intent = parseIntent("I need gas for testnet")

  assert.equal(intent.mode, "trade")
  assert.equal(intent.action, "swap")
})

test("formats APY and resolves official protocol URLs correctly", async () => {
  const { formatApy, getProtocolUrl } = await import("../src/lib/action-plan")

  // Raw float percentage conversion
  assert.equal(formatApy("0.01310"), "1.31% APY")
  assert.equal(formatApy("0.054"), "5.40% APY")
  assert.equal(formatApy("4.8%"), "4.8% APY")
  assert.equal(formatApy("Variable"), "Variable APY")

  // Verified protocol URL mapping
  assert.equal(
    getProtocolUrl("Aave V3", "USDT Market", "USDT"),
    "https://app.aave.com/reserve-overview/?underlyingAsset=0x779Ded0c9e1022225f8E0630b35a9b54bE713736&marketName=proto_xlayer_v3",
  )
  assert.equal(
    getProtocolUrl("Aave V3", "General Markets"),
    "https://app.aave.com/markets/?marketName=proto_xlayer_v3",
  )
  assert.equal(
    getProtocolUrl("Uniswap V3", "USDT-OKB Pool"),
    "https://app.uniswap.org/explore/pools/xlayer/0xe3be6a0137f1b0602fc1a4841686f43b340a5082",
  )
  assert.equal(
    getProtocolUrl("Uniswap V3", "USDG-USDT Pool"),
    "https://app.uniswap.org/explore/pools/xlayer/0x0cbe0dbe1400e57f371a38bd3b9bc80f7c3676da",
  )
  assert.equal(
    getProtocolUrl("Uniswap V3", "USDT-ETH (0.05%) Pool"),
    "https://app.uniswap.org/explore/pools/xlayer/0x77ef18adf35f62b2ad442e4370cdbc7fe78b7dcc",
  )
  assert.equal(
    getProtocolUrl("Uniswap V3", "USDC-USDT Pool"),
    "https://app.uniswap.org/explore/pools/xlayer/0xeeeb3c1f61dc3070c675c2670a3f2188a060012d",
  )
  assert.equal(
    getProtocolUrl("Curve Finance", "USDT Pool"),
    "https://www.curve.finance/dex/x-layer/pools",
  )
})

test("extracts exact amount from flexible swap sentences and multi-turn history", async () => {
  const { parseIntent } = await import("../src/agents/intent-parser")

  // Direct complex sentence
  const intent1 = parseIntent("I can prepare a confirmed swap plan for 27 USDT → OKB right now")
  assert.equal(intent1.mode, "trade")
  assert.equal(intent1.amount, "27")
  assert.equal(intent1.fromToken, "USDT")
  assert.equal(intent1.toToken, "OKB")

  // Multi-turn conversational follow-up
  const intent2 = parseIntent("yes proceed with the swap", "trade", "testnet", [
    {
      role: "assistant",
      content: "How would you like to proceed? I can prepare a confirmed swap plan for 27 USDT → OKB right now",
    },
  ])
  assert.equal(intent2.mode, "trade")
  assert.equal(intent2.amount, "27")
  assert.equal(intent2.fromToken, "USDT")
  assert.equal(intent2.toToken, "OKB")
})

test("inspect_xlayer_allowances scans permissions and returns focused audit table", async () => {
  const { executeXLayerTool } = await import("../src/agents/tools/xlayer-tools")
  const { runXecuteAgent } = await import("../src/agents/xecute-agent")

  const toolResult = await executeXLayerTool(
    "inspect_xlayer_allowances",
    JSON.stringify({ address: "0x727ee5DC96E729d8f6C6930cd02ad1695498f3B8", network: "testnet" }),
  )

  assert.equal(toolResult.ok, true)
  const data = toolResult.data as Record<string, unknown>
  assert.equal(data.network, "X Layer Testnet")
  assert.ok(Array.isArray(data.allowances))

  // End to end response verification for a clean address
  const agentResponse = await runXecuteAgent({
    messages: [{ role: "user", content: "Check my risky token approvals and allowances" }],
    walletAddress: "0x1111111111111111111111111111111111111111",
    mode: "protect",
    network: "testnet",
  })

  assert.ok(agentResponse.message.includes("ERC-20 Approval Scan"))
  assert.ok(
    agentResponse.message.includes("0 Active Approvals") ||
    agentResponse.message.includes("Approval Scan Incomplete") ||
    agentResponse.message.includes("unable to verify")
  )
  // Must NOT include irrelevant market price dumps or token risk metadata errors
  assert.ok(!agentResponse.message.includes("Current USDT market price"))
  assert.ok(!agentResponse.message.includes("Token risk metadata is unavailable"))
})

test("parses conversational revoke prompts and follow-up preparation requests into actionable execution plans", async () => {
  const { parseIntent } = await import("../src/agents/intent-parser")
  const { runXecuteAgent } = await import("../src/agents/xecute-agent")
  // Explicit prompt with spender
  const intent1 = parseIntent("let's revoke USDC for 0x9be3af8223f49b9357941db269a39775f7802acb", "trade", "testnet")
  assert.equal(intent1.mode, "trade")
  assert.equal(intent1.action, "revoke")
  assert.equal(intent1.fromToken, "USDC")
  assert.equal(intent1.amount, "0")
  assert.equal(intent1.spender, "0x9be3af8223f49b9357941db269a39775f7802acb")

  // Vague prompt without spender fails closed (spender is null)
  const vagueIntent = parseIntent("let's revoke for usdc", "trade", "testnet")
  assert.equal(vagueIntent.mode, "trade")
  if (vagueIntent.mode === "trade") {
    assert.equal(vagueIntent.spender, null)
  }

  // Follow-up confirmation prompt with history containing spender
  const intent2 = parseIntent("prepare the transaction, my wallet is already connected", "trade", "testnet", [
    { role: "user", content: "let's revoke USDC for 0x9be3af8223f49b9357941db269a39775f7802acb" },
    { role: "assistant", content: "I can prepare a zero-allowance revocation for your USDC." },
  ])
  assert.equal(intent2.mode, "trade")
  assert.equal(intent2.action, "revoke")
  assert.equal(intent2.fromToken, "USDC")
  assert.equal(intent2.amount, "0")
  assert.equal(intent2.spender, "0x9be3af8223f49b9357941db269a39775f7802acb")

  // End-to-end agent returns valid execution plan card for revocation
  const agentResponse = await runXecuteAgent({
    messages: [{ role: "user", content: "let's revoke USDC for 0x9be3af8223f49b9357941db269a39775f7802acb" }],
    walletAddress: "0x727ee5DC96E729d8f6C6930cd02ad1695498f3B8",
    mode: "trade",
    network: "testnet",
  })

  assert.ok(agentResponse.plan)
  assert.equal(agentResponse.plan?.status, "ready_to_execute")
  assert.equal(agentResponse.plan?.intent.mode, "trade")
  assert.equal(agentResponse.plan?.intent.action, "revoke")
  assert.equal(agentResponse.plan?.intent.fromToken, "USDC")
  assert.ok(agentResponse.plan?.preview)
  assert.equal(agentResponse.plan?.preview?.inputAmount, "0")
})

