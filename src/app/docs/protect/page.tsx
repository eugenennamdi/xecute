import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs"
import { DocsPrevNext } from "@/components/docs/docs-prev-next"
import { getPrevNextPages } from "@/config/docs"

export const metadata = {
  title: "Protect · Xecute Docs",
  description: "Learn how Execution Protect and Wallet Protect guard your funds with live onchain allowance audits and pre-flight safeguards.",
}

export default function ProtectPage() {
  const { prev, next } = getPrevNextPages("/docs/protect")

  return (
    <div className="space-y-8">
      <DocsBreadcrumbs section="Using Xecute" pageTitle="Protect" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Protect: Pre-Flight & Wallet Security
        </h1>
        <p className="text-sm text-foreground/70 leading-relaxed">
          Xecute&apos;s <strong>Protect</strong> engine enforces two distinct layers of defense: <em>Execution Protect</em> (real-time pre-flight transaction guards) and <em>Wallet Protect</em> (live onchain permission and allowance audits).
        </p>
      </div>

      {/* Two Pillars Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Pillar 1: Execution Protect */}
        <div className="rounded-2xl border border-black/[0.07] bg-white p-6 space-y-3 shadow-2xs">
          <div className="text-xs font-semibold text-foreground">
            Pillar 1 · Execution Protect
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Deterministic Pre-Flight Safeguards
          </h3>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Every transaction prepared by Xecute is vetted against 7 deterministic rules before presenting the confirmation card:
          </p>
          <ul className="space-y-1.5 text-xs text-foreground/75 list-disc list-inside">
            <li><strong>Gas Reserve:</strong> Enforces ≥ 0.005 OKB buffer to prevent locked wallets.</li>
            <li><strong>Slippage Ceiling:</strong> Hard block on slippage &gt; 5.0%.</li>
            <li><strong>Simulation:</strong> Real-time dry run via <code>eth_estimateGas</code>; fails closed on revert.</li>
            <li><strong>Checksum Check:</strong> Validates 40-hex recipient addresses.</li>
          </ul>
        </div>

        {/* Pillar 2: Wallet Protect */}
        <div className="rounded-2xl border border-black/[0.07] bg-white p-6 space-y-3 shadow-2xs">
          <div className="text-xs font-semibold text-foreground">
            Pillar 2 · Wallet Protect
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Live Onchain Allowance Auditing
          </h3>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Inspects ERC-20 approval permissions and active spenders using real-time contract reads without arbitrary AI risk scores:
          </p>
          <ul className="space-y-1.5 text-xs text-foreground/75 list-disc list-inside">
            <li><strong>Live RPC Reads:</strong> Queries <code>allowance(owner, spender)</code> directly.</li>
            <li><strong>Unlimited Allowance Flags:</strong> Surfaces infinite allowances (&gt; 10^9).</li>
            <li><strong>Contract vs. EOA:</strong> Uses <code>eth_getCode</code> to verify whether a spender is a contract.</li>
            <li><strong>1-Click Revocations:</strong> Prepares direct zero-allowance transactions.</li>
          </ul>
        </div>
      </div>

      {/* Wallet Protect Live Output */}
      <div className="space-y-3 pt-2">
        <h2 id="wallet-audit" className="text-lg font-semibold tracking-tight text-foreground">
          Wallet Permission Audit Scope
        </h2>
        <p className="text-xs leading-relaxed text-foreground/75">
          When you ask Xecute <em>&ldquo;Scan my wallet for risky approvals&rdquo;</em>, it scans verified token contracts across X Layer, filters out zero allowances, and outputs a focused audit summary:
        </p>

        <div className="rounded-2xl border border-black/[0.07] bg-white p-3 sm:p-5 shadow-2xs">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4 text-center">
            <div className="flex flex-col justify-between rounded-xl bg-[#fafafa] p-2.5 sm:p-3.5 border border-black/[0.04]">
              <span className="text-[10px] sm:text-[11px] font-medium text-foreground/50">Total Scanned</span>
              <p className="mt-1 sm:mt-1.5 text-xs font-semibold text-foreground">Verified Assets</p>
            </div>
            <div className="flex flex-col justify-between rounded-xl bg-[#fafafa] p-2.5 sm:p-3.5 border border-black/[0.04]">
              <span className="text-[10px] sm:text-[11px] font-medium text-foreground/50">Active Spenders</span>
              <p className="mt-1 sm:mt-1.5 text-xs font-semibold text-foreground">Onchain State</p>
            </div>
            <div className="flex flex-col justify-between rounded-xl bg-[#fafafa] p-2.5 sm:p-3.5 border border-black/[0.04]">
              <span className="text-[10px] sm:text-[11px] font-medium text-foreground/50">Unlimited Risk</span>
              <p className="mt-1 sm:mt-1.5 text-xs font-semibold text-foreground">Flagged Exposure</p>
            </div>
            <div className="flex flex-col justify-between rounded-xl bg-[#fafafa] p-2.5 sm:p-3.5 border border-black/[0.04]">
              <span className="text-[10px] sm:text-[11px] font-medium text-foreground/50">Remediation</span>
              <p className="mt-1 sm:mt-1.5 text-xs font-semibold text-[#FE6501]">1-Click Revoke</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current vs Planned Scope */}
      <div className="space-y-4 pt-2">
        <h2 id="scope-boundary" className="text-lg font-semibold tracking-tight text-foreground">
          Current Implementation vs. Planned Expansion
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-black/[0.07] bg-white shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-black/[0.06] bg-[#fafafa] text-foreground/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Security Feature</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Implementation Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] text-foreground/80">
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">ERC-20 Allowance Audits</td>
                <td className="px-4 py-3 text-foreground font-semibold">✓ Available</td>
                <td className="px-4 py-3 text-xs text-foreground/60">Live <code>allowance(owner, spender)</code> checks across token registry</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">Spender Bytecode Check</td>
                <td className="px-4 py-3 text-foreground font-semibold">✓ Available</td>
                <td className="px-4 py-3 text-xs text-foreground/60">Verifies whether spender is a smart contract via <code>eth_getCode</code></td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">1-Click Revocations</td>
                <td className="px-4 py-3 text-foreground font-semibold">✓ Available</td>
                <td className="px-4 py-3 text-xs text-foreground/60">Generates <code>approve(spender, 0)</code> execution card</td>
              </tr>
              <tr className="bg-black/[0.01]">
                <td className="px-4 py-3 font-medium text-foreground">Permit2 Offchain Approvals</td>
                <td className="px-4 py-3 text-foreground/60 font-semibold">Planned (v2)</td>
                <td className="px-4 py-3 text-xs text-foreground/60">Canonical Permit2 allowance tracking and expiration inspection</td>
              </tr>
              <tr className="bg-black/[0.01]">
                <td className="px-4 py-3 font-medium text-foreground">NFT Operator Approvals (ERC-721/1155)</td>
                <td className="px-4 py-3 text-foreground/60 font-semibold">Planned (v2)</td>
                <td className="px-4 py-3 text-xs text-foreground/60"><code>isApprovedForAll</code> scanning for digital collectibles</td>
              </tr>
              <tr className="bg-black/[0.01]">
                <td className="px-4 py-3 font-medium text-foreground">Proxy & Upgrade Inspection</td>
                <td className="px-4 py-3 text-foreground/60 font-semibold">Planned (v2)</td>
                <td className="px-4 py-3 text-xs text-foreground/60">EIP-1967 implementation slot detection and admin checks</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <DocsPrevNext prev={prev} next={next} />
    </div>
  )
}
