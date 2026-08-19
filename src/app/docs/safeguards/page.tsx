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
          7 Deterministic Safeguards
        </h1>
        <p className="text-sm text-foreground/70 leading-relaxed">
          Xecute protects users by enforcing deterministic policy constraints during intent preparation and executing live pre-flight checks before requesting wallet signatures.
        </p>
      </div>

      {/* Policy vs Runtime distinction */}
      <div className="rounded-2xl border border-black/[0.08] bg-[#fafafa] p-4 sm:p-5 space-y-1.5 shadow-2xs">
        <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Safeguard Architecture: Policy Required vs. Runtime Check Passed
        </h2>
        <p className="text-xs text-foreground/75 leading-relaxed">
          Xecute distinguishes between <strong>Policy Required</strong> (static rule configuration such as slippage ceilings and address formats) and <strong>Runtime Check Passed</strong> (live checks evaluated after user confirmation and before wallet signing, including real-time balance queries, gas reserves, and simulation dry-runs).
        </p>
      </div>

      {/* The 7 Rules */}
      <div className="space-y-4">
        {[
          {
            num: "1",
            title: "Native Gas Reserve Buffer (≥ 0.005 OKB)",
            badge: "Runtime Check",
            desc: "When swapping or transferring native OKB, Xecute checks that the user retains at least 0.005 OKB in their wallet. This prevents users from accidentally locking their wallet with zero gas to pay for future transactions.",
            rationale: "Prevents stranded wallets.",
          },
          {
            num: "2",
            title: "Slippage Tolerance Ceiling (≤ 5.0%)",
            badge: "Policy Required",
            desc: "Xecute strictly enforces a maximum slippage tolerance of 5.0%. Any prompt or manual tuning requesting slippage above 5% is blocked. Slippage limits bound the maximum execution tolerance accepted by the user. They do not eliminate MEV or adverse market movement.",
            rationale: "Bounds acceptable execution variance.",
          },
          {
            num: "3",
            title: "Strict Network Boundary Isolation",
            badge: "Policy Required",
            desc: "Xecute checks the connected wallet chain ID against X Layer Testnet chain ID 1952. State-changing actions are permitted only on X Layer Testnet, while Mainnet (196) is strictly locked to read-only advisory operations.",
            rationale: "Limits execution risk to Testnet.",
          },
          {
            num: "4",
            title: "EVM Address Format Verification & Normalization",
            badge: "Policy Required",
            desc: "Recipient and spender addresses must pass 40-hex EVM formatting. Empty addresses, zero addresses (0x00...00), and malformed strings are blocked immediately, and valid addresses are normalized into canonical format before transaction preparation.",
            rationale: "Prevents token burn or malformed recipient inputs.",
          },
          {
            num: "5",
            title: "Real-Time Onchain Balance Verification",
            badge: "Runtime Check",
            desc: "Xecute queries the token contract directly via eth_call before transaction preparation and wallet signing. If the wallet balance is insufficient, execution is blocked with clear feedback.",
            rationale: "Catches insufficient funds prior to signing.",
          },
          {
            num: "6",
            title: "Transaction Simulation & Dynamic Gas Estimation",
            badge: "Runtime Check",
            desc: "Before requesting wallet signature, Xecute dry-runs the transaction using eth_estimateGas and adds a safety margin to detect execution failures against observed state. If the dry-run reverts, Xecute fails closed rather than proposing a failing transaction.",
            rationale: "Helps detect likely execution failures before wallet signing.",
          },
          {
            num: "7",
            title: "Human-in-the-Loop Confirmation",
            badge: "Policy Required",
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
                {item.badge}
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
