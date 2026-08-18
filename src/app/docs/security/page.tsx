import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs"
import { DocsPrevNext } from "@/components/docs/docs-prev-next"
import { getPrevNextPages } from "@/config/docs"

export const metadata = {
  title: "Security Model · Xecute Docs",
  description: "Learn about Xecute's non-custodial architecture, deterministic transaction adapters, and fail-closed security principles.",
}

export default function SecurityPage() {
  const { prev, next } = getPrevNextPages("/docs/security")

  return (
    <div className="space-y-8">
      <DocsBreadcrumbs section="Security & Reference" pageTitle="Security Model" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Security Model & Boundaries
        </h1>
        <p className="text-sm text-foreground/70 leading-relaxed">
          Xecute is engineered around a strict boundary between AI intent interpretation and onchain financial execution to enforce security controls.
        </p>
      </div>

      {/* Security Principles */}
      <div className="space-y-4">
        <h2 id="security-pillars" className="text-lg font-semibold tracking-tight text-foreground">
          Key Security Principles
        </h2>

        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-2xl border border-black/[0.07] bg-white p-5 space-y-2 shadow-2xs">
            <h3 className="text-sm font-semibold text-foreground">
              1. 100% Non-Custodial Architecture
            </h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Xecute never custodies, touches, or holds user funds. All assets remain safely in the user&apos;s Web3 wallet at all times.
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.07] bg-white p-5 space-y-2 shadow-2xs">
            <h3 className="text-sm font-semibold text-foreground">
              2. Zero Private Key Access
            </h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Xecute never prompts for, reads, transmits, or stores private keys, seed phrases, or wallet credentials. All signing occurs locally within standard Web3 wallet software (MetaMask, OKX Wallet).
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.07] bg-white p-5 space-y-2 shadow-2xs">
            <h3 className="text-sm font-semibold text-foreground">
              3. No Arbitrary AI Calldata Generation
            </h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              The AI model is never allowed to directly output raw hex bytecode or arbitrary contract calls. Executable transactions are exclusively assembled by audited, deterministic TypeScript and Solidity adapters.
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.07] bg-white p-5 space-y-2 shadow-2xs">
            <h3 className="text-sm font-semibold text-foreground">
              4. Mandatory Human-in-the-Loop Confirmation
            </h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Autonomous or automated transaction broadcast is strictly prohibited. Every single state-changing action requires the user to review the pre-flight balance deltas and manually confirm the transaction.
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.07] bg-white p-5 space-y-2 shadow-2xs">
            <h3 className="text-sm font-semibold text-foreground">
              5. Fail-Closed Policy Enforcement
            </h3>
            <p className="text-xs text-foreground/70 leading-relaxed">
              If an onchain state query fails, a gas estimate reverts, or a contract address is unverified, Xecute fails closed—meaning it returns an explicit error rather than guessing or fabricating placeholder data.
            </p>
          </div>
        </div>
      </div>

      <DocsPrevNext prev={prev} next={next} />
    </div>
  )
}
