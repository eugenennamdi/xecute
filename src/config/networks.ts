export type Environment = "testnet" | "mainnet"

export type NetworkConfig = {
  chainId: 1952 | 196
  name: string
  shortName: string
  environment: Environment
  executionEnabled: boolean
  rpcUrls: string[]
  explorerUrl: string
  explorerApiUrl?: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  badge: string
  description: string
}

export const XLAYER_NETWORKS: Record<Environment, NetworkConfig> = {
  testnet: {
    chainId: 1952,
    name: "X Layer Testnet",
    shortName: "Testnet",
    environment: "testnet",
    executionEnabled: true,
    rpcUrls: [
      "https://testrpc.xlayer.tech/terigon",
      "https://xlayertestrpc.okx.com/terigon",
    ],
    explorerUrl: "https://www.okx.com/web3/explorer/xlayer-test",
    nativeCurrency: {
      name: "OKB",
      symbol: "OKB",
      decimals: 18,
    },
    badge: "Execution enabled · Test assets",
    description: "Full onchain execution sandbox with test tokens and verifiable receipts.",
  },
  mainnet: {
    chainId: 196,
    name: "X Layer Mainnet",
    shortName: "Mainnet",
    environment: "mainnet",
    executionEnabled: false, // Read-only for current Xecute version
    rpcUrls: [
      "https://rpc.xlayer.tech",
      "https://xlayerrpc.okx.com",
      "https://rpc.ankr.com/xlayer",
    ],
    explorerUrl: "https://www.okx.com/web3/explorer/xlayer",
    nativeCurrency: {
      name: "OKB",
      symbol: "OKB",
      decimals: 18,
    },
    badge: "Explore mode · Live ecosystem data",
    description: "Live ecosystem intelligence, quotes, and market analytics. Execution gated.",
  },
}

export const DEFAULT_NETWORK: Environment = "testnet"

export function getNetworkConfig(identifier: number | Environment | string): NetworkConfig {
  if (identifier === 1952 || identifier === 195 || identifier === "testnet") {
    return XLAYER_NETWORKS.testnet
  }
  if (identifier === 196 || identifier === "mainnet") {
    return XLAYER_NETWORKS.mainnet
  }
  return XLAYER_NETWORKS.testnet
}

export function isExecutionEnabled(chainId: number): boolean {
  return chainId === 1952 || chainId === 195
}

export function getExplorerTxUrl(txHash: string, chainId: number = 1952): string {
  const config = getNetworkConfig(chainId)
  return `${config.explorerUrl}/tx/${txHash}`
}
