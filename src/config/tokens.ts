export type Token = {
  symbol: string
  name: string
  address: `0x${string}` | "native"
  decimals: number
  chainId: 1952 | 196
  isTestAsset: boolean
  verified: boolean
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
    description: "X Layer Testnet Native Gas Token (Claimable via OKX Faucet)",
  },
  USDT: {
    symbol: "USDT",
    name: "Testnet Tether USD (USD₮0)",
    address: "0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c",
    decimals: 6,
    chainId: 1952,
    isTestAsset: true,
    verified: true,
    description: "X Layer Testnet USDT (USD₮0 official faucet token)",
  },
  USDC: {
    symbol: "USDC",
    name: "Testnet USD Coin (USDC_TEST)",
    address: "0xcb8bf24c6ce16ad21d707c9505421a17f2bec79d",
    decimals: 6,
    chainId: 1952,
    isTestAsset: true,
    verified: true,
    description: "X Layer Testnet USDC (USDC_TEST official faucet token)",
  },
  USDG: {
    symbol: "USDG",
    name: "Testnet Global Dollar (USDG)",
    address: "0xa78e2baabaf5c4f36b7fc394725deb68d332eec1",
    decimals: 6,
    chainId: 1952,
    isTestAsset: true,
    verified: true,
    description: "X Layer Testnet USDG (Official faucet token)",
  },
  // Aliases for compatibility
  USDT0: {
    symbol: "USDT",
    name: "Testnet Tether USD (USD₮0)",
    address: "0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c",
    decimals: 6,
    chainId: 1952,
    isTestAsset: true,
    verified: true,
    description: "X Layer Testnet USDT (Alias for USDT0)",
  },
  xUSDT: {
    symbol: "USDT",
    name: "Testnet Tether USD",
    address: "0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c",
    decimals: 6,
    chainId: 1952,
    isTestAsset: true,
    verified: true,
    description: "X Layer Testnet USDT (Alias for xUSDT)",
  },
  USDC_TEST: {
    symbol: "USDC",
    name: "Testnet USD Coin (USDC_TEST)",
    address: "0xcb8bf24c6ce16ad21d707c9505421a17f2bec79d",
    decimals: 6,
    chainId: 1952,
    isTestAsset: true,
    verified: true,
    description: "X Layer Testnet USDC (Alias for USDC_TEST)",
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
    description: "X Layer Native Gas Token",
  },
  WOKB: {
    symbol: "WOKB",
    name: "Wrapped OKB",
    address: "0xe538905cf8410324e03a5a23c1c177a474d59b2b",
    decimals: 18,
    chainId: 196,
    isTestAsset: false,
    verified: true,
    description: "Wrapped OKB ERC-20 contract on X Layer",
  },
  USDT0: {
    symbol: "USDT0",
    name: "Tether USD (USDT0)",
    address: "0x1e4a5963abfd975d8c9021ce480b42188849d41d",
    decimals: 6,
    chainId: 196,
    isTestAsset: false,
    verified: true,
    description: "Official Tether token on X Layer",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    address: "0x1e4a5963abfd975d8c9021ce480b42188849d41d",
    decimals: 6,
    chainId: 196,
    isTestAsset: false,
    verified: true,
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x74b7f16337b8f9de7fb3fc82b0b1404685345107",
    decimals: 6,
    chainId: 196,
    isTestAsset: false,
    verified: true,
  },
  WETH: {
    symbol: "xETH",
    name: "X Layer Wrapped Ether",
    address: "0x5a77f1443d16ee5761d310e38b62f77f726bc71c",
    decimals: 18,
    chainId: 196,
    isTestAsset: false,
    verified: true,
  },
  XETH: {
    symbol: "xETH",
    name: "X Layer Wrapped Ether",
    address: "0x5a77f1443d16ee5761d310e38b62f77f726bc71c",
    decimals: 18,
    chainId: 196,
    isTestAsset: false,
    verified: true,
  },
  WBTC: {
    symbol: "xBTC",
    name: "X Layer Wrapped Bitcoin",
    address: "0xe32812497678bb0bc161c5c0c2937748805f3246",
    decimals: 8,
    chainId: 196,
    isTestAsset: false,
    verified: true,
  },
  XBTC: {
    symbol: "xBTC",
    name: "X Layer Wrapped Bitcoin",
    address: "0xe32812497678bb0bc161c5c0c2937748805f3246",
    decimals: 8,
    chainId: 196,
    isTestAsset: false,
    verified: true,
  },
}

export function findToken(symbol: string, chainId: number = 1952): Token | null {
  const upper = symbol.trim().toUpperCase()
  if (chainId === 1952) {
    const direct = XLAYER_TESTNET_TOKENS[symbol] || XLAYER_TESTNET_TOKENS[upper]
    if (direct) return direct
    if (upper === "XUSDT" || upper === "USDT" || upper === "USDT0") return XLAYER_TESTNET_TOKENS.USDT
    if (upper === "XUSDC" || upper === "USDC") return XLAYER_TESTNET_TOKENS.USDC
    if (upper === "XUSDG" || upper === "USDG") return XLAYER_TESTNET_TOKENS.USDG
    if (upper === "OKB" || upper === "XOKB") return XLAYER_TESTNET_TOKENS.OKB
    return null
  }

  const direct = XLAYER_MAINNET_TOKENS[symbol] || XLAYER_MAINNET_TOKENS[upper]
  if (direct) return direct
  if (upper === "USDT" || upper === "USDT0") return XLAYER_MAINNET_TOKENS.USDT0
  if (upper === "USDC") return XLAYER_MAINNET_TOKENS.USDC
  if (upper === "WETH" || upper === "ETH" || upper === "XETH") return XLAYER_MAINNET_TOKENS.XETH
  if (upper === "WBTC" || upper === "BTC" || upper === "XBTC") return XLAYER_MAINNET_TOKENS.XBTC
  if (upper === "OKB") return XLAYER_MAINNET_TOKENS.OKB
  if (upper === "WOKB") return XLAYER_MAINNET_TOKENS.WOKB
  return null
}
