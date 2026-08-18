import { encodeFunctionData, parseUnits, parseEther, getAddress, isAddress } from "viem"
import { XLAYER_TESTNET_TOKENS, findToken } from "@/config/tokens"
import { ROUTER_ADDRESS_TESTNET } from "@/config/contracts"
import { XECUTE_ROUTER_ABI, XECUTE_ROUTER_BYTECODE } from "./router-abi"

export { ROUTER_ADDRESS_TESTNET, XECUTE_ROUTER_ABI, XECUTE_ROUTER_BYTECODE }

export class UnsupportedTokenError extends Error {
  constructor(tokenSymbol: string) {
    super(`Unsupported token for X Layer Testnet execution: ${tokenSymbol}`)
    this.name = "UnsupportedTokenError"
  }
}

export class MissingExecutionParameterError extends Error {
  constructor(parameter: string) {
    super(`Missing required execution parameter: ${parameter}`)
    this.name = "MissingExecutionParameterError"
  }
}

export class InvalidAmountError extends Error {
  constructor(amount: string) {
    super(`Invalid execution amount: "${amount}". Amount must be a positive numeric value.`)
    this.name = "InvalidAmountError"
  }
}

function parseStrictPositiveAmount(amount: string): void {
  if (!amount || typeof amount !== "string" || !/^\d+(?:\.\d+)?$/.test(amount.trim())) {
    throw new InvalidAmountError(amount)
  }
  const num = Number(amount)
  if (!Number.isFinite(num) || num <= 0) {
    throw new InvalidAmountError(amount)
  }
}

export function getSwapTransactionPayload({
  fromTokenSymbol,
  toTokenSymbol,
  amount,
  recipient,
  slippage = 0.5,
}: {
  fromTokenSymbol: string
  toTokenSymbol: string
  amount: string
  recipient: string
  slippage?: number
}) {
  if (!fromTokenSymbol) throw new MissingExecutionParameterError("fromToken")
  if (!toTokenSymbol) throw new MissingExecutionParameterError("toToken")
  if (!amount) throw new MissingExecutionParameterError("amount")
  if (!recipient || !isAddress(recipient, { strict: false })) throw new MissingExecutionParameterError("recipient")
  parseStrictPositiveAmount(amount)

  const fromSym = fromTokenSymbol.toUpperCase()
  const toSym = toTokenSymbol.toUpperCase()
  const fromCfg = findToken(fromSym, 1952)
  const toCfg = findToken(toSym, 1952)

  if (!fromCfg) throw new UnsupportedTokenError(fromTokenSymbol)
  if (!toCfg) throw new UnsupportedTokenError(toTokenSymbol)
  if (fromSym === toSym) throw new Error("Input and output tokens cannot be the same asset.")

  const safeRecipient = getAddress(recipient)
  const slippageBps = BigInt(Math.min(500, Math.max(0, Math.round((slippage ?? 0.5) * 100))))

  const toAddress = (toCfg.address === "native" ? "0x0000000000000000000000000000000000000000" : toCfg.address) as `0x${string}`
  const fromAddress = (fromCfg.address === "native" ? "0x0000000000000000000000000000000000000000" : fromCfg.address) as `0x${string}`

  if (fromSym === "OKB") {
    const valueWei = parseEther(amount)
    const decOut = BigInt(toCfg.decimals)
    // 1 OKB ($60) = 60 USD tokens
    const expectedOutUnits = (valueWei * BigInt(60) * (BigInt(10) ** decOut)) / (BigInt(10) ** BigInt(18))
    const minAmountOut = (expectedOutUnits * (BigInt(10000) - slippageBps)) / BigInt(10000)
    const safeMinOut = minAmountOut > BigInt(0) ? minAmountOut : BigInt(1)

    const data = encodeFunctionData({
      abi: XECUTE_ROUTER_ABI,
      functionName: "swapExactOKBForTokens",
      args: [toAddress, safeMinOut, safeRecipient],
    })

    return {
      to: ROUTER_ADDRESS_TESTNET,
      value: `0x${valueWei.toString(16)}`,
      data,
    }
  }

  if (toSym === "OKB") {
    const decIn = BigInt(fromCfg.decimals)
    const amountIn = parseUnits(amount, fromCfg.decimals)
    // 60 USD tokens = 1 OKB (10^18 wei)
    const expectedOkbWei = (amountIn * (BigInt(10) ** BigInt(18))) / (BigInt(60) * (BigInt(10) ** decIn))
    const minAmountOut = (expectedOkbWei * (BigInt(10000) - slippageBps)) / BigInt(10000)
    const safeMinOut = minAmountOut > BigInt(0) ? minAmountOut : BigInt(1)

    const data = encodeFunctionData({
      abi: XECUTE_ROUTER_ABI,
      functionName: "swapExactTokensForOKB",
      args: [fromAddress, amountIn, safeMinOut, safeRecipient],
    })

    return {
      to: ROUTER_ADDRESS_TESTNET,
      value: "0x0",
      data,
    }
  }

  // Token to Token (1:1 stable pair)
  const decIn = BigInt(fromCfg.decimals)
  const decOut = BigInt(toCfg.decimals)
  const amountIn = parseUnits(amount, fromCfg.decimals)
  const expectedOutUnits = (amountIn * (BigInt(10) ** decOut)) / (BigInt(10) ** decIn)
  const minAmountOut = (expectedOutUnits * (BigInt(10000) - slippageBps)) / BigInt(10000)
  const safeMinOut = minAmountOut > BigInt(0) ? minAmountOut : BigInt(1)

  const data = encodeFunctionData({
    abi: XECUTE_ROUTER_ABI,
    functionName: "swapExactTokensForTokens",
    args: [fromAddress, toAddress, amountIn, safeMinOut, safeRecipient],
  })

  return {
    to: ROUTER_ADDRESS_TESTNET,
    value: "0x0",
    data,
  }
}

