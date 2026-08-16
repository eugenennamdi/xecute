export type XLayerToken = {
  symbol: string
  name: string
  address: `0x${string}`
  decimals: number
  native: boolean
  sourceUrl: string
}

const NATIVE_TOKEN_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"

export const xLayerTokens: Record<string, XLayerToken> = {
  OKB: {
    symbol: "OKB",
    name: "OKB",
    address: NATIVE_TOKEN_ADDRESS,
    decimals: 18,
    native: true,
    sourceUrl:
      "https://web3.okx.com/onchainos/dev-docs/xlayer/developer/build-on-xlayer/network-information",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    address: "0x1e4a5963abfd975d8c9021ce480b42188849d41d",
    decimals: 6,
    native: false,
    sourceUrl: "https://web3.okx.com/onchainos/dev-docs/payments/supported-networks",
  },
  USDT0: {
    symbol: "USDT0",
    name: "Tether USD0",
    address: "0x1e4a5963abfd975d8c9021ce480b42188849d41d",
    decimals: 6,
    native: false,
    sourceUrl: "https://web3.okx.com/onchainos/dev-docs/payments/supported-networks",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x74b7f16337b8f9de7fb3fc82b0b1404685345107",
    decimals: 6,
    native: false,
    sourceUrl: "https://web3.okx.com/onchainos/dev-docs/payments/supported-networks",
  },
  USDG: {
    symbol: "USDG",
    name: "Global Dollar",
    address: "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
    decimals: 6,
    native: false,
    sourceUrl: "https://web3.okx.com/onchainos/dev-docs/payments/supported-networks",
  },
  WETH: {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0x5a77f1443d16ee5761d310e38b62f77f726bc71c",
    decimals: 18,
    native: false,
    sourceUrl: "https://web3.okx.com/onchainos/dev-docs/payments/supported-networks",
  },
  WBTC: {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address: "0xe32812497678bb0bc161c5c0c2937748805f3246",
    decimals: 8,
    native: false,
    sourceUrl: "https://web3.okx.com/onchainos/dev-docs/payments/supported-networks",
  },
}

export function getXLayerToken(symbol: string): XLayerToken | undefined {
  const upper = symbol.trim().toUpperCase()
  return xLayerTokens[upper]
}
