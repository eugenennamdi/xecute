import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs"
import { DocsPrevNext } from "@/components/docs/docs-prev-next"
import { getPrevNextPages } from "@/config/docs"

export const metadata = {
  title: "7 Deterministic Safeguards · Xecute Docs",
  description: "Learn about Xecute's 7 deterministic pre-flight safeguards that enforce execution safety outside the LLM.",
}

export default function SafeguardsPage() {
  const { prev, next } = getPrevNextPages("/docs/safeguards")

  return (
    <div className="space-y-8">
      <DocsBreadcrumbs section="Execution & Safeguards" pageTitle="7 Deterministic Safeguards" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          7 Deterministic Pre-Flight Safeguards
        </h1>
        <p className="text-sm text-foreground/70 leading-relaxed">
          Xecute protects users by running 7 mandatory, deterministic policy checks before any executable transaction can be presented for signing.
        </p>
      </div>

      {/* The 7 Rules */}
      <div className="space-y-4">
        {[
          {
            num: "1",
            title: "Native Gas Reserve Buffer (≥ 0.005 OKB)",
            desc: "When swapping or transferring native OKB, Xecute checks that the user retains at least 0.005 OKB in their wallet. This prevents users from accidentally locking their wallet with zero gas to pay for future transactions.",
            rationale: "Prevents stranded wallets.",
          },
          {
            num: "2",
            title: "Slippage Tolerance Ceiling (≤ 5.0%)",
            desc: "Xecute strictly enforces a maximum slippage tolerance of 5.0%. Any prompt or manual tuning requesting slippage above 5% is hard-blocked to protect users from predatory sandwich attacks or low-liquidity slippage drains.",
            rationale: "Protects against sandwiching and MEV exploitation.",
          },
          {
            num: "3",
            title: "Strict Network Boundary Isolation",
            desc: "Transactions are cryptographically verified against the active chain ID. State-changing actions are permitted only on X Layer Testnet (1952), while Mainnet (196) is strictly locked to read-only advisory operations.",
            rationale: "Eliminates unintended mainnet transactions.",
          },
          {
            num: "4",
            title: "EVM Address Format Verification & Normalization",
            desc: "Recipient and spender addresses must pass strict 40-hex EVM formatting. Empty addresses, zero addresses (0x00...00), and malformed strings are blocked immediately, and valid addresses are normalized into canonical checksum format before transaction construction.",
            rationale: "Prevents token burn or catastrophic misdirection.",
          },
          {
            num: "5",
            title: "Real-Time Onchain Balance Verification",
            desc: "Xecute queries the token contract directly via eth_call immediately before rendering the confirmation card. If the wallet balance is insufficient, execution is blocked with clear feedback.",
            rationale: "Eliminates out-of-gas reverts due to stale balance data.",
          },
          {
            num: "6",
            title: "Transaction Simulation & Dynamic Gas Estimation",
            desc: "Before presenting the execution preview, Xecute dry-runs the transaction using eth_estimateGas and adds a 20% safety margin. If the dry-run reverts, Xecute fails closed rather than proposing a failing transaction.",
            rationale: "Ensures transactions succeed onchain.",
          },
          {
            num: "7",
            title: "Human-in-the-Loop Confirmation",
            desc: "Autonomous signing is strictly prohibited. Every state mutation requires an explicit button click on the Action Confirmation Card followed by personal signature approval in the user's Web3 wallet.",
            rationale: "Preserves user sovereignty over private keys.",
          },
        ].map((item) => (
          <div
            key={item.num}
            className="rounded-2xl border border-black/[0.07] bg-white p-4 sm:p-5 space-y-2 shadow-2xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-black/[0.06] text-xs font-bold text-foreground">
                  {item.num}
                </span>
                <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
              </div>
              <span className="rounded bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium text-foreground/50 shrink-0">
                Deterministic Policy
              </span>
            </div>
            <p className="text-xs text-foreground/75 leading-relaxed sm:pl-8">
              {item.desc}
            </p>
            <div className="sm:pl-8 pt-1 text-[11px] text-foreground/60 font-medium">
              Rationale: {item.rationale}
            </div>
          </div>
        ))}
      </div>

      <DocsPrevNext prev={prev} next={next} />
    </div>
  )
}
