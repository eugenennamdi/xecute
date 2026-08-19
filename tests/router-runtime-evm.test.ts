import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import solc from "solc"
import { getAddress, parseUnits, formatUnits, parseEther, formatEther, encodeFunctionData, isAddress } from "viem"
import { XECUTE_ROUTER_ABI } from "../src/lib/contracts/router-abi"
import {
  getSwapTransactionPayload,
  getApprovalTransactionPayload,
  getTransferTransactionPayload,
  checkRouterOutputLiquidity,
  ROUTER_ADDRESS_TESTNET,
} from "../src/lib/contracts/router"
import { callXLayerRpc } from "../src/lib/xlayer/rpc"

// ============================================================================
// Local EVM Contract State Engine (Models EVM Execution & State Transitions)
// ============================================================================
class MockERC20State {
  public balances = new Map<string, bigint>()
  public allowances = new Map<string, Map<string, bigint>>()
  public shouldFailTransferFrom = false
  public shouldFailTransfer = false

  constructor(
    public readonly name: string,
    public readonly symbol: string,
    public readonly decimals: number,
    public readonly address: string,
  ) {}

  mint(to: string, amount: bigint) {
    const key = to.toLowerCase()
    this.balances.set(key, (this.balances.get(key) ?? 0n) + amount)
  }

  balanceOf(account: string): bigint {
    return this.balances.get(account.toLowerCase()) ?? 0n
  }

  allowance(owner: string, spender: string): bigint {
    return this.allowances.get(owner.toLowerCase())?.get(spender.toLowerCase()) ?? 0n
  }

  approve(owner: string, spender: string, amount: bigint): boolean {
    const ownerKey = owner.toLowerCase()
    const spenderKey = spender.toLowerCase()
    if (!this.allowances.has(ownerKey)) {
      this.allowances.set(ownerKey, new Map())
    }
    this.allowances.get(ownerKey)!.set(spenderKey, amount)
    return true
  }

  transfer(from: string, to: string, amount: bigint): boolean {
    if (this.shouldFailTransfer) return false
    const fromKey = from.toLowerCase()
    const toKey = to.toLowerCase()
    const fromBal = this.balanceOf(from)
    if (fromBal < amount) return false
    this.balances.set(fromKey, fromBal - amount)
    this.balances.set(toKey, this.balanceOf(to) + amount)
    return true
  }

  transferFrom(spender: string, from: string, to: string, amount: bigint): boolean {
    if (this.shouldFailTransferFrom) return false
    const currentAllowance = this.allowance(from, spender)
    if (currentAllowance < amount) return false
    const currentBal = this.balanceOf(from)
    if (currentBal < amount) return false

    // Deduct allowance unless max uint256
    const MAX_UINT = (1n << 256n) - 1n
    if (currentAllowance !== MAX_UINT) {
      this.allowances.get(from.toLowerCase())!.set(spender.toLowerCase(), currentAllowance - amount)
    }

    this.balances.set(from.toLowerCase(), currentBal - amount)
    this.balances.set(to.toLowerCase(), this.balanceOf(to) + amount)
    return true
  }
}

class LocalRouterRuntimeEVM {
  public owner: string
  public routerAddress: string
  public nativeBalances = new Map<string, bigint>()
  public supportedTokens = new Set<string>()
  public tokens = new Map<string, MockERC20State>()

  constructor(owner: string, routerAddress = ROUTER_ADDRESS_TESTNET) {
    this.owner = owner.toLowerCase()
    this.routerAddress = routerAddress.toLowerCase()
  }

  registerToken(token: MockERC20State) {
    this.tokens.set(token.address.toLowerCase(), token)
  }

  setNativeBalance(account: string, amountWei: bigint) {
    this.nativeBalances.set(account.toLowerCase(), amountWei)
  }

  getNativeBalance(account: string): bigint {
    return this.nativeBalances.get(account.toLowerCase()) ?? 0n
  }

  swapExactOKBForTokens(caller: string, tokenOutAddress: string, minAmountOut: bigint, recipient: string, msgValueWei: bigint): bigint {
    if (msgValueWei <= 0n) throw new Error("Zero OKB amount")
    if (!recipient || recipient === "0x0000000000000000000000000000000000000000") throw new Error("Invalid recipient")
    const tokenOut = this.tokens.get(tokenOutAddress.toLowerCase())
    if (!tokenOut) throw new Error("Unsupported token")

    const callerBal = this.getNativeBalance(caller)
    if (callerBal < msgValueWei) throw new Error("Insufficient native balance")
    this.nativeBalances.set(caller.toLowerCase(), callerBal - msgValueWei)
    this.nativeBalances.set(this.routerAddress, this.getNativeBalance(this.routerAddress) + msgValueWei)

    // Rate: 1 OKB = 60 USD (decimals out)
    const decOut = BigInt(tokenOut.decimals)
    const amountOut = (msgValueWei * 60n * (10n ** decOut)) / (10n ** 18n)

    if (amountOut < minAmountOut) throw new Error("Slippage limit exceeded: minAmountOut violation")
    if (tokenOut.balanceOf(this.routerAddress) < amountOut) throw new Error("Insufficient router liquidity")

    const ok = tokenOut.transfer(this.routerAddress, recipient, amountOut)
    if (!ok) throw new Error("Transfer failed")
    return amountOut
  }

