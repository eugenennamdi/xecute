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
          Xecute bridges natural-language conversational interfaces and Web3 financial transactions through a strict, multi-stage pipeline designed to eliminate hallucinations and unauthorized execution.
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
              desc: "Parameters are validated against strict Zod schemas (TradeIntentSchema, ProtectIntentSchema) to guarantee complete data types.",
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
              title: "Live Onchain State Verification",
              desc: "Xecute queries the X Layer JSON-RPC for real-time wallet balances, token decimals, and existing allowance permissions.",
              tag: "JSON-RPC",
            },
            {
              step: "06",
              title: "7 Pre-Flight Safeguards",
              desc: "Enforces deterministic policies: gas reserve protection (≥ 0.005 OKB), slippage ceiling (≤ 5%), EVM address verification, and distinct asset rules.",
              tag: "Safety Policy",
            },
            {
              step: "07",
              title: "Transaction Simulation & Gas Estimate",
              desc: "Dry-runs the transaction via eth_estimateGas with a 20% buffer to ensure the transaction will not revert onchain.",
              tag: "Dry Run",
            },
            {
              step: "08",
              title: "Action Confirmation Preview Card",
              desc: "Renders an interactive execution preview card with exact Pay/Receive balance deltas, route details, and a slippage tuner.",
              tag: "Preview UI",
            },
            {
              step: "09",
              title: "Human Confirmation Trigger",
              desc: "The user explicitly clicks the confirmation button on the execution card. No action ever executes automatically.",
              tag: "Human-in-the-Loop",
            },
            {
              step: "10",
              title: "Wallet Signature & Settlement",
              desc: "The user signs the transaction in their connected Web3 wallet (MetaMask, OKX Wallet) and the receipt is verified on X Layer.",
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
