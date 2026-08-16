import Link from "next/link"

import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs"
import { DocsPrevNext } from "@/components/docs/docs-prev-next"
import { getPrevNextPages } from "@/config/docs"
import { ROUTER_ADDRESS_TESTNET } from "@/config/contracts"

export const metadata = {
  title: "Act · Xecute Docs",
  description: "Natural-language execution capabilities on X Layer Testnet including Swaps, Transfers, Approvals, and Revocations.",
}

export default function ActPage() {
  const { prev, next } = getPrevNextPages("/docs/act")

  return (
    <div className="space-y-8">
      <DocsBreadcrumbs section="Using Xecute" pageTitle="Act" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Act: Intent-Driven Execution
        </h1>
        <p className="text-sm text-foreground/70 leading-relaxed">
          The <strong>Act</strong> engine translates natural-language execution requests into validated transactions on <strong>X Layer Testnet (1952)</strong> through dedicated capability adapters.
        </p>
        <p className="text-sm text-foreground/70 leading-relaxed">
          Xecute is capability-driven rather than swap-specific. The AI model extracts parameters (token, amount, recipient, slippage), while registered TypeScript and Solidity adapters construct exact calldata, execute pre-flight simulations, and request wallet signatures.
        </p>
      </div>

      {/* Supported Actions */}
      <div className="space-y-6">
        <h2 id="supported-actions" className="text-lg font-semibold tracking-tight text-foreground">
          Supported Action Types
        </h2>

        {/* 1. Swaps */}
        <div className="rounded-2xl border border-black/[0.07] bg-white p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              1. Decentralized Swaps
            </h3>
            <span className="rounded bg-black/[0.04] px-2 py-0.5 text-[10px] font-mono text-foreground/60">
              XecuteTestnetRouter
            </span>
          </div>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Swaps tokens (e.g. <code>OKB ↔ USDT ↔ USDC</code>) directly on X Layer Testnet using the deployed router contract at <code>{ROUTER_ADDRESS_TESTNET}</code>.
          </p>
          <div className="rounded-xl border border-black/[0.05] bg-[#fafafa] p-3 text-xs space-y-1 break-words [overflow-wrap:anywhere]">
            <p className="text-[10px] uppercase font-semibold text-foreground/45">Example Prompts</p>
            <p className="font-mono text-foreground/80">&ldquo;Swap 5 USDT to OKB with 0.5% max slippage&rdquo;</p>
            <p className="font-mono text-foreground/80">&ldquo;Trade 0.1 OKB into USDC&rdquo;</p>
          </div>
          <p className="text-[11px] text-foreground/50">
            <strong>Allowance Handling:</strong> If swapping an ERC-20 token, Xecute checks existing router allowances via <code>allowance(owner, router)</code> and prompts for an exact approval only if required.
          </p>
        </div>

        {/* 2. Direct Transfers */}
        <div className="rounded-2xl border border-black/[0.07] bg-white p-4 sm:p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              2. Direct Native & Token Transfers
            </h3>
            <span className="rounded bg-black/[0.04] px-2 py-0.5 text-[10px] font-mono text-foreground/60">
              ERC-20 / Native
            </span>
          </div>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Transfers native OKB or verified ERC-20 tokens directly to a recipient address with EIP-55 checksum validation.
          </p>
          <div className="rounded-xl border border-black/[0.05] bg-[#fafafa] p-3 text-xs space-y-1 break-words [overflow-wrap:anywhere]">
            <p className="text-[10px] uppercase font-semibold text-foreground/45">Example Prompts</p>
            <p className="font-mono text-foreground/80">&ldquo;Send 0.05 OKB to 0x727ee5DC96E729d8f6C6930cd02ad1695498f3B8&rdquo;</p>
            <p className="font-mono text-foreground/80">&ldquo;Transfer 10 USDC to vitalik.eth / 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&rdquo;</p>
          </div>
        </div>

        {/* 3. Approvals & Revocations */}
        <div className="rounded-2xl border border-black/[0.07] bg-white p-4 sm:p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              3. Exact Approvals & 1-Click Revocations
            </h3>
            <span className="rounded bg-black/[0.04] px-2 py-0.5 text-[10px] font-mono text-foreground/60">
              ERC-20 approve()
            </span>
          </div>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Constructs exact token approvals for specific spender contracts, or issues zero-allowance (<code>approve(spender, 0)</code>) revocation transactions to eliminate wallet risk.
          </p>
          <div className="rounded-xl border border-black/[0.05] bg-[#fafafa] p-3 text-xs space-y-1 break-words [overflow-wrap:anywhere]">
            <p className="text-[10px] uppercase font-semibold text-foreground/45">Example Prompts</p>
            <p className="font-mono text-foreground/80">&ldquo;Approve 25 USDT for 0x9be3af8223f49b9357941db269a39775f7802acb&rdquo;</p>
            <p className="font-mono text-foreground/80">&ldquo;Revoke allowance for USDC&rdquo;</p>
          </div>
        </div>
      </div>

      {/* Execution Confirmation Card */}
      <div className="space-y-3 pt-2">
        <h2 id="action-confirmation" className="text-lg font-semibold tracking-tight text-foreground">
          Interactive Action Confirmation Card
        </h2>
        <p className="text-xs leading-relaxed text-foreground/75">
          Xecute never blurts raw transaction hashes or signs autonomously. Every actionable intent renders an interactive confirmation card containing:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-black/[0.06] bg-white p-3.5 space-y-1">
            <p className="font-semibold text-foreground">Pre-Flight Balance Delta</p>
            <p className="text-foreground/60">Shows exact <em>You Pay</em> and <em>You Receive</em> token balance deltas.</p>
          </div>
          <div className="rounded-xl border border-black/[0.06] bg-white p-3.5 space-y-1">
            <p className="font-semibold text-foreground">Slippage Tolerance Tuner</p>
            <p className="text-foreground/60">Customizable slippage tolerance (0.1%, 0.5%, 1.0%) capped at 5.0% maximum.</p>
          </div>
          <div className="rounded-xl border border-black/[0.06] bg-white p-3.5 space-y-1">
            <p className="font-semibold text-foreground">Gas & Reserve Protection</p>
            <p className="text-foreground/60">Real-time gas estimation with native OKB reserve enforcement.</p>
          </div>
          <div className="rounded-xl border border-black/[0.06] bg-white p-3.5 space-y-1">
            <p className="font-semibold text-foreground">Live Explorer Links</p>
            <p className="text-foreground/60">Direct onchain transaction hash link to OKX Web3 Explorer upon settlement.</p>
          </div>
        </div>
      </div>

      <DocsPrevNext prev={prev} next={next} />
    </div>
  )
}
