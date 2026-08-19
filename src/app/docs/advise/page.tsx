import { ExternalLink } from "lucide-react"

import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs"
import { DocsPrevNext } from "@/components/docs/docs-prev-next"
import { getPrevNextPages } from "@/config/docs"

export const metadata = {
  title: "Advise · Xecute Docs",
  description: "Explore supported X Layer Mainnet protocols, lending markets, liquidity pools, and live yield opportunities.",
}

export default function AdvisePage() {
  const { prev, next } = getPrevNextPages("/docs/advise")

  return (
    <div className="space-y-8">
      <DocsBreadcrumbs section="Using Xecute" pageTitle="Advise" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Advise: Supported Ecosystem Intelligence
        </h1>
        <p className="text-sm text-foreground/70 leading-relaxed">
          If Xecute cannot retrieve a value through supported onchain sources or protocol endpoints, it will not present it as fact.
        </p>
        <p className="text-sm text-foreground/70 leading-relaxed">
          Rather than generating speculative estimates or fabricated contract addresses, Xecute surfaces supported/configured X Layer Mainnet protocols and live ecosystem data where available. Official protocol interfaces and authoritative sources are preferred where available.
        </p>
      </div>

      {/* Capabilities */}
      <div className="space-y-6">
        <h2 id="ecosystem-capabilities" className="text-lg font-semibold tracking-tight text-foreground">
          Intelligence Capabilities
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Yield Discovery */}
          <div className="flex flex-col justify-between rounded-2xl border border-black/[0.07] bg-white p-5 shadow-2xs">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                1. Live Yield & Lending Markets
              </h3>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Discovers active lending pools and supply yields on protocols like <strong>Aave V3</strong> and liquidity venues on X Layer with configured protocol links.
              </p>
            </div>
            <div className="mt-4 rounded-xl bg-[#fafafa] p-3 border border-black/[0.04]">
              <span className="text-[10px] uppercase font-semibold text-foreground/45">Example Prompt</span>
              <p className="mt-1 font-mono text-xs text-foreground/80 font-medium">
                &ldquo;Where can I earn yield on USDT on X Layer?&rdquo;
              </p>
            </div>
          </div>

          {/* Protocol Discovery */}
          <div className="flex flex-col justify-between rounded-2xl border border-black/[0.07] bg-white p-5 shadow-2xs">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                2. Supported Protocol Registry
              </h3>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Indexes supported DEXs (Uniswap V3, Curve Finance), lending markets, cross-chain bridges, and analytics tools native to X Layer.
              </p>
            </div>
            <div className="mt-4 rounded-xl bg-[#fafafa] p-3 border border-black/[0.04]">
              <span className="text-[10px] uppercase font-semibold text-foreground/45">Example Prompt</span>
              <p className="mt-1 font-mono text-xs text-foreground/80 font-medium">
                &ldquo;What DEXs and lending protocols are live on X Layer?&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Protocol Index Table */}
      <div className="space-y-4">
        <h2 id="configured-protocols" className="text-lg font-semibold tracking-tight text-foreground">
          Configured Mainnet Protocol Index
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-black/[0.07] bg-white shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-black/[0.06] bg-[#fafafa] text-foreground/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Protocol</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Configured Contract / URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] text-foreground/80">
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">Aave V3</td>
                <td className="px-4 py-3 text-foreground/80 font-medium">Lending & Borrowing</td>
                <td className="px-4 py-3 font-mono text-[11px] text-foreground/70">
                  <a
                    href="https://app.aave.com/markets/?marketName=proto_xlayer_v3"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#FE6501] hover:underline"
                  >
                    <span>app.aave.com/markets/?marketName=proto_xlayer_v3</span>
                    <ExternalLink className="size-3" />
                  </a>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">Uniswap V3</td>
                <td className="px-4 py-3 text-foreground/80 font-medium">Concentrated AMM</td>
                <td className="px-4 py-3 font-mono text-[11px] text-foreground/70">
                  <a
                    href="https://app.uniswap.org/explore/pools/xlayer"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#FE6501] hover:underline"
                  >
                    <span>app.uniswap.org/explore/pools/xlayer</span>
                    <ExternalLink className="size-3" />
                  </a>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">Curve Finance</td>
                <td className="px-4 py-3 text-foreground/80 font-medium">StableSwap DEX</td>
                <td className="px-4 py-3 font-mono text-[11px] text-foreground/70">
                  <a
                    href="https://www.curve.finance/dex/x-layer/pools"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#FE6501] hover:underline"
                  >
                    <span>curve.finance/dex/x-layer/pools</span>
                    <ExternalLink className="size-3" />
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <DocsPrevNext prev={prev} next={next} />
    </div>
  )
}
