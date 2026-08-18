import { okxRequest } from "@/lib/okx/client"
import { formatApy, getProtocolUrl } from "@/lib/action-plan"
import { findToken } from "@/config/tokens"
import type { Intent } from "@/lib/intents"
import type { AdapterPreview, ExecutionContext, XecuteAdapter } from "@/lib/adapters/types"
import type { SimulationResult, TransactionRequest } from "@/types/execution"

export class MainnetDefiDiscoveryAdapter implements XecuteAdapter {
  id = "okx-defi-discovery-mainnet"
  name = "OKX DeFi Discovery (X Layer Mainnet)"
  category = "earn" as const
  chainIds = [196]
  executionEnabled = false // Read-only discovery for current Xecute version

  supports(intent: Intent, context: ExecutionContext): boolean {
    return (
      intent.mode === "earn" &&
      intent.network === "mainnet" &&
      context.chainId === 196 &&
      this.chainIds.includes(196)
    )
  }

  async getPreview(intent: Intent, _context: ExecutionContext): Promise<AdapterPreview> {
    const rawAsset = intent.mode === "earn" ? intent.asset || "USDT" : "USDT"
    const canonicalToken = findToken(rawAsset, 196)
    const searchSymbol = canonicalToken ? canonicalToken.symbol : rawAsset.toUpperCase()

    try {
      const data = await okxRequest<{ total?: number; list?: Array<Record<string, unknown>> }>({
        path: "/api/v6/defi/product/search",
        method: "POST",
        body: {
          tokenKeywordList: [searchSymbol],
          chainIndex: "196",
          pageNum: 1,
        },
      })

      const list = data.list ?? []
      const opportunities = list.slice(0, 5).map((item) => {
        const protocol = String(item.platformName || "X Layer DeFi")
        const name = String(item.name || item.platformName || "Pool")
        const rawRate = String(item.rate || "Variable")
        const url = String(item.link || item.dappUrl || getProtocolUrl(protocol, name, searchSymbol, String(item.investmentId || "")))
        return {
          name,
          protocol,
          apy: formatApy(rawRate),
          tvlUsd: item.tvl ? String(item.tvl) : undefined,
          isTestVault: false,
          url,
        }
      })

      return {
        earnOpportunities: opportunities,
        routeDescription: "Live X Layer Mainnet DeFi Registry",
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Data provider error"
      throw new Error(`Mainnet DeFi product discovery unavailable: ${msg}`)
    }
  }

  async simulate(_intent: Intent, _context: ExecutionContext): Promise<SimulationResult> {
    return { success: true, logs: ["MainnetDiscoverySimulationOnly"] }
  }

  async buildTransaction(_intent: Intent, _context: ExecutionContext): Promise<TransactionRequest | null> {
    return null
  }
}
