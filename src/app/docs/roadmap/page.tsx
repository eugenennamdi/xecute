import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs"
import { DocsPrevNext } from "@/components/docs/docs-prev-next"
import { getPrevNextPages } from "@/config/docs"

export const metadata = {
  title: "Roadmap & Pipeline · Xecute Docs",
  description: "Explore planned capabilities including DeFi execution, x402 payments, multi-step execution plans, and the Xecute SDK.",
}

export default function RoadmapPage() {
  const { prev, next } = getPrevNextPages("/docs/roadmap")

  return (
    <div className="space-y-8">
      <DocsBreadcrumbs section="Security & Reference" pageTitle="Roadmap & Pipeline" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Roadmap & Capability Pipeline
        </h1>
        <p className="text-sm text-foreground/70 leading-relaxed">
          Xecute&apos;s mission is to make every useful capability on <strong>X Layer</strong> accessible through a single, natural-language AI execution interface.
        </p>
      </div>

      {/* Multi-step execution story */}
      <div className="rounded-2xl border border-black/[0.07] bg-white p-4 sm:p-5 space-y-2.5 shadow-2xs">
        <h2 className="text-sm font-semibold text-foreground">The Multi-Step Goal</h2>
        <p className="text-xs text-foreground/75 leading-relaxed">
          A future user request might look like:
        </p>
        <div className="rounded-xl bg-[#fafafa] p-3 border border-black/[0.04] font-mono text-xs text-foreground font-medium break-words [overflow-wrap:anywhere]">
          &ldquo;Keep enough OKB for gas, swap $500 into xBTC, and deposit the remaining USDT into an Aave V3 yield pool.&rdquo;
        </div>
        <p className="text-xs text-foreground/70 leading-relaxed">
          Xecute will translate that single objective into a coordinated, reviewable multi-step execution plan across protocols, rather than forcing the user to manually switch between 3 different decentralized applications.
        </p>
      </div>

      {/* Roadmap Pillars */}
      <div className="space-y-6">
        {/* 1. DeFi Execution */}
        <div className="rounded-2xl border border-black/[0.07] bg-white p-5 space-y-3 shadow-2xs">
          <h2 className="text-sm font-semibold text-foreground">1. Comprehensive DeFi Actions</h2>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Expanding capability adapters from decentralized swaps to full-stack decentralized finance:
          </p>
          <ul className="space-y-1 text-xs text-foreground/75 list-disc list-inside">
            <li><strong>Lending & Borrowing:</strong> Supply assets, withdraw collateral, borrow against reserves, and repay loans.</li>
            <li><strong>Staking & Vaults:</strong> Native staking protocols and automated yield vaults on X Layer.</li>
            <li><strong>Liquidity Provision:</strong> Add and remove concentrated liquidity on Uniswap V3 and Curve pools.</li>
            <li><strong>Rewards Harvesting:</strong> 1-click claiming of accrued protocol incentives.</li>
          </ul>
        </div>

        {/* 2. Payments & Bridge */}
        <div className="rounded-2xl border border-black/[0.07] bg-white p-5 space-y-3 shadow-2xs">
          <h2 className="text-sm font-semibold text-foreground">2. Asset Movement & Agent Payments</h2>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Unifying cross-chain asset routing and agent-to-agent payment protocols:
          </p>
          <ul className="space-y-1 text-xs text-foreground/75 list-disc list-inside">
            <li><strong>Cross-Chain Bridges:</strong> Conversational bridging from Ethereum Mainnet and other OKX-supported L2s directly into X Layer.</li>
            <li><strong>x402 Agent Payments Protocol:</strong> HTTP 402 payment-required settlement for AI agents and automated service subscriptions.</li>
          </ul>
        </div>

        {/* 3. Protect v2 */}
        <div className="rounded-2xl border border-black/[0.07] bg-white p-5 space-y-3 shadow-2xs">
          <h2 className="text-sm font-semibold text-foreground">3. Protect v2 (Expanded Permission Security)</h2>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Upgrading onchain wallet inspection across emerging standards:
          </p>
          <ul className="space-y-1 text-xs text-foreground/75 list-disc list-inside">
            <li><strong>Permit2 Auditing:</strong> Offchain signed allowance expiration and nonces.</li>
            <li><strong>NFT Operator Permissions:</strong> ERC-721 and ERC-1155 <code>setApprovalForAll</code> inspection.</li>
            <li><strong>Proxy & Admin Analysis:</strong> EIP-1967 implementation slot detection and ownership hierarchy auditing.</li>
          </ul>
        </div>

        {/* 4. Developer Platform & SDK */}
        <div className="rounded-2xl border border-black/[0.07] bg-white p-5 space-y-3 shadow-2xs">
          <h2 className="text-sm font-semibold text-foreground">4. Xecute SDK & Developer Platform</h2>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Packaging Xecute&apos;s intent parsing, deterministic adapters, and safeguard pipeline into a standalone SDK and API for third-party applications, autonomous agents, and X Layer developers.
          </p>
        </div>
      </div>

      <DocsPrevNext prev={prev} next={next} />
    </div>
  )
}
