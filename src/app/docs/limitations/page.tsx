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
            <h3 className="text-xs font-semibold text-foreground">1. Testnet-Only State Execution</h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              State-changing execution (token swaps, approvals, transfers, revocations) is restricted to <strong>X Layer Testnet (1952)</strong>. Mainnet (196) execution is deliberately disabled to prevent accidental fund loss during testing.
            </p>
          </div>

          <div className="rounded-xl border border-black/[0.07] bg-white p-4 space-y-1 shadow-2xs">
            <h3 className="text-xs font-semibold text-foreground">2. Curated Token Registry Scope</h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Execution and approval audits operate against a curated registry of verified X Layer assets (OKB, USDT, USDC, WETH, WBTC). Arbitrary unverified long-tail tokens require manual address verification.
            </p>
          </div>

          <div className="rounded-xl border border-black/[0.07] bg-white p-4 space-y-1 shadow-2xs">
            <h3 className="text-xs font-semibold text-foreground">3. Single-Action Execution Plans</h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              The current release prepares single atomic transactions (e.g. 1 Swap or 1 Revocation). Complex multi-hop or cross-protocol batched intents are scheduled for the Multi-Step Execution Pipeline on the roadmap.
            </p>
          </div>

          <div className="rounded-xl border border-black/[0.07] bg-white p-4 space-y-1 shadow-2xs">
            <h3 className="text-xs font-semibold text-foreground">4. Testnet Asset Valuation</h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Tokens on X Layer Testnet have no real-world monetary value and exist solely to benchmark routing, simulation, gas calibration, and user experience.
            </p>
          </div>

          <div className="rounded-xl border border-black/[0.07] bg-white p-4 space-y-1 shadow-2xs">
            <h3 className="text-xs font-semibold text-foreground">5. Fail-Closed on Unverified State</h3>
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
