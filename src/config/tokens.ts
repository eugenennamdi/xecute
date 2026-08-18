import { getAddress } from "viem"

export type TokenVariant =
  | "current"
  | "legacy-wrapped"
  | "legacy-bridged"
  | "native-gas"
  | "test-official"
  | "test-simulated"

export type Token = {
  canonicalAssetId: string
  symbol: string
  displaySymbol: string
  name: string
  aliases: string[]
  address: `0x${string}` | "native"
  decimals: number
  chainId: 1952 | 196
  variant: TokenVariant
  provenance: string
  deprecated?: boolean
  isTestAsset: boolean
  verified: boolean
  icon?: string
  description?: string
  source?: string
}

export const XLAYER_TESTNET_TOKENS: Record<string, Token> = {
  OKB: {
    canonicalAssetId: "xlayer-testnet-okb",
    symbol: "OKB",
    displaySymbol: "OKB",
    name: "Testnet OKB (Native)",
    aliases: ["OKB", "XOKB"],
    address: "native",
    decimals: 18,
    chainId: 1952,
    variant: "native-gas",
    provenance: "Official X Layer Testnet Native Gas Token (OKX Faucet)",
    isTestAsset: true,
    verified: true,
    source: "native_gas",
    description: "X Layer Testnet Native Gas Token (Claimable via OKX Faucet)",
  },
  USDT: {
    canonicalAssetId: "xlayer-testnet-usdt0",
    symbol: "USDT",
    displaySymbol: "USD₮0",
    name: "Testnet Tether USD (USD₮0)",
    aliases: ["USDT", "USD₮0", "USDT0", "XUSDT"],
    address: getAddress("0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c"),
    decimals: 6,
    chainId: 1952,
    variant: "test-official",
    provenance: "Official OKX Testnet standard / Payment documentation",
    isTestAsset: true,
    verified: true,
    source: "official_faucet",
    description: "X Layer Testnet USD₮0 (Official OKX payment & faucet token)",
  },
  USDC: {
    canonicalAssetId: "xlayer-testnet-usdc",
    symbol: "USDC",
    displaySymbol: "USDC",
    name: "Testnet USD Coin (USDC_TEST)",
    aliases: ["USDC", "USDC_TEST", "XUSDC"],
    address: getAddress("0xcb8bf24c6ce16ad21d707c9505421a17f2bec79d"),
    decimals: 6,
    chainId: 1952,
    variant: "test-simulated",
    provenance: "X Layer Testnet Faucet asset / Router supported",
    isTestAsset: true,
    verified: true,
    source: "testnet_faucet",
    description: "X Layer Testnet USDC (Official faucet token)",
  },
  USDG: {
    canonicalAssetId: "xlayer-testnet-usdg",
    symbol: "USDG",
    displaySymbol: "USDG",
    name: "Testnet Global Dollar (USDG)",
    aliases: ["USDG", "XUSDG"],
    address: getAddress("0xa78e2baabaf5c4f36b7fc394725deb68d332eec1"),
    decimals: 6,
    chainId: 1952,
    variant: "test-simulated",
    provenance: "X Layer Testnet Faucet asset / Router supported",
    isTestAsset: true,
    verified: true,
    source: "testnet_faucet",
    description: "X Layer Testnet USDG (Official faucet token)",
  },
}

