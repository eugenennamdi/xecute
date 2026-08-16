import { getAddress } from "viem"

export type Token = {
  symbol: string
  name: string
  address: `0x${string}` | "native"
  decimals: number
  chainId: 1952 | 196
  isTestAsset: boolean
  verified: boolean
  source?: string
  icon?: string
  description?: string
}

export const XLAYER_TESTNET_TOKENS: Record<string, Token> = {
  OKB: {
    symbol: "OKB",
    name: "Testnet OKB (Native)",
    address: "native",
    decimals: 18,
    chainId: 1952,
    isTestAsset: true,
    verified: true,
    source: "native_gas",
    description: "X Layer Testnet Native Gas Token (Claimable via OKX Faucet)",
  },
  USDT: {
    symbol: "USDT",
    name: "Testnet Tether USD (USD₮0)",
    address: getAddress("0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c"),
    decimals: 6,
    chainId: 1952,
    isTestAsset: true,
    verified: true,
    source: "onchain_bytecode",
    description: "X Layer Testnet USDT (Official faucet token)",
  },
  USDC: {
    symbol: "USDC",
    name: "Testnet USD Coin (USDC_TEST)",
    address: getAddress("0xcb8bf24c6ce16ad21d707c9505421a17f2bec79d"),
    decimals: 6,
    chainId: 1952,
    isTestAsset: true,
    verified: true,
    source: "onchain_bytecode",
    description: "X Layer Testnet USDC (Official faucet token)",
  },
  USDG: {
    symbol: "USDG",
    name: "Testnet Global Dollar (USDG)",
    address: getAddress("0xa78e2baabaf5c4f36b7fc394725deb68d332eec1"),
    decimals: 6,
    chainId: 1952,
    isTestAsset: true,
    verified: true,
    source: "onchain_bytecode",
    description: "X Layer Testnet USDG (Official faucet token)",
  },
  // Explicit aliases for testnet queries
  "USD₮0": {
    symbol: "USDT",
    name: "Testnet Tether USD (USD₮0)",
    address: getAddress("0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c"),
    decimals: 6,
    chainId: 1952,
    isTestAsset: true,
    verified: true,
    source: "onchain_bytecode",
    description: "X Layer Testnet USDT (Onchain symbol match)",
  },
  USDT0: {
    symbol: "USDT",
    name: "Testnet Tether USD (USD₮0)",
    address: getAddress("0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c"),
    decimals: 6,
    chainId: 1952,
    isTestAsset: true,
    verified: true,
    source: "onchain_bytecode",
  },
}

export const XLAYER_MAINNET_TOKENS: Record<string, Token> = {
  OKB: {
    symbol: "OKB",
    name: "OKB (Native)",
    address: "native",
    decimals: 18,
    chainId: 196,
    isTestAsset: false,
    verified: true,
    source: "native_gas",
    description: "X Layer Native Gas Token",
  },
  WOKB: {
    symbol: "WOKB",
    name: "Wrapped OKB",
    address: getAddress("0xe538905cf8410324e03a5a23c1c177a474d59b2b"),
    decimals: 18,
    chainId: 196,
    isTestAsset: false,
    verified: true,
    source: "onchain_bytecode",
    description: "Wrapped OKB ERC-20 contract on X Layer Mainnet",
  },
  USDT0: {
    symbol: "USD₮0",
    name: "Tether USD (USD₮0 LayerZero OFT)",
    address: getAddress("0x779ded0c9e1022225f8e0630b35a9b54be713736"),
    decimals: 6,
    chainId: 196,
    isTestAsset: false,
    verified: true,
    source: "onchain_bytecode",
    description: "Primary LayerZero OFT USDT (USD₮0) on X Layer Mainnet",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD (Bridged)",
    address: getAddress("0x1e4a5963abfd975d8c9021ce480b42188849d41d"),
    decimals: 6,
    chainId: 196,
    isTestAsset: false,
    verified: true,
    source: "onchain_bytecode",
    description: "Bridged Tether USD contract on X Layer Mainnet",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin (Native Circle)",
    address: getAddress("0xB6CEceAB302E2E4948951eE7843FC24E92933061"),
    decimals: 6,
    chainId: 196,
    isTestAsset: false,
    verified: true,
    source: "onchain_bytecode",
    description: "Official Native Circle USDC on X Layer Mainnet",
  },
  USDC_BRIDGED: {
    symbol: "USDC",
    name: "USD Coin (Bridged)",
    address: getAddress("0x74b7F16337b8972027F6196A17a631aC6dE26d22"),
    decimals: 6,
    chainId: 196,
    isTestAsset: false,
    verified: true,
    source: "onchain_bytecode",
    description: "Bridged USD Coin on X Layer Mainnet",
  },
  WETH: {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: getAddress("0x5a77f1443d16ee5761d310e38b62f77f726bc71c"),
    decimals: 18,
    chainId: 196,
    isTestAsset: false,
    verified: true,
    source: "onchain_bytecode",
    description: "Wrapped Ether on X Layer Mainnet",
  },
  WBTC: {
    symbol: "WBTC",
    name: "Wrapped BTC",
    address: getAddress("0xEA034fb02eB1808C2cc3adbC15f447B93CbE08e1"),
    decimals: 8,
    chainId: 196,
    isTestAsset: false,
    verified: true,
    source: "onchain_bytecode",
    description: "Wrapped BTC on X Layer Mainnet",
  },
}

export function findToken(symbol: string, chainId: number = 1952): Token | null {
  const upper = symbol.trim().toUpperCase()
  if (chainId === 1952) {
    const direct = XLAYER_TESTNET_TOKENS[symbol] || XLAYER_TESTNET_TOKENS[upper]
    if (direct) return direct
    if (upper === "XUSDT" || upper === "USDT" || upper === "USDT0" || upper === "USD₮0") return XLAYER_TESTNET_TOKENS.USDT
    if (upper === "XUSDC" || upper === "USDC" || upper === "USDC_TEST") return XLAYER_TESTNET_TOKENS.USDC
    if (upper === "XUSDG" || upper === "USDG") return XLAYER_TESTNET_TOKENS.USDG
    if (upper === "OKB" || upper === "XOKB") return XLAYER_TESTNET_TOKENS.OKB
    return null
  }

  if (chainId === 196) {
    const direct = XLAYER_MAINNET_TOKENS[symbol] || XLAYER_MAINNET_TOKENS[upper]
    if (direct) return direct
    if (upper === "USDT0" || upper === "USD₮0") return XLAYER_MAINNET_TOKENS.USDT0
    if (upper === "USDT" || upper === "USDT_BRIDGED") return XLAYER_MAINNET_TOKENS.USDT
    if (upper === "USDC") return XLAYER_MAINNET_TOKENS.USDC
    if (upper === "USDC_BRIDGED" || upper === "USDC.E") return XLAYER_MAINNET_TOKENS.USDC_BRIDGED
    if (upper === "WETH" || upper === "ETH" || upper === "XETH") return XLAYER_MAINNET_TOKENS.WETH
    if (upper === "WBTC" || upper === "BTC" || upper === "XBTC") return XLAYER_MAINNET_TOKENS.WBTC
    if (upper === "OKB") return XLAYER_MAINNET_TOKENS.OKB
    if (upper === "WOKB") return XLAYER_MAINNET_TOKENS.WOKB
    return null
  }

  return null
}