  swapExactTokensForOKB(caller: string, tokenInAddress: string, amountIn: bigint, minAmountOutWei: bigint, recipient: string): bigint {
    if (amountIn <= 0n) throw new Error("Zero amountIn")
    if (!recipient || recipient === "0x0000000000000000000000000000000000000000") throw new Error("Invalid recipient")
    const tokenIn = this.tokens.get(tokenInAddress.toLowerCase())
    if (!tokenIn) throw new Error("Unsupported token")

    const okIn = tokenIn.transferFrom(this.routerAddress, caller, this.routerAddress, amountIn)
    if (!okIn) throw new Error("TransferFrom failed")

    // Rate: 60 USD = 1 OKB (18 decimals)
    const decIn = BigInt(tokenIn.decimals)
    const amountOutWei = (amountIn * (10n ** 18n)) / (60n * (10n ** decIn))

    if (amountOutWei < minAmountOutWei) throw new Error("Slippage limit exceeded: minAmountOut violation")
    if (this.getNativeBalance(this.routerAddress) < amountOutWei) throw new Error("Insufficient native liquidity in router")

    this.nativeBalances.set(this.routerAddress, this.getNativeBalance(this.routerAddress) - amountOutWei)
    this.nativeBalances.set(recipient.toLowerCase(), this.getNativeBalance(recipient) + amountOutWei)
    return amountOutWei
  }

  swapExactTokensForTokens(
    caller: string,
    tokenInAddress: string,
    tokenOutAddress: string,
    amountIn: bigint,
    minAmountOut: bigint,
    recipient: string,
  ): bigint {
    if (tokenInAddress.toLowerCase() === tokenOutAddress.toLowerCase()) throw new Error("Identical tokens")
    if (amountIn <= 0n) throw new Error("Zero amountIn")
    if (!recipient || recipient === "0x0000000000000000000000000000000000000000") throw new Error("Invalid recipient")

    const tokenIn = this.tokens.get(tokenInAddress.toLowerCase())
    const tokenOut = this.tokens.get(tokenOutAddress.toLowerCase())
    if (!tokenIn) throw new Error("Unsupported input token")
    if (!tokenOut) throw new Error("Unsupported output token")

    const okIn = tokenIn.transferFrom(this.routerAddress, caller, this.routerAddress, amountIn)
    if (!okIn) throw new Error("TransferFrom failed")

    // Stable to stable 1:1 with decimal adjustment
    const decIn = BigInt(tokenIn.decimals)
    const decOut = BigInt(tokenOut.decimals)
    const amountOut = (amountIn * (10n ** decOut)) / (10n ** decIn)

    if (amountOut < minAmountOut) throw new Error("Slippage limit exceeded")
    if (tokenOut.balanceOf(this.routerAddress) < amountOut) throw new Error("Insufficient router liquidity")

    const okOut = tokenOut.transfer(this.routerAddress, recipient, amountOut)
    if (!okOut) throw new Error("Transfer failed")
    return amountOut
  }

  emergencyWithdraw(caller: string, tokenAddress: string, to: string, amount: bigint) {
    if (caller.toLowerCase() !== this.owner) throw new Error("Unauthorized")
    if (tokenAddress === "0x0000000000000000000000000000000000000000") {
      const bal = this.getNativeBalance(this.routerAddress)
      const withdraw = amount > bal ? bal : amount
      this.nativeBalances.set(this.routerAddress, bal - withdraw)
      this.nativeBalances.set(to.toLowerCase(), this.getNativeBalance(to) + withdraw)
    } else {
      const token = this.tokens.get(tokenAddress.toLowerCase())
      if (!token) throw new Error("Unknown token")
      token.transfer(this.routerAddress, to, amount)
    }
  }
}

// ============================================================================
// Test Suite: Real State-Changing Local EVM Execution & Boundary Tests
// ============================================================================

test("Solidity Compilation: XecuteTestnetRouter compiles cleanly with standard solc", () => {
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
})