export function getTransferTransactionPayload({
  tokenSymbol,
  amount,
  recipient,
}: {
  tokenSymbol: string
  amount: string
  recipient: string
}) {
  if (!tokenSymbol) throw new MissingExecutionParameterError("token")
  if (!amount) throw new MissingExecutionParameterError("amount")
  if (!recipient || !isAddress(recipient, { strict: false })) throw new MissingExecutionParameterError("recipient")
  parseStrictPositiveAmount(amount)

  const sym = tokenSymbol.toUpperCase()
  const tokenCfg = findToken(sym, 1952)
  if (!tokenCfg) throw new UnsupportedTokenError(tokenSymbol)

  const safeRecipient = getAddress(recipient)

  if (sym === "OKB" || tokenCfg.address === "native") {
    const valueWei = parseEther(amount)
    return {
      to: safeRecipient,
      value: `0x${valueWei.toString(16)}`,
      data: "0x",
    }
  }

  const tokenAmount = parseUnits(amount, tokenCfg.decimals)
  const data = encodeFunctionData({
    abi: [
      {
        name: "transfer",
        type: "function",
        inputs: [
          { name: "to", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ type: "bool" }],
      },
    ] as const,
    functionName: "transfer",
    args: [safeRecipient, tokenAmount],
  })

  return {
    to: tokenCfg.address as `0x${string}`,
    value: "0x0",
    data,
  }
}

export function getApprovalTransactionPayload({
  tokenSymbol,
  amount,
  spender,
}: {
  tokenSymbol: string
  amount: string
  spender: string
}) {
  if (!tokenSymbol) throw new MissingExecutionParameterError("token")
  if (amount === undefined || amount === null) throw new MissingExecutionParameterError("amount")
  if (!spender || !isAddress(spender, { strict: false })) throw new MissingExecutionParameterError("spender")

  const sym = tokenSymbol.toUpperCase()
  const tokenCfg = findToken(sym, 1952)
  if (!tokenCfg) throw new UnsupportedTokenError(tokenSymbol)
  if (tokenCfg.address === "native") {
    throw new Error("Cannot grant ERC-20 approval for native OKB.")
  }

  const safeSpender = getAddress(spender)
  const tokenAmount = amount === "0" ? BigInt(0) : parseUnits(amount, tokenCfg.decimals)

  const data = encodeFunctionData({
    abi: [
      {
        name: "approve",
        type: "function",
        inputs: [
          { name: "spender", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ type: "bool" }],
      },
    ] as const,
    functionName: "approve",
    args: [safeSpender, tokenAmount],
  })

  return {
    to: tokenCfg.address as `0x${string}`,
    value: "0x0",
    data,
  }
}
