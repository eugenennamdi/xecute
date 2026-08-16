import { getAddress } from "viem"

export type KnownContractCategory =
  | "token"
  | "router"
  | "pool"
  | "vault"
  | "bridge"
  | "oracle"
  | "other"

export type KnownContract = {
  chainId: 196 | 1952
  address: `0x${string}`
  name: string
  protocol?: string
  category: KnownContractCategory
  verified: boolean
  description?: string
}

export type DeploymentRecord = {
  network: string
  chainId: 1952 | 196
  contract: string
  address: `0x${string}`
  version: string
  verified: boolean
  explorerUrl: string
}

export const ROUTER_ADDRESS_TESTNET: `0x${string}` = "0x9be3af8223f49b9357941db269a39775f7802acb"
export const AAVE_V3_POOL_MAINNET: `0x${string}` = "0xE3F3Caefdd7180F884c01E57f65Df979Af84f116"

export const DEPLOYMENTS: Record<string, DeploymentRecord> = {
  testnetRouter: {
    network: "X Layer Testnet",
    chainId: 1952,
    contract: "XecuteTestnetRouter",
    address: ROUTER_ADDRESS_TESTNET,
    version: "1.1.0",
    verified: true,
    explorerUrl: `https://www.okx.com/web3/explorer/xlayer-test/address/${ROUTER_ADDRESS_TESTNET}`,
  },
}

export const KNOWN_CONTRACTS: Record<string, KnownContract> = {
  // Testnet Contracts
  [ROUTER_ADDRESS_TESTNET.toLowerCase()]: {
    chainId: 1952,
    address: getAddress(ROUTER_ADDRESS_TESTNET),
    name: "Xecute Testnet Swap Router",
    protocol: "Xecute",
    category: "router",
    verified: true,
    description: "Dedicated swap router for X Layer Testnet sandbox execution.",
  },
  // Mainnet Spenders & Protocols
  "0xe3f3caefdd7180f884c01e57f65df979af84f116": {
    chainId: 196,
    address: getAddress("0xE3F3Caefdd7180F884c01E57f65Df979Af84f116"),
    name: "Aave V3 Pool",
    protocol: "Aave V3",
    category: "pool",
    verified: true,
    description: "Official Aave V3 lending and liquidity pool on X Layer Mainnet.",
  },
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": {
    chainId: 196,
    address: getAddress("0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"),
    name: "Uniswap V3 SwapRouter02",
    protocol: "Uniswap V3",
    category: "router",
    verified: true,
    description: "Official Uniswap V3 Swap Router on X Layer Mainnet.",
  },
  "0x00a2569032f6eb94366db1bbd067b5e4070a2734": {
    chainId: 196,
    address: getAddress("0x00a2569032f6eb94366db1bbd067b5e4070a2734"),
    name: "Uniswap V3 Factory",
    protocol: "Uniswap V3",
    category: "router",
    verified: true,
    description: "Official Uniswap V3 Factory on X Layer Mainnet.",
  },
}

export function findKnownContract(address: string, chainId: 1952 | 196): KnownContract | null {
  const normalized = address.toLowerCase()
  const match = KNOWN_CONTRACTS[normalized]
  if (match && match.chainId === chainId) return match
  return null
}
