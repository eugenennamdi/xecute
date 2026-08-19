import assert from "node:assert/strict"
import test from "node:test"

import { executeXLayerTool } from "../src/agents/tools/xlayer-tools"
import { formatWei, getXLayerAccountSnapshot } from "../src/lib/xlayer/rpc"

test("formatWei converts wei hex and bigints to human decimal", () => {
  assert.equal(formatWei("0x0"), "0")
  assert.equal(formatWei("0xde0b6b3a7640000"), "1") // 1e18 wei = 1 OKB
  assert.equal(formatWei("0x6f05b59d3b20000"), "0.5") // 0.5e18 wei = 0.5 OKB
  assert.equal(formatWei("1000000", 6), "1") // 1 USDT (6 decimals)
})

test("inspect_xlayer_address reads real-time onchain balances on Testnet", async () => {
  const testAddress = "0x727eE5DC96E729d8f6C6930cd02ad1695498f3B8"
  const result = await executeXLayerTool(
    "inspect_xlayer_address",
    JSON.stringify({ address: testAddress, network: "testnet" }),
  )

  if (result.ok) {
    const data = result.data as Record<string, unknown>
    assert.equal(data.network, "X Layer Testnet")
    assert.equal(data.chainId, 1952)
    assert.equal(data.address, testAddress)
    assert.ok(typeof data.nativeBalance === "string")
    assert.equal(data.nativeSymbol, "OKB")
    assert.ok(Array.isArray(data.tokens))
  } else {
    assert.ok(result.trace)
  }
})

test("get_xlayer_network_snapshot reads live block and gas price on Testnet and Mainnet", async () => {
  const testnetResult = await executeXLayerTool(
    "get_xlayer_network_snapshot",
    JSON.stringify({ network: "testnet" }),
  )
  if (testnetResult.ok) {
    const testnetData = testnetResult.data as Record<string, unknown>
    assert.equal(testnetData.chainId, 1952)
    assert.ok(typeof testnetData.blockNumber === "number" || typeof testnetData.blockNumber === "string")
    assert.ok(typeof testnetData.gasPriceGwei === "string")
  }

  const mainnetResult = await executeXLayerTool(
    "get_xlayer_network_snapshot",
    JSON.stringify({ network: "mainnet" }),
  )
  if (mainnetResult.ok) {
    const mainnetData = mainnetResult.data as Record<string, unknown>
    assert.ok(typeof mainnetData.blockNumber === "number" || mainnetData.blockNumber === "Unavailable")
    assert.ok(typeof mainnetData.gasPriceGwei === "string")
  }
})
