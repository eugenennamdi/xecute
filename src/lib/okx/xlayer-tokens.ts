import { findToken, XLAYER_MAINNET_TOKENS, type Token } from "@/config/tokens"

export type XLayerToken = {
  symbol: string
  name: string
  address: `0x${string}`
  decimals: number
  native: boolean
  sourceUrl: string
}

export function getXLayerToken(symbol: string): XLayerToken | undefined {
  const token = findToken(symbol, 196)
  if (!token) return undefined
  return {
    symbol: token.symbol,
    name: token.name,
    address: (token.address === "native" ? "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" : token.address) as `0x${string}`,
    decimals: token.decimals,
    native: token.address === "native",
    sourceUrl: token.source ?? "https://web3.okx.com/onchainos/dev-docs/xlayer",
  }
}

export const xLayerTokens = Object.fromEntries(
  Object.entries(XLAYER_MAINNET_TOKENS).map(([key, t]) => [
    key,
    {
      symbol: t.symbol,
      name: t.name,
      address: (t.address === "native" ? "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" : t.address) as `0x${string}`,
      decimals: t.decimals,
      native: t.address === "native",
      sourceUrl: t.source ?? "https://web3.okx.com/onchainos/dev-docs/xlayer",
    },
  ]),
)
