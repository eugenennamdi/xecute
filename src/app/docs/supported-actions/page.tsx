import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs"
import { DocsPrevNext } from "@/components/docs/docs-prev-next"
import { getPrevNextPages } from "@/config/docs"

export const metadata = {
  title: "Supported Actions Matrix · Xecute Docs",
  description: "Comprehensive capability matrix comparing live, read-only, and planned capabilities on X Layer.",
}

export default function SupportedActionsPage() {
  const { prev, next } = getPrevNextPages("/docs/supported-actions")

  return (
    <div className="space-y-8">
      <DocsBreadcrumbs section="Execution & Safeguards" pageTitle="Supported Actions" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Supported Actions Matrix
        </h1>
        <p className="text-sm text-foreground/70 leading-relaxed">
          Overview of Xecute&apos;s active execution capabilities, read-only intelligence tools, and planned protocol adapters.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-black/[0.07] bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-black/[0.06] bg-[#fafafa] text-foreground/50">
            <tr>
              <th className="px-4 py-3 font-semibold">Capability</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold text-foreground">Testnet (1952)</th>
              <th className="px-4 py-3 font-semibold text-foreground">Mainnet (196)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04] text-foreground/80">
            <tr>
              <td className="px-4 py-3 font-medium text-foreground">Token Swaps</td>
              <td className="px-4 py-3 text-foreground/60">Trading</td>
              <td className="px-4 py-3 text-foreground font-semibold">✓ Execute (Router)</td>
              <td className="px-4 py-3 text-foreground/50">Read / Quote</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-foreground">Direct Transfers</td>
              <td className="px-4 py-3 text-foreground/60">Payments</td>
              <td className="px-4 py-3 text-foreground font-semibold">✓ Execute (Native & ERC-20)</td>
              <td className="px-4 py-3 text-foreground/50">Read-only</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-foreground">Exact Approvals</td>
              <td className="px-4 py-3 text-foreground/60">Permissions</td>
              <td className="px-4 py-3 text-foreground font-semibold">✓ Execute (Exact amount)</td>
              <td className="px-4 py-3 text-foreground/50">Inspect</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-foreground">Approval Revocations</td>
              <td className="px-4 py-3 text-foreground/60">Security</td>
              <td className="px-4 py-3 text-foreground font-semibold">✓ Execute (0 Allowance)</td>
              <td className="px-4 py-3 text-foreground/50">Inspect</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-foreground">Wallet Allowance Audits</td>
              <td className="px-4 py-3 text-foreground/60">Security</td>
              <td className="px-4 py-3 text-foreground font-semibold">✓ Active</td>
              <td className="px-4 py-3 text-foreground font-semibold">✓ Active</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-foreground">Protocol & Yield Scouting</td>
              <td className="px-4 py-3 text-foreground/60">Intelligence</td>
              <td className="px-4 py-3 text-foreground font-semibold">✓ Active</td>
              <td className="px-4 py-3 text-foreground font-semibold">✓ Live Aave V3 data</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-foreground">Portfolio Scenario Stress-Test</td>
              <td className="px-4 py-3 text-foreground/60">Analytics</td>
              <td className="px-4 py-3 text-foreground font-semibold">✓ Active</td>
              <td className="px-4 py-3 text-foreground font-semibold">✓ Active</td>
            </tr>
            <tr className="bg-black/[0.01]">
              <td className="px-4 py-3 font-medium text-foreground">Lending Supply & Withdraw</td>
              <td className="px-4 py-3 text-foreground/60">DeFi</td>
              <td className="px-4 py-3 text-foreground/60 font-semibold">Planned</td>
              <td className="px-4 py-3 text-foreground/60 font-semibold">Planned</td>
            </tr>
            <tr className="bg-black/[0.01]">
              <td className="px-4 py-3 font-medium text-foreground">Borrow & Repay</td>
              <td className="px-4 py-3 text-foreground/60">DeFi</td>
              <td className="px-4 py-3 text-foreground/60 font-semibold">Planned</td>
              <td className="px-4 py-3 text-foreground/60 font-semibold">Planned</td>
            </tr>
            <tr className="bg-black/[0.01]">
              <td className="px-4 py-3 font-medium text-foreground">Bridge Execution</td>
              <td className="px-4 py-3 text-foreground/60">Movement</td>
              <td className="px-4 py-3 text-foreground/60 font-semibold">Planned</td>
              <td className="px-4 py-3 text-foreground/60 font-semibold">Planned</td>
            </tr>
            <tr className="bg-black/[0.01]">
              <td className="px-4 py-3 font-medium text-foreground">x402 Agent Payments</td>
              <td className="px-4 py-3 text-foreground/60">Payments</td>
              <td className="px-4 py-3 text-foreground/60 font-semibold">Planned</td>
              <td className="px-4 py-3 text-foreground/60 font-semibold">Planned</td>
            </tr>
          </tbody>
        </table>
      </div>

      <DocsPrevNext prev={prev} next={next} />
    </div>
  )
}
