import Link from "next/link"
import { ArrowLeftRight, ArrowRight, CircleDollarSign, LineChart, Shield, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DocsPrevNext } from "@/components/docs/docs-prev-next"
import { getPrevNextPages } from "@/config/docs"

export const metadata = {
  title: "Xecute Docs · AI Execution Terminal for X Layer",
  description: "Documentation for Xecute, the AI execution and intelligence terminal for X Layer.",
}

export default function DocsOverviewPage() {
  const { prev, next } = getPrevNextPages("/docs")

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Xecute Documentation
        </h1>
        <p className="text-base leading-relaxed text-foreground/70">
          AI-native execution and intelligence terminal on{" "}
          <a
            href="https://web3.okx.com/onchainos/dev-docs/xlayer/developer/build-on-xlayer/about-xlayer"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground underline underline-offset-2 hover:text-[#FE6501] transition-colors"
          >
            X Layer
          </a>
          . Learn how Xecute transforms natural-language intent into verified onchain state, deterministic safeguards, and human-confirmed transactions.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <Link href="/docs/quick-start">
            <Button className="h-9 rounded-xl bg-[#FE6501] px-4 text-xs font-medium text-white shadow-2xs hover:bg-[#e25a00]">
              <span>Quick Start</span>
              <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="h-9 rounded-xl px-4 text-xs font-medium border-black/[0.08] hover:bg-black/[0.04]">
              Open Xecute App
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Core Capability Cards */}
      <div className="space-y-4">
        <h2 id="core-modes" className="text-lg font-semibold tracking-tight text-foreground">
          Core Capabilities
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Act */}
          <Link
            href="/docs/act"
            className="group flex flex-col justify-between rounded-2xl border border-black/[0.07] bg-white p-5 transition-all hover:border-black/20 hover:shadow-2xs active:scale-[0.99]"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-xl bg-black/[0.04] text-foreground/75 group-hover:bg-[#FE6501]/10 group-hover:text-[#FE6501] transition-colors">
                  <ArrowLeftRight className="size-4" />
                </span>
                <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-semibold text-foreground/60">
                  Testnet Execution
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-[#FE6501] transition-colors">
                Act
              </h3>
              <p className="text-xs text-foreground/60 leading-relaxed">
                Execute conversational token swaps, direct transfers, exact approvals, and revocations on X Layer Testnet.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-foreground/75 group-hover:text-[#FE6501] transition-colors">
              <span>Explore Act</span>
              <ArrowRight className="ml-1 size-3 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Advise */}
          <Link
            href="/docs/advise"
            className="group flex flex-col justify-between rounded-2xl border border-black/[0.07] bg-white p-5 transition-all hover:border-black/20 hover:shadow-2xs active:scale-[0.99]"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-xl bg-black/[0.04] text-foreground/75 group-hover:bg-[#FE6501]/10 group-hover:text-[#FE6501] transition-colors">
                  <CircleDollarSign className="size-4" />
                </span>
                <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-semibold text-foreground/60">
                  Mainnet Intelligence
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-[#FE6501] transition-colors">
                Advise
              </h3>
              <p className="text-xs text-foreground/60 leading-relaxed">
                Discover verified X Layer Mainnet protocols, live lending markets, liquidity pools, and yield opportunities.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-foreground/75 group-hover:text-[#FE6501] transition-colors">
              <span>Explore Advise</span>
              <ArrowRight className="ml-1 size-3 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Protect */}
          <Link
            href="/docs/protect"
            className="group flex flex-col justify-between rounded-2xl border border-black/[0.07] bg-white p-5 transition-all hover:border-black/20 hover:shadow-2xs active:scale-[0.99]"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-xl bg-black/[0.04] text-foreground/75 group-hover:bg-[#FE6501]/10 group-hover:text-[#FE6501] transition-colors">
                  <Shield className="size-4" />
                </span>
                <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-semibold text-foreground/60">
                  Security
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-[#FE6501] transition-colors">
                Protect
              </h3>
              <p className="text-xs text-foreground/60 leading-relaxed">
                Audit onchain wallet allowances, detect unlimited permissions, and enforce 7 deterministic pre-flight safeguards.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-foreground/75 group-hover:text-[#FE6501] transition-colors">
              <span>Explore Protect</span>
              <ArrowRight className="ml-1 size-3 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Predict */}
          <Link
            href="/docs/predict"
            className="group flex flex-col justify-between rounded-2xl border border-black/[0.07] bg-white p-5 transition-all hover:border-black/20 hover:shadow-2xs active:scale-[0.99]"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-xl bg-black/[0.04] text-foreground/75 group-hover:bg-[#FE6501]/10 group-hover:text-[#FE6501] transition-colors">
                  <LineChart className="size-4" />
                </span>
                <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-semibold text-foreground/60">
                  Analytics
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-[#FE6501] transition-colors">
                Predict
              </h3>
              <p className="text-xs text-foreground/60 leading-relaxed">
                Model hypothetical portfolio scenarios and market exposure deltas without making fabricated price forecasts.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-foreground/75 group-hover:text-[#FE6501] transition-colors">
              <span>Explore Predict</span>
              <ArrowRight className="ml-1 size-3 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>

      {/* How Xecute Works */}
      <div className="space-y-4">
        <h2 id="how-xecute-works" className="text-lg font-semibold tracking-tight text-foreground">
          How Xecute Works
        </h2>
        <p className="text-xs leading-relaxed text-foreground/70">
          Xecute replaces disjointed crypto interfaces with a structured 8-step pipeline where AI understands the user&apos;s goal, but deterministic smart contracts and safety policies control execution.
        </p>

        <div className="rounded-2xl border border-black/[0.07] bg-white p-3.5 sm:p-6 shadow-2xs">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-black/[0.05] bg-[#fafafa] p-2.5 sm:p-3 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Step 1</span>
              <p className="mt-1 text-xs font-semibold text-foreground">Natural Prompt</p>
              <p className="mt-0.5 text-[10px] text-foreground/50">Plain English intent</p>
            </div>
            <div className="rounded-xl border border-black/[0.05] bg-[#fafafa] p-2.5 sm:p-3 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Step 2</span>
              <p className="mt-1 text-xs font-semibold text-foreground">Typed Schema</p>
              <p className="mt-0.5 text-[10px] text-foreground/50">Zod intent validation</p>
            </div>
            <div className="rounded-xl border border-black/[0.05] bg-[#fafafa] p-2.5 sm:p-3 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Step 3</span>
              <p className="mt-1 text-xs font-semibold text-foreground">Onchain Verify</p>
              <p className="mt-0.5 text-[10px] text-foreground/50">Live state & balances</p>
            </div>
            <div className="rounded-xl border border-black/[0.05] bg-[#fafafa] p-2.5 sm:p-3 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Step 4</span>
              <p className="mt-1 text-xs font-semibold text-foreground">Safeguards</p>
              <p className="mt-0.5 text-[10px] text-foreground/50">7 deterministic checks</p>
            </div>
            <div className="rounded-xl border border-black/[0.05] bg-[#fafafa] p-2.5 sm:p-3 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Step 5</span>
              <p className="mt-1 text-xs font-semibold text-foreground">Simulation</p>
              <p className="mt-0.5 text-[10px] text-foreground/50">Pre-flight dry run</p>
            </div>
            <div className="rounded-xl border border-black/[0.05] bg-[#fafafa] p-2.5 sm:p-3 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Step 6</span>
              <p className="mt-1 text-xs font-semibold text-foreground">Preview Card</p>
              <p className="mt-0.5 text-[10px] text-foreground/50">Exact balance deltas</p>
            </div>
            <div className="rounded-xl border border-black/[0.05] bg-[#fafafa] p-2.5 sm:p-3 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Step 7</span>
              <p className="mt-1 text-xs font-semibold text-foreground">Human Confirm</p>
              <p className="mt-0.5 text-[10px] text-foreground/50">Explicit user trigger</p>
            </div>
            <div className="rounded-xl border border-black/[0.05] bg-[#fafafa] p-2.5 sm:p-3 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Step 8</span>
              <p className="mt-1 text-xs font-semibold text-foreground">X Layer Settlement</p>
              <p className="mt-0.5 text-[10px] text-foreground/50">Wallet broadcast</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testnet vs Mainnet Comparison Matrix */}
      <div className="space-y-4">
        <h2 id="environment-model" className="text-lg font-semibold tracking-tight text-foreground">
          Testnet vs. Mainnet Release Matrix
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-black/[0.07] bg-white shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-black/[0.06] bg-[#fafafa] text-foreground/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Capability</th>
                <th className="px-4 py-3 font-semibold text-foreground">X Layer Testnet (1952)</th>
                <th className="px-4 py-3 font-semibold text-foreground">X Layer Mainnet (196)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] text-foreground/80">
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">Role</td>
                <td className="px-4 py-3 font-semibold text-foreground">Execute</td>
                <td className="px-4 py-3 font-semibold text-foreground/80">Read & Advise</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Onchain reads & balances</td>
                <td className="px-4 py-3 font-medium text-foreground">✓ Supported</td>
                <td className="px-4 py-3 font-medium text-foreground">✓ Supported</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Token swaps</td>
                <td className="px-4 py-3 font-medium text-foreground">✓ Live Router Execution</td>
                <td className="px-4 py-3 text-foreground/50">Quote & Discovery only</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Direct transfers</td>
                <td className="px-4 py-3 font-medium text-foreground">✓ Live Execution</td>
                <td className="px-4 py-3 text-foreground/50">Read-only</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Approvals & revocations</td>
                <td className="px-4 py-3 font-medium text-foreground">✓ Live Execution</td>
                <td className="px-4 py-3 text-foreground/50">Read-only inspect</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Protocol & yield scouting</td>
                <td className="px-4 py-3 font-medium text-foreground">✓ Supported</td>
                <td className="px-4 py-3 font-medium text-foreground">✓ Live Aave V3 & Uniswap data</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Scenario stress-testing</td>
                <td className="px-4 py-3 font-medium text-foreground">✓ Supported</td>
                <td className="px-4 py-3 font-medium text-foreground">✓ Supported</td>
              </tr>
              <tr className="bg-black/[0.01]">
                <td className="px-4 py-3 font-medium text-foreground">State-changing execution</td>
                <td className="px-4 py-3 font-semibold text-foreground">✓ Enabled</td>
                <td className="px-4 py-3 text-foreground/55">✕ Intentionally gated</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Prev / Next Navigation */}
      <DocsPrevNext prev={prev} next={next} />
    </div>
  )
}
