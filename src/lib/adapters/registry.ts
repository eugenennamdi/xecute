import type { Intent } from "@/lib/intents"
import { TestnetSwapAdapter } from "@/lib/adapters/trade/testnet-swap-adapter"
import { MainnetDexQuoteAdapter } from "@/lib/adapters/trade/mainnet-dex-quote-adapter"
import { TestnetVaultAdapter } from "@/lib/adapters/earn/testnet-vault-adapter"
import { MainnetDefiDiscoveryAdapter } from "@/lib/adapters/earn/mainnet-defi-discovery-adapter"
import type { ExecutionContext, XecuteAdapter } from "@/lib/adapters/types"

export const registeredAdapters: XecuteAdapter[] = [
  new TestnetSwapAdapter(),
  new MainnetDexQuoteAdapter(),
  new TestnetVaultAdapter(),
  new MainnetDefiDiscoveryAdapter(),
]

export function resolveAdapter(intent: Intent, context: ExecutionContext): XecuteAdapter | null {
  for (const adapter of registeredAdapters) {
    if (adapter.supports(intent, context)) {
      return adapter
    }
  }
  return null
}
