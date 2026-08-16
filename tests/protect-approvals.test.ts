import assert from "node:assert/strict"
import test from "node:test"

import { executeXLayerTool } from "../src/agents/tools/xlayer-tools"
import { getXLayerAccountType } from "../src/lib/xlayer/rpc"

test("inspect_xlayer_allowances discovers approvals and reports honest scan scope", async () => {
  const result = await executeXLayerTool(
    "inspect_xlayer_allowances",
    JSON.stringify({
      address: "0x1111111111111111111111111111111111111111",
      network: "testnet",
    }),
  )

  assert.equal(result.ok, true)
  const data = result.data as Record<string, unknown>
  assert.equal(data.network, "X Layer Testnet")
  assert.equal(data.chainId, 1952)
  assert.ok(typeof data.scanScope === "string")
  assert.ok(String(data.scanScope).includes("Scanned 3 verified token contracts"))
  assert.ok(Array.isArray(data.allowances))
  assert.equal(data.activeCount, 0)
  assert.equal(data.isClean, true)
})

test("getXLayerAccountType distinguishes contract from EOA using eth_getCode", async () => {
  // Testnet router is a smart contract
  const routerType = await getXLayerAccountType("0x9be3af8223f49b9357941db269a39775f7802acb", "testnet")
  assert.equal(routerType, "Contract")

  // Burn address has no bytecode -> EOA
  const eoaType = await getXLayerAccountType("0x0000000000000000000000000000000000000001", "testnet")
  assert.equal(eoaType, "EOA")
})

test("protect allowance audit accurately classifies zero allowances as clean and filters inactive pairs", async () => {
  const result = await executeXLayerTool(
    "inspect_xlayer_allowances",
    JSON.stringify({
      address: "0x000000000000000000000000000000000000dEaD",
      network: "testnet",
    }),
  )

  assert.equal(result.ok, true)
  const data = result.data as Record<string, unknown>
  assert.equal(data.activeCount, 0)
  assert.equal(data.highRiskCount, 0)
  assert.equal(data.isClean, true)

  const allowances = data.allowances as Array<Record<string, unknown>>
  assert.ok(allowances.every((a) => a.hasAllowance === false || a.allowance === "0" || a.allowance === "0.00"))
})
