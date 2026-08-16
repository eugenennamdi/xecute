import { okxRequest } from "@/lib/okx/client"
import { formatApy, getProtocolUrl } from "@/lib/action-plan"
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
      (context.chainId === 196 || intent.network === "mainnet")
    )
  }

  async getPreview(intent: Intent, _context: ExecutionContext): Promise<AdapterPreview> {
    const asset = intent.mode === "earn" ? intent.asset || "USDT" : "USDT"
    try {
      const searchKeywords = [asset.toUpperCase()]
      if (asset.toUpperCase() === "USDT0") searchKeywords.push("USDT")

      const data = await okxRequest<{ total?: number; list?: Array<Record<string, unknown>> }>({
        path: "/api/v6/defi/product/search",
        method: "POST",
        body: {
          tokenKeywordList: searchKeywords,
          chainIndex: "196",
          pageNum: 1,
        },
      })

      const list = data.list ?? []
      const opportunities = list.slice(0, 5).map((item) => {
        const protocol = String(item.platformName || "X Layer DeFi")
        const name = String(item.name || item.platformName || "Pool")
        const rawRate = String(item.rate || "Variable")
        const url = String(item.link || item.dappUrl || getProtocolUrl(protocol, name, asset, String(item.investmentId || "")))
        return {
          name,
          protocol,
          apy: formatApy(rawRate),
          tvlUsd: item.tvl ? String(item.tvl) : undefined,
          risk: "Low",
          isTestVault: false,
          url,
        }
      })

      return {
        earnOpportunities: opportunities,
        routeDescription: "Live X Layer Mainnet DeFi Registry",
      }
    } catch {
      return {
        earnOpportunities: [],
        routeDescription: "Live X Layer Mainnet DeFi Registry",
      }
    }
  }

  async simulate(_intent: Intent, _context: ExecutionContext): Promise<SimulationResult> {
    return { success: true, logs: ["MainnetDiscoverySimulationOnly"] }
  }

  async buildTransaction(_intent: Intent, _context: ExecutionContext): Promise<TransactionRequest | null> {
    return null
  }
}
