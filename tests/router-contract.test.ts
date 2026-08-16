import assert from "node:assert/strict"
import test from "node:test"
import { decodeFunctionData, encodeFunctionData, parseEther, parseUnits } from "viem"

import {
  getSwapTransactionPayload,
  ROUTER_ADDRESS_TESTNET,
  XECUTE_ROUTER_ABI,
} from "../src/lib/contracts/router"

test("XecuteTestnetRouter ABI contains all required hardened functions and events", () => {
  const functionNames = XECUTE_ROUTER_ABI.filter((item) => item.type === "function").map((item) => (item as { name: string }).name)
  assert.ok(functionNames.includes("swapExactOKBForTokens"))
  assert.ok(functionNames.includes("swapExactTokensForOKB"))
  assert.ok(functionNames.includes("swapExactTokensForTokens"))
  assert.ok(functionNames.includes("emergencyWithdraw"))

  const eventNames = XECUTE_ROUTER_ABI.filter((item) => item.type === "event").map((item) => (item as { name: string }).name)
  assert.ok(eventNames.includes("Swap"))
  assert.ok(eventNames.includes("LiquiditySupplied"))
  assert.ok(eventNames.includes("EmergencyWithdraw"))
})

test("swapExactOKBForTokens encodes valid calldata with deterministic 1 OKB = 60 USD token rate", () => {
  const payload = getSwapTransactionPayload({
    fromTokenSymbol: "OKB",
    toTokenSymbol: "USDT",
    amount: "0.5",
    recipient: "0x1111111111111111111111111111111111111111",
    slippage: 0.5,
  })

  assert.equal(payload.to, ROUTER_ADDRESS_TESTNET)
  assert.equal(payload.value, `0x${parseEther("0.5").toString(16)}`)

  const decoded = decodeFunctionData({
    abi: XECUTE_ROUTER_ABI,
    data: payload.data as `0x${string}`,
  })

  assert.equal(decoded.functionName, "swapExactOKBForTokens")
  // 0.5 OKB * 60 = 30 USDT. With 0.5% slippage -> 29.85 USDT (29,850,000 units)
  assert.equal(decoded.args[1], BigInt(29850000))
  assert.equal(decoded.args[2], "0x1111111111111111111111111111111111111111")
})

test("swapExactTokensForOKB encodes valid calldata with deterministic 60 USD tokens = 1 OKB rate", () => {
  const payload = getSwapTransactionPayload({
    fromTokenSymbol: "USDT",
    toTokenSymbol: "OKB",
    amount: "30",
    recipient: "0x2222222222222222222222222222222222222222",
    slippage: 0.5,
  })

  assert.equal(payload.to, ROUTER_ADDRESS_TESTNET)
  assert.equal(payload.value, "0x0")

  const decoded = decodeFunctionData({
    abi: XECUTE_ROUTER_ABI,
    data: payload.data as `0x${string}`,
  })

  assert.equal(decoded.functionName, "swapExactTokensForOKB")
  // 30 USDT in = 30,000,000 units (6 decimals)
  assert.equal(decoded.args[1], parseUnits("30", 6))
  // 30 USDT / 60 = 0.5 OKB. With 0.5% slippage -> 0.4975 OKB in wei
  assert.equal(decoded.args[2], parseEther("0.4975"))
  assert.equal(decoded.args[3], "0x2222222222222222222222222222222222222222")
})

test("swapExactTokensForTokens encodes valid calldata for 1:1 stable asset pair", () => {
  const payload = getSwapTransactionPayload({
    fromTokenSymbol: "USDT",
    toTokenSymbol: "USDC",
    amount: "10",
    recipient: "0x3333333333333333333333333333333333333333",
    slippage: 1.0,
  })

  assert.equal(payload.to, ROUTER_ADDRESS_TESTNET)
  assert.equal(payload.value, "0x0")

  const decoded = decodeFunctionData({
    abi: XECUTE_ROUTER_ABI,
    data: payload.data as `0x${string}`,
  })

  assert.equal(decoded.functionName, "swapExactTokensForTokens")
  assert.equal(decoded.args[2], parseUnits("10", 6))
  // 10 USDT * (1 - 0.01) = 9.90 USDC
  assert.equal(decoded.args[3], parseUnits("9.9", 6))
})
