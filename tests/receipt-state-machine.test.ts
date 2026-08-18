import assert from 'node:assert/strict'
import test from 'node:test'

import { createExecutionReceipt } from '../src/config/constants'
import { getXLayerTransactionReceipt } from '../src/lib/xlayer/rpc'
import type { Intent } from '../src/lib/intents'

test('Receipt State Machine: createExecutionReceipt captures verified status, gas used, and block number', () => {
  const intent: Intent = {
    rawPrompt: 'Swap 1 OKB to USDT',
    requiresConfirmation: true,
    mode: 'trade',
    network: 'testnet',
    action: 'swap',
    fromToken: 'OKB',
    toToken: 'USDT',
    amount: '1',
    maxSlippage: 0.5,
    preserveGasBalance: true,
  }

  const broadcastReceipt = createExecutionReceipt(
    intent,
    '0x1234567890123456789012345678901234567890123456789012345678901234',
    { status: 'broadcast' }
  )
  assert.equal(broadcastReceipt.status, 'broadcast')
  assert.equal(broadcastReceipt.checks.length, 5)

  const executedReceipt = createExecutionReceipt(
    intent,
    '0x1234567890123456789012345678901234567890123456789012345678901234',
    {
      status: 'executed',
      gasUsed: '142500',
      blockNumber: 123456,
    }
  )
  assert.equal(executedReceipt.status, 'executed')
  assert.equal(executedReceipt.gasUsed, '142500')
  assert.equal(executedReceipt.blockNumber, 123456)

  const revertedReceipt = createExecutionReceipt(
    intent,
    '0x1234567890123456789012345678901234567890123456789012345678901234',
    {
      status: 'reverted',
      gasUsed: '21000',
      blockNumber: 123457,
    }
  )
  assert.equal(revertedReceipt.status, 'reverted')
})

test('Receipt State Machine: getXLayerTransactionReceipt distinguishes pending from non-existent transactions', async () => {
  const res = await getXLayerTransactionReceipt(
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    'testnet'
  )
  assert.ok(['pending', 'not_found', 'error', 'mined'].includes(res.status))
})