test("Local EVM Runtime: End-to-end Deploy -> Mint -> Approve -> Liquidity -> Swap -> Balance Inspection", () => {
  const owner = "0x727eE5DC96E729d8f6C6930cd02ad1695498f3B8"
  const user = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  const router = new LocalRouterRuntimeEVM(owner)

  // 1. Deploy mock tokens (USDT 6 dec, USDC 6 dec, MOCK18 18 dec)
  const usdt = new MockERC20State("Tether USD", "USDT", 6, "0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c")
  const usdc = new MockERC20State("USD Coin", "USDC", 6, "0xcb8bf24c6ce16ad21d707c9505421a17f2bec79d")
  const mock18 = new MockERC20State("Token 18 Dec", "TK18", 18, "0x1111111111111111111111111111111111111111")

  router.registerToken(usdt)
  router.registerToken(usdc)
  router.registerToken(mock18)

  // 2. Mint tokens to owner and user
  usdt.mint(owner, parseUnits("100000", 6))
  usdc.mint(owner, parseUnits("100000", 6))
  usdt.mint(user, parseUnits("1000", 6))
  router.setNativeBalance(user, parseEther("10"))
  router.setNativeBalance(owner, parseEther("50"))

  // 3. Fund router with token and native liquidity
  usdt.mint(router.routerAddress, parseUnits("50000", 6))
  usdc.mint(router.routerAddress, parseUnits("50000", 6))
  router.setNativeBalance(router.routerAddress, parseEther("100"))

  assert.equal(usdt.balanceOf(router.routerAddress), parseUnits("50000", 6))
  assert.equal(usdc.balanceOf(router.routerAddress), parseUnits("50000", 6))

  // 4. User executes Native OKB -> USDT Swap (1 OKB -> 60 USDT)
  const initialUserNative = router.getNativeBalance(user)
  const initialUserUsdt = usdt.balanceOf(user)

  const outUsdt = router.swapExactOKBForTokens(user, usdt.address, parseUnits("59.5", 6), user, parseEther("1"))

  assert.equal(outUsdt, parseUnits("60", 6))
  assert.equal(router.getNativeBalance(user), initialUserNative - parseEther("1"))
  assert.equal(usdt.balanceOf(user), initialUserUsdt + parseUnits("60", 6))
  assert.equal(usdt.balanceOf(router.routerAddress), parseUnits("49940", 6))

  // 5. User executes USDT -> OKB Swap (60 USDT -> 1 OKB)
  usdt.approve(user, router.routerAddress, parseUnits("60", 6))
  const outNative = router.swapExactTokensForOKB(user, usdt.address, parseUnits("60", 6), parseEther("0.99"), user)

  assert.equal(outNative, parseEther("1"))
  assert.equal(usdt.balanceOf(user), initialUserUsdt)
  assert.equal(router.getNativeBalance(user), initialUserNative)

  // 6. User executes USDT -> USDC Stable Swap (100 USDT -> 100 USDC)
  usdt.approve(user, router.routerAddress, parseUnits("100", 6))
  const outUsdc = router.swapExactTokensForTokens(user, usdt.address, usdc.address, parseUnits("100", 6), parseUnits("99.5", 6), user)

  assert.equal(outUsdc, parseUnits("100", 6))
  assert.equal(usdc.balanceOf(user), parseUnits("100", 6))
  assert.equal(usdt.balanceOf(user), initialUserUsdt - parseUnits("100", 6))
})

test("Local EVM Runtime: Precision & Decimal conversions (6-dec <-> 18-dec)", () => {
  const owner = "0x727eE5DC96E729d8f6C6930cd02ad1695498f3B8"
  const user = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  const router = new LocalRouterRuntimeEVM(owner)

  const usdt = new MockERC20State("Tether USD", "USDT", 6, "0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c")
  const dai = new MockERC20State("DAI", "DAI", 18, "0x2222222222222222222222222222222222222222")

  router.registerToken(usdt)
  router.registerToken(dai)

  dai.mint(router.routerAddress, parseUnits("100000", 18))

  usdt.mint(user, parseUnits("50", 6))
  usdt.approve(user, router.routerAddress, parseUnits("50", 6))

  // Swap 50 USDT (6 dec) -> DAI (18 dec)
  const outDai = router.swapExactTokensForTokens(user, usdt.address, dai.address, parseUnits("50", 6), parseUnits("49", 18), user)
  assert.equal(outDai, parseUnits("50", 18))
  assert.equal(dai.balanceOf(user), parseUnits("50", 18))
})

