import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs"
import { DocsPrevNext } from "@/components/docs/docs-prev-next"
import { getPrevNextPages } from "@/config/docs"

export const metadata = {
  title: "How Execution Works · Xecute Docs",
  description: "Explore the 10-step lifecycle of intent interpretation, schema validation, deterministic safeguards, and human-confirmed settlement on X Layer.",
}

export default function ExecutionPage() {
  const { prev, next } = getPrevNextPages("/docs/execution")

  return (
    <div className="space-y-8">
      <DocsBreadcrumbs section="Execution & Safeguards" pageTitle="How Execution Works" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          How Execution Works
        </h1>
        <p className="text-sm text-foreground/70 leading-relaxed">
          Xecute uses a deterministic application-layer execution pipeline to validate supported actions, verify live state, simulate transactions, estimate gas, enforce safeguards, and require explicit wallet confirmation.
        </p>
        <p className="text-sm text-foreground/70 leading-relaxed">
          <strong>The execution model:</strong> AI interprets intent. Deterministic application code validates structured parameters and constructs supported actions. Live state and simulation inform pre-flight checks. The user provides final authority through the wallet. The blockchain provides final settlement.
        </p>
      </div>

      {/* 10-Step Lifecycle */}
      <div className="space-y-4">
        <h2 id="lifecycle-steps" className="text-lg font-semibold tracking-tight text-foreground">
          The 10-Step Execution Lifecycle
        </h2>

        <div className="space-y-3">
          {[
            {
              step: "01",
              title: "Natural-Language Input",
              desc: "The user submits a conversational prompt in plain English (e.g. \"Swap 25 USDT to OKB with 0.5% max slippage\").",
              tag: "User Interface",
            },
            {
              step: "02",
              title: "AI Intent Interpretation",
              desc: "Hybrid model orchestration (DeepSeek V4 / Gemini 3.7 Flash) extracts parameters: action, assets, amounts, slippage tolerance, and target network.",
              tag: "Intent Engine",
            },
            {
              step: "03",
              title: "Strict Schema Validation",
              desc: "Parameters are validated against strict Zod schemas (TradeIntentSchema, ProtectIntentSchema) to enforce complete data types.",
              tag: "Zod Validation",
            },
            {
              step: "04",
              title: "Capability Adapter Routing",
              desc: "The validated intent is routed to the corresponding deterministic adapter (TestnetSwapAdapter, TransferAdapter, ApprovalAdapter).",
              tag: "Capability Router",
            },
            {
              step: "05",
              title: "Execution Preview Render",
              desc: "Renders an interactive execution preview card with estimated Pay/Receive balance deltas, route details, and parameter tuning.",
              tag: "Preview UI",
            },
            {
              step: "06",
              title: "Human Confirmation Trigger",
              desc: "The user explicitly clicks the confirmation button on the execution card to initiate live transaction preparation. No action executes autonomously.",
              tag: "Human-in-the-Loop",
            },
            {
              step: "07",
              title: "Live Onchain State Verification",
              desc: "Xecute queries X Layer JSON-RPC for real-time wallet balances, token decimals, and existing allowance permissions immediately prior to execution.",
              tag: "JSON-RPC",
            },
            {
              step: "08",
              title: "Pre-Flight Safeguard Checks",
              desc: "Enforces deterministic policies: gas reserve protection (≥ 0.005 OKB), slippage ceiling (≤ 5%), EVM address verification, and distinct asset rules.",
              tag: "Safety Policy",
            },
            {
              step: "09",
              title: "Transaction Simulation & Gas Estimation",
              desc: "Simulates transaction execution against observed chain state and estimates gas with safety buffers to help detect failures before signing.",
              tag: "Pre-Flight Dry Run",
            },
            {
              step: "10",
              title: "Wallet Signature & Settlement",
              desc: "The user reviews and signs the transaction in their connected Web3 wallet (MetaMask, OKX Wallet) and the receipt is verified on X Layer Testnet.",
              tag: "X Layer Testnet",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-3.5 rounded-xl border border-black/[0.06] bg-white p-4 transition-all hover:border-black/15 shadow-2xs"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-xs font-mono font-bold text-foreground/70">
                {item.step}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                  <h3 className="text-xs font-semibold text-foreground">{item.title}</h3>
                  <span className="rounded bg-black/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-foreground/50 shrink-0">
                    {item.tag}
                  </span>
                </div>
                <p className="text-xs text-foreground/65 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DocsPrevNext prev={prev} next={next} />
    </div>
  )
}
