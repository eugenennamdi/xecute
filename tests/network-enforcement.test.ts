import assert from 'node:assert/strict'
import test from 'node:test'

import { parseIntent } from '../src/agents/intent-parser'
import { prepareAction } from '../src/lib/action-plan'
import { evaluateIntentSafety } from '../src/lib/safety/policy'
import { TestnetSwapAdapter } from '../src/lib/adapters/trade/testnet-swap-adapter'
import { MainnetDexQuoteAdapter } from '../src/lib/adapters/trade/mainnet-dex-quote-adapter'
import {
  getSwapTransactionPayload,
  getTransferTransactionPayload,
  getApprovalTransactionPayload,
  MissingExecutionParameterError,
  UnsupportedTokenError,
} from '../src/lib/contracts/router'

test('Network Enforcement: TestnetSwapAdapter strictly rejects mainnet context or intent', () => {
  const adapter = new TestnetSwapAdapter()

  assert.equal(
    adapter.supports(
      { mode: 'trade', network: 'testnet', fromToken: 'OKB', toToken: 'USDT', amount: '1' } as any,
      { chainId: 196 },
    ),
    false,
  )

  assert.equal(
    adapter.supports(
      { mode: 'trade', network: 'mainnet', fromToken: 'OKB', toToken: 'USDT', amount: '1' } as any,
      { chainId: 1952 },
    ),
    false,
  )

  assert.equal(
    adapter.supports(
      { mode: 'trade', network: 'testnet', fromToken: 'OKB', toToken: 'USDT', amount: '1' } as any,
      { chainId: 1952 },
    ),
    true,
  )
})

test('Network Enforcement: MainnetDexQuoteAdapter strictly prevents buildTransaction execution', async () => {
  const adapter = new MainnetDexQuoteAdapter()

  const tx = await adapter.buildTransaction(
    { mode: 'trade', network: 'mainnet', fromToken: 'USDT0', toToken: 'OKB', amount: '10' } as any,
    { chainId: 196 },
  )

  assert.equal(tx, null)
  assert.equal(adapter.executionEnabled, false)
})

test('Execution Boundary: Transaction builders throw typed MissingExecutionParameterError on missing parameters', () => {
  assert.throws(
    () =>
      getSwapTransactionPayload({
        fromTokenSymbol: '',
        toTokenSymbol: 'USDT',
        amount: '1',
        recipient: '0x727ee5DC96E729d8f6C6930cd02ad1695498f3B8',
      }),
    (err: unknown) => err instanceof MissingExecutionParameterError,
  )

  assert.throws(
    () =>
      getSwapTransactionPayload({
        fromTokenSymbol: 'OKB',
        toTokenSymbol: 'USDT',
        amount: '',
        recipient: '0x727ee5DC96E729d8f6C6930cd02ad1695498f3B8',
      }),
    (err: unknown) => err instanceof MissingExecutionParameterError,
  )

  assert.throws(
    () =>
      getTransferTransactionPayload({
        tokenSymbol: 'OKB',
        amount: '1',
        recipient: '',
      }),
    (err: unknown) => err instanceof MissingExecutionParameterError,
  )

  assert.throws(
    () =>
      getApprovalTransactionPayload({
        tokenSymbol: 'USDT',
        amount: '10',
        spender: '',
      }),
    (err: unknown) => err instanceof MissingExecutionParameterError,
  )
})

test('Execution Boundary: Unknown or unverified tokens fail closed without dummy addresses', () => {
  assert.throws(
    () =>
      getSwapTransactionPayload({
        fromTokenSymbol: 'SHIB_UNKNOWN',
        toTokenSymbol: 'USDT',
        amount: '100',
        recipient: '0x727ee5DC96E729d8f6C6930cd02ad1695498f3B8',
      }),
    (err: unknown) => err instanceof UnsupportedTokenError,
  )

  assert.throws(
    () =>
      getTransferTransactionPayload({
        tokenSymbol: 'RANDOM_FAKE',
        amount: '100',
        recipient: '0x727ee5DC96E729d8f6C6930cd02ad1695498f3B8',
      }),
    (err: unknown) => err instanceof UnsupportedTokenError,
  )
})
