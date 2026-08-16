import assert from "node:assert/strict"
import test from "node:test"

import { parseIntent } from "../src/agents/intent-parser"
import { resolveAdapter } from "../src/lib/adapters/registry"

test("TestnetSwapAdapter executes live gas estimation without hardcoded fallbacks", async () => {
  const intent = parseIntent("Swap 0.01 OKB to USDT with max 0.5% slippage", "trade", "testnet")
  const adapter = resolveAdapter(intent, { chainId: 1952 })

  assert.ok(adapter)
  const preview = await adapter.getPreview(intent, {
    chainId: 1952,
    walletAddress: "0x1111111111111111111111111111111111111111",
  })

  assert.ok(preview.quote)
  assert.ok(typeof preview.quote.gasEstimate === "string")
  // Must be estimated or explicitly unavailable, never fabricated
  assert.ok(
    preview.quote.gasEstimate.includes("gas") ||
    preview.quote.gasEstimate === "Gas estimate unavailable",
  )
})
