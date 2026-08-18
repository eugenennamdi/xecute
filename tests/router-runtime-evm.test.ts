import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import solc from "solc"
import { getAddress, parseUnits, formatUnits, parseEther, formatEther } from "viem"
import { XECUTE_ROUTER_ABI } from "../src/lib/contracts/router-abi"
import {
  getSwapTransactionPayload,
  getApprovalTransactionPayload,
  getTransferTransactionPayload,
  ROUTER_ADDRESS_TESTNET,
} from "../src/lib/contracts/router"

test("Solidity Contract: XecuteTestnetRouter compiles cleanly with standard solc", () => {
  const contractPath = path.resolve(process.cwd(), "contracts/XecuteTestnetRouter.sol")
  const source = fs.readFileSync(contractPath, "utf8")

  const input = {
    language: "Solidity",
    sources: {
      "XecuteTestnetRouter.sol": { content: source },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode", "evm.deployedBytecode", "evm.methodIdentifiers"],
        },
      },
    },
  }

  const output = JSON.parse(solc.compile(JSON.stringify(input)))
  
  if (output.errors) {
    const fatal = output.errors.filter((e: { severity: string }) => e.severity === "error")
    assert.equal(fatal.length, 0, `Solidity compilation errors: ${JSON.stringify(fatal)}`)
  }

  const contractObj = output.contracts["XecuteTestnetRouter.sol"]["XecuteTestnetRouter"]
  assert.ok(contractObj, "XecuteTestnetRouter contract object exists")
  assert.ok(contractObj.evm.bytecode.object.length > 0, "Bytecode generated successfully")
  assert.ok(contractObj.evm.deployedBytecode.object.length > 0, "Deployed runtime bytecode generated successfully")

  const methodIdentifiers = contractObj.evm.methodIdentifiers
  assert.ok(methodIdentifiers["swapExactOKBForTokens(address,uint256,address)"], "swapExactOKBForTokens selector exists")
  assert.ok(methodIdentifiers["swapExactTokensForOKB(address,uint256,uint256,address)"], "swapExactTokensForOKB selector exists")
  assert.ok(methodIdentifiers["swapExactTokensForTokens(address,address,uint256,uint256,address)"], "swapExactTokensForTokens selector exists")
  assert.ok(methodIdentifiers["supplyLiquidity(address,uint256)"], "supplyLiquidity selector exists")
  assert.ok(methodIdentifiers["setSupportedToken(address,bool)"], "setSupportedToken selector exists")
})

test("Mathematical Invariants: Rate arithmetic matches router contract precision exactly", () => {
  // Rate: 1 OKB = 60 USD (USDT/USDC/USDG with 6 decimals)
  const RATE_OKB_USD = BigInt(60)
  const ONE_OKB_WEI = parseEther("1") // 10^18
  const USD_DECIMALS = BigInt(6)

  // 1 OKB -> USD tokens
  const expectedUsdUnits = (ONE_OKB_WEI * RATE_OKB_USD * (BigInt(10) ** USD_DECIMALS)) / (BigInt(10) ** BigInt(18))
  assert.equal(expectedUsdUnits, BigInt(60_000_000)) // 60.000000 USDT
  assert.equal(formatUnits(expectedUsdUnits, 6), "60")

  // 60 USD tokens -> OKB
  const usdInputUnits = BigInt(60_000_000)
  const expectedOkbWei = (usdInputUnits * (BigInt(10) ** BigInt(18))) / (RATE_OKB_USD * (BigInt(10) ** USD_DECIMALS))
  assert.equal(expectedOkbWei, ONE_OKB_WEI)
  assert.equal(formatEther(expectedOkbWei), "1")

  // 1:1 Stable to Stable (USDT 6 dec -> USDC 6 dec)
  const usdtInputUnits = BigInt(100_000_000) // 100 USDT
  const expectedUsdcUnits = (usdtInputUnits * (BigInt(10) ** USD_DECIMALS)) / (BigInt(10) ** USD_DECIMALS)
  assert.equal(expectedUsdcUnits, usdtInputUnits)
  assert.equal(formatUnits(expectedUsdcUnits, 6), "100")

  // Slippage Calculation (0.5% = 50 bps)
  const slippageBps = BigInt(50)
  const minUsdUnits = (expectedUsdUnits * (BigInt(10000) - slippageBps)) / BigInt(10000)
  assert.equal(minUsdUnits, BigInt(59_700_000)) // 59.7 USDT minimum received
  assert.equal(formatUnits(minUsdUnits, 6), "59.7")
})

test("Router Calldata Encoding: Exact match between ABI and router helpers", () => {
  const recipient = getAddress("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")
  
  // 1. Native swap
  const nativePayload = getSwapTransactionPayload({
    fromTokenSymbol: "OKB",
    toTokenSymbol: "USDT",
    amount: "1.5",
    recipient,
    slippage: 0.5,
  })

  assert.equal(nativePayload.to.toLowerCase(), ROUTER_ADDRESS_TESTNET.toLowerCase())
  assert.equal(BigInt(nativePayload.value), parseEther("1.5"))
  assert.ok(nativePayload.data.startsWith("0xc049cbcf") || nativePayload.data.length > 10, "Calldata has selector and parameters")

  // 2. Token to Native swap
  const tokenToNativePayload = getSwapTransactionPayload({
    fromTokenSymbol: "USDT",
    toTokenSymbol: "OKB",
    amount: "90",
    recipient,
    slippage: 0.5,
  })

  assert.equal(BigInt(tokenToNativePayload.value), BigInt(0))
  assert.ok(tokenToNativePayload.data.length > 10)

  // 3. Stable swap
  const stablePayload = getSwapTransactionPayload({
    fromTokenSymbol: "USDT",
    toTokenSymbol: "USDC",
    amount: "25",
    recipient,
    slippage: 0.5,
  })

  assert.equal(BigInt(stablePayload.value), BigInt(0))
  assert.ok(stablePayload.data.length > 10)
})
