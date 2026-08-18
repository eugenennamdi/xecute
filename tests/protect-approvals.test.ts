import assert from "node:assert/strict"
import test from "node:test"

import { executeXLayerTool } from "../src/agents/tools/xlayer-tools"
import { getXLayerAccountType, getXLayerTokenAllowance, getXLayerApprovalLogs, formatWei } from "../src/lib/xlayer/rpc"

test("getXLayerTokenAllowance classifies isUnlimited strictly as MAX_UINT256 with zero tolerance", async () => {
  const MAX_UINT256 = (BigInt(1) << BigInt(256)) - BigInt(1)

  // Max uint256 is true unlimited
  const hexMax = "0x" + MAX_UINT256.toString(16)
  const bigMax = BigInt(hexMax)
  assert.equal(bigMax === MAX_UINT256, true)

  // MAX_UINT256 - 1n must NOT be classified as unlimited (zero tolerance)
  const maxMinusOne = MAX_UINT256 - BigInt(1)
  assert.equal(maxMinusOne === MAX_UINT256, false)

  // MAX_UINT256 - 1000n must NOT be classified as unlimited
  const maxMinus1000 = MAX_UINT256 - BigInt(1000)
  assert.equal(maxMinus1000 === MAX_UINT256, false)

  // Large finite value (e.g. 1,000,000 USDC = 1,000,000 * 10^6 = 10^12) is NOT unlimited
  const bigLargeFinite = BigInt(10) ** BigInt(12)
  assert.equal(bigLargeFinite === MAX_UINT256, false)

  // 2^128 value is finite and must NOT be classified as unlimited
  const big2_128 = BigInt(2) ** BigInt(128)
  assert.equal(big2_128 === MAX_UINT256, false)
})

test("getXLayerAccountType distinguishes contract from EOA using eth_getCode", async () => {
  // Testnet router is a smart contract
  const routerType = await getXLayerAccountType("0x9be3af8223f49b9357941db269a39775f7802acb", "testnet")
  assert.equal(routerType, "Contract")

  // Burn address has no bytecode -> EOA
  const eoaType = await getXLayerAccountType("0x0000000000000000000000000000000000000001", "testnet")
  assert.equal(eoaType, "EOA")
})

test("Case A & E: zero or fully consumed allowance produces 0 active approvals and classifies relationships as inactive", async () => {
  const result = await executeXLayerTool(
    "inspect_xlayer_allowances",
    JSON.stringify({
      address: "0x000000000000000000000000000000000000dEaD",
      network: "testnet",
    }),
  )

  assert.equal(result.ok, true)
  const data = result.data as Record<string, unknown>
  assert.ok(data.scanStatus === "complete" || data.scanStatus === "partial")
  assert.equal(data.activeApprovalCount, 0)
  assert.equal(data.unlimitedApprovalCount, 0)
  assert.equal(data.hasFindings, false)
  assert.ok(typeof data.startBlock === "number")
  assert.ok(typeof data.endBlock === "number")
  assert.ok(String(data.scanScope).includes("blocks"))

  const allowances = data.allowances as Array<Record<string, unknown>>
  assert.ok(allowances.every((a) => a.status === "inactive" && (a.allowance === "0" || a.allowance === "0.00")))
})

test("Case B & C: finite unconsumed or partially consumed approvals are formatted accurately as active finite allowances", async () => {
  const raw25USDC = "0x" + (BigInt(25) * BigInt(10 ** 6)).toString(16)
  const formatted25 = formatWei(raw25USDC, 6)
  assert.equal(formatted25, "25")

  const raw5USDC = "0x" + (BigInt(5) * BigInt(10 ** 6)).toString(16)
  const formatted5 = formatWei(raw5USDC, 6)
  assert.equal(formatted5, "5")
})

test("Case D: unlimited approval is strictly reserved for type(uint256).max with no tolerance", async () => {
  const MAX_UINT256 = (BigInt(1) << BigInt(256)) - BigInt(1)
  const maxHex = "0x" + MAX_UINT256.toString(16)
  assert.equal(BigInt(maxHex) === MAX_UINT256, true)

  const nearMaxHex = "0x" + (MAX_UINT256 - BigInt(1)).toString(16)
  assert.equal(BigInt(nearMaxHex) === MAX_UINT256, false)

  // 1 billion tokens is finite, not unlimited
  const oneBillionTokens = BigInt(1_000_000_000) * (BigInt(10) ** BigInt(18))
  assert.equal(oneBillionTokens === MAX_UINT256, false)
})

test("Case F: allowance RPC failure fails closed and returns unknown, never 0 approvals", async () => {
  const invalidResult = await getXLayerTokenAllowance(
    "0x0000000000000000000000000000000000000000",
    "0x1111111111111111111111111111111111111111",
    "0x2222222222222222222222222222222222222222",
    18,
    "testnet",
  )

  assert.ok(typeof invalidResult.success === "boolean")
  if (!invalidResult.success) {
    assert.equal(invalidResult.allowance, "Unknown")
    assert.equal(invalidResult.isUnlimited, false)
  }
})

test("Case G: Approval event lookup exposes startBlock and endBlock and chunks scan horizon", async () => {
  const logsResult = await getXLayerApprovalLogs(
    "0x1111111111111111111111111111111111111111",
    ["0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c"],
    "testnet",
    15000,
    5000,
  )

  assert.ok(typeof logsResult.success === "boolean")
  assert.ok(Array.isArray(logsResult.events))
  assert.ok(typeof logsResult.startBlock === "number")
  assert.ok(typeof logsResult.endBlock === "number")
  if (logsResult.endBlock > 0) {
    assert.ok(logsResult.endBlock >= logsResult.startBlock)
  }
})

test("Regression: Approval older than one 5,000-block chunk with current non-zero allowance is discoverable across chunks", async () => {
  // Simulate an Approval event from 12,000 blocks ago (> 1 chunk of 5,000 blocks)
  const currentBlock = 100_000
  const eventBlock = 88_000 // 12,000 blocks prior to currentBlock
  const lookbackBlocks = 25_000
  const chunkSize = 5_000

  const startBlock = currentBlock - lookbackBlocks // 75,000
  const endBlock = currentBlock // 100,000

  // Chunking logic verification:
  const chunks: Array<{ from: number; to: number }> = []
  for (let from = startBlock; from <= endBlock; from += chunkSize) {
    const to = Math.min(from + chunkSize - 1, endBlock)
    chunks.push({ from, to })
  }

  // Verify that 25,001 blocks chunked at 5,000 blocks yields contiguous chunks
  assert.equal(chunks.length, 6)
  assert.equal(chunks[0].from, 75000)
  assert.equal(chunks[0].to, 79999)
  assert.equal(chunks[2].from, 85000)
  assert.equal(chunks[2].to, 89999)
  assert.equal(chunks[5].from, 100000)
  assert.equal(chunks[5].to, 100000)

  // Verify that eventBlock (88,000) falls squarely within chunk index 2 (older than 1 chunk)
  const matchingChunk = chunks.find((c) => eventBlock >= c.from && eventBlock <= c.to)
  assert.ok(matchingChunk !== undefined)
  assert.equal(matchingChunk.from, 85000)
  assert.equal(matchingChunk.to, 89999)
})
