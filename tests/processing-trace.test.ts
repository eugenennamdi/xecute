import assert from "node:assert/strict"
import test from "node:test"

import { getProcessingLabel } from "../src/components/ai/execution-trace"

test("getProcessingLabel returns 'Thinking' for conversational and identity questions", () => {
  assert.equal(getProcessingLabel("trade", "What are you?"), "Thinking")
  assert.equal(getProcessingLabel("trade", "Who are you?"), "Thinking")
  assert.equal(getProcessingLabel("trade", "What can you do?"), "Thinking")
  assert.equal(getProcessingLabel("trade", "How do you work?"), "Thinking")
  assert.equal(getProcessingLabel("trade", "Hello!"), "Thinking")
  assert.equal(getProcessingLabel("trade", "help"), "Thinking")
  assert.equal(getProcessingLabel("trade", "Tell me about yourself"), "Thinking")
})

test("getProcessingLabel returns 'Consulting X Layer knowledge base' for architecture & doc questions", () => {
  assert.equal(getProcessingLabel("trade", "What is X Layer?"), "Consulting X Layer knowledge base")
  assert.equal(getProcessingLabel("trade", "Tell me about Polygon CDK and AggLayer"), "Consulting X Layer & AggLayer architecture")
  assert.equal(getProcessingLabel("trade", "How does ZK-Rollup finality work?"), "Consulting X Layer ZK architecture")
  assert.equal(getProcessingLabel("trade", "What is the RPC URL and chain id?"), "Consulting X Layer knowledge base")
  assert.equal(getProcessingLabel("trade", "Can I connect MetaMask?"), "Consulting X Layer knowledge base")
})

test("getProcessingLabel returns 'Checking X Layer bridge guide' for bridge questions", () => {
  assert.equal(getProcessingLabel("trade", "How to bridge from Ethereum to X Layer?"), "Checking X Layer bridge guide")
})

test("getProcessingLabel returns 'Checking network gas & block status' for network telemetry", () => {
  assert.equal(getProcessingLabel("trade", "What is the current gas price on X Layer?"), "Checking network gas & block status")
  assert.equal(getProcessingLabel("trade", "Is X Layer online?"), "Checking network gas & block status")
})

test("getProcessingLabel returns 'Inspecting wallet balances on X Layer' for balances", () => {
  assert.equal(getProcessingLabel("trade", "Check my wallet balance"), "Inspecting wallet balances on X Layer")
  assert.equal(getProcessingLabel("trade", "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"), "Inspecting wallet balances on X Layer")
})

test("getProcessingLabel returns 'Checking official testnet faucet' for faucets", () => {
  assert.equal(getProcessingLabel("trade", "Where can I get testnet OKB faucet?"), "Checking official testnet faucet")
})

test("getProcessingLabel returns 'Auditing token approvals & allowances' for security/approvals", () => {
  assert.equal(getProcessingLabel("trade", "Audit my token approvals"), "Auditing token approvals & allowances")
  assert.equal(getProcessingLabel("trade", "Check my risky token approvals and allowances"), "Auditing token approvals & allowances")
  assert.equal(getProcessingLabel("trade", "Revoke my USDT approval"), "Auditing USDT approvals for revocation")
  assert.equal(getProcessingLabel("trade", "Is this token safe or a honeypot?"), "Auditing contract security & risk")
  assert.equal(getProcessingLabel("trade", "Is USDC contract safe?"), "Auditing USDC contract security & risk")
})

test("getProcessingLabel returns specialized labels for architecture, bridge, and DeFi queries", () => {
  assert.equal(getProcessingLabel("earn", "Show me Aave rates for USDT"), "Checking Aave lending rates for USDT")
  assert.equal(getProcessingLabel("earn", "Show Uniswap V3 pools"), "Scanning Uniswap V3 liquidity pools")
  assert.equal(getProcessingLabel("predict", "What if OKB crashes 30%?"), "Modeling price shock & market scenario")
  assert.equal(getProcessingLabel("predict", "Calculate impermanent loss for 20% divergence"), "Calculating impermanent loss & pool risk")
  assert.equal(getProcessingLabel("trade", "What is Polygon CDK and AggLayer?"), "Consulting X Layer & AggLayer architecture")
  assert.equal(getProcessingLabel("trade", "How does ZK-Rollup prover work?"), "Consulting X Layer ZK architecture")
})

test("getProcessingLabel returns specific swap routes when tokens are specified", () => {
  assert.equal(getProcessingLabel("trade", "Swap 10 OKB to USDT"), "Finding best quote for OKB → USDT")
  assert.equal(getProcessingLabel("trade", "Trade 5 USDT0"), "Finding live quote for USDT0")
  assert.equal(getProcessingLabel("trade", "Send 1 OKB to 0x123"), "Validating OKB transfer & gas")
  assert.equal(getProcessingLabel("trade", "Price of BTC"), "Fetching real-time market data for BTC")
})

test("getProcessingLabel returns active execution lifecycle labels during transaction confirmation", () => {
  const swapIntent = {
    mode: "trade" as const,
    action: "swap" as const,
    fromToken: "USDC",
    toToken: "USDT",
    amount: "10",
    maxSlippage: 0.5,
    preserveGasBalance: true,
    network: "testnet" as const,
    requiresConfirmation: true,
    rawPrompt: "Swap 10 USDC to USDT",
  }

  assert.equal(
    getProcessingLabel("trade", "Swap 10 USDC to USDT", "preparing", swapIntent),
    "Preparing swap (USDC → USDT)",
  )

  assert.equal(
    getProcessingLabel("trade", "Swap 10 USDC to USDT", "awaiting_signature", swapIntent),
    "Awaiting signature for swap (USDC → USDT)",
  )

  assert.equal(
    getProcessingLabel("trade", "Swap 10 USDC to USDT", "broadcast", swapIntent),
    "Executing swap (USDC → USDT)",
  )

  assert.equal(
    getProcessingLabel("trade", "Swap 10 USDC to USDT", "pending", swapIntent),
    "Executing swap (USDC → USDT)",
  )
})