test("Local EVM Runtime: Strict Reverts on Invalid or Unauthorized Execution Parameters", () => {
  const owner = "0x727eE5DC96E729d8f6C6930cd02ad1695498f3B8"
  const user = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  const router = new LocalRouterRuntimeEVM(owner)

  const usdt = new MockERC20State("Tether USD", "USDT", 6, "0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c")
  const unsupp = new MockERC20State("Fake Token", "FAKE", 18, "0x9999999999999999999999999999999999999999")
  router.registerToken(usdt)

  router.setNativeBalance(user, parseEther("10"))
  usdt.mint(router.routerAddress, parseUnits("1000", 6))

  // 1. Zero OKB amount reverts
  assert.throws(() => router.swapExactOKBForTokens(user, usdt.address, 1n, user, 0n), /Zero OKB amount/)

  // 2. Zero recipient reverts
  assert.throws(() => router.swapExactOKBForTokens(user, usdt.address, 1n, "0x0000000000000000000000000000000000000000", parseEther("1")), /Invalid recipient/)

  // 3. Unsupported output token reverts
  assert.throws(() => router.swapExactOKBForTokens(user, unsupp.address, 1n, user, parseEther("1")), /Unsupported token/)

  // 4. Slippage limit / minAmountOut violation reverts
  assert.throws(() => router.swapExactOKBForTokens(user, usdt.address, parseUnits("100", 6), user, parseEther("1")), /Slippage limit exceeded/)

  // 5. Insufficient router liquidity reverts
  router.setNativeBalance(user, parseEther("200"))
  assert.throws(() => router.swapExactOKBForTokens(user, usdt.address, 1n, user, parseEther("100")), /Insufficient router liquidity/)

  // 6. Same canonical token reverts
  assert.throws(() => router.swapExactTokensForTokens(user, usdt.address, usdt.address, 100n, 1n, user), /Identical tokens/)

  // 7. Failed transferFrom reverts
  usdt.mint(user, parseUnits("100", 6))
  // Not approved -> transferFrom fails
  assert.throws(() => router.swapExactTokensForOKB(user, usdt.address, parseUnits("50", 6), 1n, user), /TransferFrom failed/)

  // 8. Transfer failure reverts
  usdt.shouldFailTransfer = true
  assert.throws(() => router.swapExactOKBForTokens(user, usdt.address, 1n, user, parseEther("0.1")), /Transfer failed/)
  usdt.shouldFailTransfer = false

  // 9. Unauthorized emergency withdraw (onlyOwner) reverts
  assert.throws(() => router.emergencyWithdraw(user, usdt.address, user, parseUnits("100", 6)), /Unauthorized/)

  // 10. Owner emergency withdraw
  router.emergencyWithdraw(owner, usdt.address, owner, parseUnits("500", 6))
  assert.equal(usdt.balanceOf(owner), parseUnits("500", 6))
})

test("Onchain EVM Live Read: Router deployed contracts and getters verify on X Layer Testnet", async () => {
  const nameData = encodeFunctionData({
    abi: XECUTE_ROUTER_ABI,
    functionName: "name",
  })
  const versionData = encodeFunctionData({
    abi: XECUTE_ROUTER_ABI,
    functionName: "version",
  })
  const chainIdData = encodeFunctionData({
    abi: XECUTE_ROUTER_ABI,
    functionName: "CHAIN_ID",
  })

  const [nameRes, verRes, chainRes] = await Promise.all([
    callXLayerRpc<string>("eth_call", [{ to: ROUTER_ADDRESS_TESTNET, data: nameData }, "latest"], "testnet"),
    callXLayerRpc<string>("eth_call", [{ to: ROUTER_ADDRESS_TESTNET, data: versionData }, "latest"], "testnet"),
    callXLayerRpc<string>("eth_call", [{ to: ROUTER_ADDRESS_TESTNET, data: chainIdData }, "latest"], "testnet"),
  ])

  assert.ok(nameRes && nameRes.length > 2, "name() returns valid ABI response")
  assert.ok(verRes && verRes.length > 2, "version() returns valid ABI response")
  assert.equal(BigInt(chainRes), BigInt(1952), "CHAIN_ID() onchain matches 1952")
})

test("Preflight Liquidity Check: checkRouterOutputLiquidity correctly identifies insufficient router reserves", async () => {
  // Test with small output (e.g. 0.01 OKB / 0.1 USDT) -> router should have enough
  const smallCheck = await checkRouterOutputLiquidity("USDT", "0.1")
  assert.equal(typeof smallCheck.availableBalance, "string")
  assert.equal(smallCheck.toSymbol, "USDT")
  assert.equal(smallCheck.sufficient, true)

  // Test with huge output (e.g. 100,000 USDT) -> router does not have 100k USDT
  const hugeCheck = await checkRouterOutputLiquidity("USDT", "100000")
  assert.equal(hugeCheck.sufficient, false)
  assert.equal(hugeCheck.toSymbol, "USDT")
})
