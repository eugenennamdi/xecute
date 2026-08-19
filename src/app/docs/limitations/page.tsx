import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs"
import { DocsPrevNext } from "@/components/docs/docs-prev-next"
import { getPrevNextPages } from "@/config/docs"

export const metadata = {
  title: "Current Limitations · Xecute Docs",
  description: "Transparent boundaries, non-goals, and security considerations for the current Xecute release.",
}

export default function LimitationsPage() {
  const { prev, next } = getPrevNextPages("/docs/limitations")

  return (
    <div className="space-y-8">
      <DocsBreadcrumbs section="Security & Reference" pageTitle="Current Limitations" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Current Boundaries & Limitations
        </h1>
        <p className="text-sm text-foreground/70 leading-relaxed">
          We believe transparency builds trust. This page outlines the exact operational boundaries, intentional restrictions, and non-goals of the current release.
        </p>
      </div>

      <div className="space-y-4">
        <h2 id="known-boundaries" className="text-lg font-semibold tracking-tight text-foreground">
          Explicit Boundaries & Constraints
        </h2>

        <div className="space-y-3">
          <div className="rounded-xl border border-black/[0.07] bg-white p-4 space-y-1 shadow-2xs">
            <h3 className="text-xs font-semibold text-foreground">1. Hackathon Release & Demonstration Router</h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Xecute is an active hackathon-stage release and is not production-audited financial infrastructure. Testnet swaps execute through the deployed <code>XecuteTestnetRouter</code> demonstration contract.
            </p>
          </div>

          <div className="rounded-xl border border-black/[0.07] bg-white p-4 space-y-1 shadow-2xs">
            <h3 className="text-xs font-semibold text-foreground">2. Testnet-Only State Execution</h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              State-changing execution (token swaps, approvals, transfers, revocations) is enabled exclusively on <strong>X Layer Testnet (1952)</strong>. Mainnet (196) execution is intentionally disabled to limit financial risk.
            </p>
          </div>

          <div className="rounded-xl border border-black/[0.07] bg-white p-4 space-y-1 shadow-2xs">
            <h3 className="text-xs font-semibold text-foreground">3. Configured Token Registry Scope</h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Execution and approval scans operate against a configured registry of supported X Layer assets (OKB, USDT, USDC, WETH, WBTC). Unsupported long-tail tokens require manual contract interaction.
            </p>
          </div>

          <div className="rounded-xl border border-black/[0.07] bg-white p-4 space-y-1 shadow-2xs">
            <h3 className="text-xs font-semibold text-foreground">4. Testnet Asset Valuation</h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Tokens on X Layer Testnet have no real-world monetary value and exist solely for demonstration, testing, and benchmark verification.
            </p>
          </div>

          <div className="rounded-xl border border-black/[0.07] bg-white p-4 space-y-1 shadow-2xs">
            <h3 className="text-xs font-semibold text-foreground">5. Simulation & Pre-Flight Scope</h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Simulation dry-runs transactions against currently observed state (<code>eth_estimateGas</code>) to detect likely execution failures before signing. It cannot guarantee future block state or eliminate network-level latency.
            </p>
          </div>

          <div className="rounded-xl border border-black/[0.07] bg-white p-4 space-y-1 shadow-2xs">
            <h3 className="text-xs font-semibold text-foreground">6. Protect Scan Scope</h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Wallet Protect audits discoverable onchain ERC-20 allowances against the configured token registry. It does not prove a wallet is globally free from all offchain, permit2, or unindexed risks.
            </p>
          </div>

          <div className="rounded-xl border border-black/[0.07] bg-white p-4 space-y-1 shadow-2xs">
            <h3 className="text-xs font-semibold text-foreground">7. Fail-Closed on Unverified State</h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              If an RPC endpoint fails to respond or a token quote is unavailable, Xecute will refuse to prepare a transaction rather than guessing or fabricating numbers.
            </p>
          </div>
        </div>
      </div>

      <DocsPrevNext prev={prev} next={next} />
    </div>
  )
}
