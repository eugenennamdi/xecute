import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { xLayerTestnet } from "@reown/appkit/networks"
import { cookieStorage, createStorage, http } from "wagmi"

export const X_LAYER_TESTNET_CHAIN_ID = 1952
export const X_LAYER_NATIVE_TOKEN = "OKB"

const configuredProjectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID?.trim() ||
  "b56e18d47c72ab683b10814fe9495694"

export const reownProjectId = configuredProjectId
export const reownNetworks: [typeof xLayerTestnet] = [xLayerTestnet]

export const wagmiAdapter = new WagmiAdapter({
  networks: reownNetworks,
  projectId: reownProjectId,
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [xLayerTestnet.id]: http("https://testrpc.xlayer.tech/terigon"),
  },
  ssr: true,
})

export const wagmiConfig = wagmiAdapter.wagmiConfig

export { xLayerTestnet }