export const XLAYER_MAINNET_TOKENS: Record<string, Token> = {
  OKB: {
    canonicalAssetId: "xlayer-mainnet-okb",
    symbol: "OKB",
    displaySymbol: "OKB",
    name: "OKB (Native)",
    aliases: ["OKB"],
    address: "native",
    decimals: 18,
    chainId: 196,
    variant: "native-gas",
    provenance: "X Layer Native Gas Token",
    isTestAsset: false,
    verified: true,
    source: "native_gas",
    description: "X Layer Native Gas Token",
  },
  WOKB: {
    canonicalAssetId: "xlayer-mainnet-wokb",
    symbol: "WOKB",
    displaySymbol: "WOKB",
    name: "Wrapped OKB",
    aliases: ["WOKB", "XOKB"],
    address: getAddress("0xe538905cf8410324e03a5a23c1c177a474d59b2b"),
    decimals: 18,
    chainId: 196,
    variant: "current",
    provenance: "Official Wrapped OKB ERC-20 contract on X Layer",
    isTestAsset: false,
    verified: true,
    source: "onchain_canonical",
    description: "Wrapped OKB ERC-20 contract on X Layer Mainnet",
  },
  USDT: {
    canonicalAssetId: "xlayer-mainnet-usdt0",
    symbol: "USDT",
    displaySymbol: "USD₮0",
    name: "Tether USD (USD₮0 LayerZero OFT)",
    aliases: ["USDT", "USDT0", "USD₮0", "XUSDT"],
    address: getAddress("0x779ded0c9e1022225f8e0630b35a9b54be713736"),
    decimals: 6,
    chainId: 196,
    variant: "current",
    provenance: "Primary LayerZero OFT USDT (USD₮0) on X Layer Mainnet - official default for USDT",
    isTestAsset: false,
    verified: true,
    source: "onchain_canonical",
    description: "Primary LayerZero OFT USDT (USD₮0) on X Layer Mainnet",
  },
  USDT_LEGACY: {
    canonicalAssetId: "xlayer-mainnet-usdt-legacy",
    symbol: "USDT_LEGACY",
    displaySymbol: "Legacy USDT",
    name: "Tether USD (Legacy Wrapped)",
    aliases: ["USDT_LEGACY", "WRAPPED_USDT_LEGACY", "USDT_BRIDGED_LEGACY"],
    address: getAddress("0x1e4a5963abfd975d8c9021ce480b42188849d41d"),
    decimals: 6,
    chainId: 196,
    variant: "legacy-wrapped",
    deprecated: true,
    provenance: "Legacy bridged USDT contract being phased out",
    isTestAsset: false,
    verified: true,
    source: "onchain_legacy",
    description: "Legacy Bridged Tether USD contract on X Layer Mainnet (deprecated)",
  },
  USDC: {
    canonicalAssetId: "xlayer-mainnet-usdc-native",
    symbol: "USDC",
    displaySymbol: "USDC",
    name: "USD Coin (Native Circle)",
    aliases: ["USDC", "USDC_NATIVE", "XUSDC"],
    address: getAddress("0xB6CEceAB302E2E4948951eE7843FC24E92933061"),
    decimals: 6,
    chainId: 196,
    variant: "current",
    provenance: "Official Native Circle USDC on X Layer Mainnet",
    isTestAsset: false,
    verified: true,
    source: "onchain_canonical",
    description: "Official Native Circle USDC on X Layer Mainnet",
  },
  USDC_BRIDGED: {
    canonicalAssetId: "xlayer-mainnet-usdc-bridged",
    symbol: "USDC_BRIDGED",
    displaySymbol: "Bridged USDC",
    name: "USD Coin (Bridged)",
    aliases: ["USDC_BRIDGED", "USDC_LEGACY"],
    address: getAddress("0x74b7F16337b8972027F6196A17a631aC6dE26d22"),
    decimals: 6,
    chainId: 196,
    variant: "legacy-bridged",
    deprecated: true,
    provenance: "Legacy Bridged USD Coin on X Layer Mainnet",
    isTestAsset: false,
    verified: true,
    source: "onchain_legacy",
    description: "Legacy Bridged USD Coin on X Layer Mainnet",
  },
  USDC_E: {
    canonicalAssetId: "xlayer-mainnet-usdc-e",
    symbol: "USDC.E",
    displaySymbol: "USDC.e",
    name: "USD Coin (Bridged USDC.e)",
    aliases: ["USDC.E", "USDCE"],
    address: getAddress("0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035"),
    decimals: 6,
    chainId: 196,
    variant: "legacy-bridged",
    deprecated: true,
    provenance: "Legacy Bridged USDC.e on X Layer Mainnet",
    isTestAsset: false,
    verified: true,
    source: "onchain_legacy",
    description: "Legacy Bridged USDC.e on X Layer Mainnet",
  },
  ETH: {
    canonicalAssetId: "xlayer-mainnet-xeth",
    symbol: "ETH",
    displaySymbol: "xETH",
    name: "Ethereum (xETH)",
    aliases: ["ETH", "XETH"],
    address: getAddress("0xe7b000003a45145decf8a28fc755ad5ec5ea025a"),
    decimals: 18,
    chainId: 196,
    variant: "current",
    provenance: "Official X Layer ecosystem xETH asset",
    isTestAsset: false,
    verified: true,
    source: "onchain_canonical",
    description: "Official X Layer ecosystem xETH asset",
  },
  WETH: {
    canonicalAssetId: "xlayer-mainnet-weth",
    symbol: "WETH",
    displaySymbol: "WETH",
    name: "Wrapped Ether",
    aliases: ["WETH"],
    address: getAddress("0x5a77f1443d16ee5761d310e38b62f77f726bc71c"),
    decimals: 18,
    chainId: 196,
    variant: "current",
    provenance: "Wrapped Ether ERC-20 on X Layer Mainnet",
    isTestAsset: false,
    verified: true,
    source: "onchain_canonical",
    description: "Wrapped Ether ERC-20 contract on X Layer Mainnet",
  },
  BTC: {
    canonicalAssetId: "xlayer-mainnet-xbtc",
    symbol: "BTC",
    displaySymbol: "xBTC",
    name: "Bitcoin (xBTC)",
    aliases: ["BTC", "XBTC"],
    address: getAddress("0xb7C00000bcDEeF966b20B3D884B98E64d2b06b4f"),
    decimals: 8,
    chainId: 196,
    variant: "current",
    provenance: "Official X Layer ecosystem xBTC asset - default for BTC",
    isTestAsset: false,
    verified: true,
    source: "onchain_canonical",
    description: "Official X Layer ecosystem xBTC asset",
  },
  WBTC: {
    canonicalAssetId: "xlayer-mainnet-wbtc",
    symbol: "WBTC",
    displaySymbol: "WBTC",
    name: "Wrapped BTC",
    aliases: ["WBTC"],
    address: getAddress("0xEA034fb02eB1808C2cc3adbC15f447B93CbE08e1"),
    decimals: 8,
    chainId: 196,
    variant: "current",
    provenance: "Wrapped BTC ERC-20 on X Layer Mainnet",
    isTestAsset: false,
    verified: true,
    source: "onchain_canonical",
    description: "Wrapped BTC ERC-20 contract on X Layer Mainnet",
  },
  USDG: {
    canonicalAssetId: "xlayer-mainnet-usdg",
    symbol: "USDG",
    displaySymbol: "USDG",
    name: "Global Dollar (USDG)",
    aliases: ["USDG", "XUSDG"],
    address: getAddress("0x4ae46a509f6b1d9056937ba4500cb143933d2dc8"),
    decimals: 6,
    chainId: 196,
    variant: "current",
    provenance: "Global Dollar ERC-20 on X Layer Mainnet",
    isTestAsset: false,
    verified: true,
    source: "onchain_canonical",
    description: "Global Dollar on X Layer Mainnet",
  },
}

export function findTokenByAddress(address: string, chainId: number = 1952): Token | null {
  if (chainId !== 1952 && chainId !== 196) return null
  const normalized = address.toLowerCase()
  const pool = chainId === 1952 ? XLAYER_TESTNET_TOKENS : XLAYER_MAINNET_TOKENS
  for (const token of Object.values(pool)) {
    if (token.address !== "native" && token.address.toLowerCase() === normalized) {
      return token
    }
  }
  return null
}

export function findToken(symbolOrAddress: string, chainId: number = 1952): Token | null {
  if (chainId !== 1952 && chainId !== 196) return null
  const clean = symbolOrAddress.trim()
  if (clean.startsWith("0x") && clean.length === 42) {
    return findTokenByAddress(clean, chainId)
  }

  const upper = clean.toUpperCase()
  const pool = chainId === 1952 ? XLAYER_TESTNET_TOKENS : XLAYER_MAINNET_TOKENS

  // 1. Direct symbol / key match
  if (pool[upper] || pool[clean]) {
    return pool[upper] || pool[clean]
  }

  // 2. Exact alias match
  for (const token of Object.values(pool)) {
    if (token.aliases.some((a) => a.toUpperCase() === upper || a === clean)) {
      return token
    }
  }

  return null
}
