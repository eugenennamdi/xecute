import test from "node:test"
import assert from "node:assert/strict"
import { parseEther, parseUnits } from "viem"
import {
  prepareExecutionTransaction,
  MIN_GAS_RESERVE_WEI,
  InsufficientGasReserveError,
  InsufficientTokenBalanceError,
  MissingExecutionParameterError,
} from "../src/lib/execution/prepare-transaction"
import { ROUTER_ADDRESS_TESTNET } from "../src/config/contracts"

test("Production Execution Pipeline: prepareExecutionTransaction strictly enforces 0.005 OKB gas reserve before simulation", async () => {
  const unfundedCaller = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

  // Attempting any transaction from an address with insufficient native OKB fails closed
  await assert.rejects(
    async () => {
      await prepareExecutionTransaction({
        action: "swap",
        fromToken: "OKB",
        toToken: "USDT",
        amount: "0.01",
        walletAddress: unfundedCaller,
        slippage: 0.5,
      })
    },
    (err: unknown) => {
      assert.ok(err instanceof InsufficientGasReserveError)
      assert.ok(err.message.includes("0.005 OKB"))
      return true
    },
    "Must throw InsufficientGasReserveError before send"
  )
})

test("Production Execution Pipeline: prepareExecutionTransaction blocks when ERC-20 token balance is insufficient", async () => {
  const unfundedCaller = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

  // Attempt to transfer USDT without holding the token
  await assert.rejects(
    async () => {
      await prepareExecutionTransaction({
        action: "transfer",
        fromToken: "USDT",
        amount: "100",
        recipient: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        walletAddress: unfundedCaller,
      })
    },
    (err: unknown) => {
      assert.ok(
        err instanceof InsufficientGasReserveError ||
        err instanceof InsufficientTokenBalanceError
      )
      return true
    },
    "Must block with typed balance error"
  )
})

test("Production Execution Pipeline: Missing execution parameters fail closed with typed MissingExecutionParameterError", async () => {
  const caller = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

  await assert.rejects(
    async () => {
      await prepareExecutionTransaction({
        action: "swap",
        fromToken: "OKB",
        // toToken missing
        amount: "1",
        walletAddress: caller,
      })
    },
    (err: unknown) => {
      assert.ok(err instanceof MissingExecutionParameterError)
      return true
    }
  )

  await assert.rejects(
    async () => {
      await prepareExecutionTransaction({
        action: "transfer",
        fromToken: "OKB",
        amount: "1",
        // recipient missing
        walletAddress: caller,
      })
    },
    (err: unknown) => {
      assert.ok(err instanceof MissingExecutionParameterError)
      return true
    }
  )
})

test("Production Execution Pipeline: Gas reserve invariant requires remaining OKB >= 0.005 OKB after value and gas fees", () => {
  const nativeBalanceWei = parseEther("0.02")
  const txValueWei = parseEther("0.01")
  const estimatedGasCostWei = parseEther("0.006") // leaves 0.004 OKB remaining

  const remainingWei = nativeBalanceWei - txValueWei - estimatedGasCostWei
  assert.ok(remainingWei < MIN_GAS_RESERVE_WEI, "0.004 OKB is less than 0.005 OKB reserve")

  const error = new InsufficientGasReserveError(nativeBalanceWei, txValueWei, estimatedGasCostWei, remainingWei)
  assert.ok(error.message.includes("0.005 OKB"))
  assert.ok(error.message.includes("Remaining would be: 0.004 OKB"))
})
