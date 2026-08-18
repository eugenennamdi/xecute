import Link from "next/link"

import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs"
import { DocsCodeBlock } from "@/components/docs/docs-code-block"
import { DocsPrevNext } from "@/components/docs/docs-prev-next"
import { getPrevNextPages } from "@/config/docs"

export const metadata = {
  title: "Quick Start · Xecute Docs",
  description: "Learn how to connect your wallet, prompt your intent, and execute your first transaction on X Layer Testnet.",
}

export default function QuickStartPage() {
  const { prev, next } = getPrevNextPages("/docs/quick-start")

  return (
    <div className="space-y-8">
      <DocsBreadcrumbs section="Getting Started" pageTitle="Quick Start" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Quick Start Guide
        </h1>
        <p className="text-sm text-foreground/70 leading-relaxed">
          Follow this walkthrough to prompt your intent, verify live onchain state, preview balance deltas, and execute your first human-confirmed transaction on X Layer Testnet.
        </p>
      </div>

      <div className="space-y-8">
        <h2 id="walkthrough-steps" className="text-lg font-semibold tracking-tight text-foreground">
          Execution Lifecycle in 5 Steps
        </h2>

        {/* Step 1 */}
        <div className="space-y-3 rounded-2xl border border-black/[0.07] bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FE6501] text-xs font-bold text-white">
              1
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              Open Xecute & Connect Your Wallet
            </h3>
          </div>
          <p className="text-xs text-foreground/70 leading-relaxed sm:pl-8.5">
            Navigate to the terminal at <a href="https://xecute.xyz" target="_blank" rel="noopener noreferrer" className="text-[#FE6501] font-medium hover:underline">xecute.xyz</a> and click <strong>Connect wallet</strong> at the top right. Xecute supports OKX Wallet, MetaMask, Coinbase Wallet, and all WalletConnect-compatible Web3 wallets via Reown AppKit.
          </p>
        </div>

        {/* Step 2 */}
        <div className="space-y-3 rounded-2xl border border-black/[0.07] bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FE6501] text-xs font-bold text-white">
              2
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              Obtain Testnet OKB for Gas
            </h3>
          </div>
          <p className="text-xs text-foreground/70 leading-relaxed sm:pl-8.5">
            Transactions on X Layer use native <strong>OKB</strong> to pay network gas. If your wallet balance is zero, you can ask Xecute <em>&ldquo;Where can I get testnet OKB faucet?&rdquo;</em> or visit the official <a href="https://www.okx.com/xlayer/faucet" target="_blank" rel="noreferrer" className="text-[#FE6501] font-medium hover:underline">OKX X Layer Testnet Faucet</a> directly.
          </p>
        </div>

        {/* Step 3 */}
        <div className="space-y-3 rounded-2xl border border-black/[0.07] bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FE6501] text-xs font-bold text-white">
              3
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              Type Your Natural-Language Intent
            </h3>
          </div>
          <p className="text-xs text-foreground/70 leading-relaxed sm:pl-8.5">
            Type what you want to execute in the terminal chat input. Xecute parses the action, network, tokens, amounts, and slippage tolerances into a typed schema:
          </p>

          <div className="sm:pl-8.5 space-y-2">
            <div className="rounded-xl border border-black/[0.05] bg-[#fafafa] p-3 text-xs font-mono text-foreground/80 break-words [overflow-wrap:anywhere]">
              <p className="text-foreground/50 text-[10px] uppercase tracking-wider mb-1 font-sans font-semibold">Example Prompts</p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li><span className="text-[#FE6501]">Swap:</span> &ldquo;Swap 10 USDT to OKB with 0.5% max slippage&rdquo;</li>
                <li><span className="text-[#FE6501]">Transfer:</span> &ldquo;Send 0.05 OKB to 0x727ee5DC96E729d8f6C6930cd02ad1695498f3B8&rdquo;</li>
                <li><span className="text-[#FE6501]">Approval:</span> &ldquo;Approve 50 USDT for 0x9be3af8223f49b9357941db269a39775f7802acb&rdquo;</li>
                <li><span className="text-[#FE6501]">Revocation:</span> &ldquo;Revoke allowance for USDC&rdquo;</li>
                <li><span className="text-[#FE6501]">Protect:</span> &ldquo;Scan my wallet for risky approvals and allowances&rdquo;</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="space-y-3 rounded-2xl border border-black/[0.07] bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FE6501] text-xs font-bold text-white">
              4
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              Review Pre-Flight Safeguards & Execution Card
            </h3>
          </div>
          <p className="text-xs text-foreground/70 leading-relaxed sm:pl-8.5">
            Before any transaction is signed, Xecute executes 7 deterministic safety checks (gas reserves, slippage ceiling, EVM address validity, balance checks). If safe, Xecute attaches an interactive <strong>Action Confirmation Card</strong> with:
          </p>
          <div className="sm:pl-8.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-black/[0.05] bg-[#fafafa] p-2.5">
              <span className="text-[10px] font-semibold text-foreground/50 uppercase">Balance Delta</span>
              <p className="mt-0.5 font-medium text-foreground">Exact You Pay & You Receive</p>
            </div>
            <div className="rounded-lg border border-black/[0.05] bg-[#fafafa] p-2.5">
              <span className="text-[10px] font-semibold text-foreground/50 uppercase">Slippage & Route</span>
              <p className="mt-0.5 font-medium text-foreground">Configurable tolerance & router</p>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="space-y-3 rounded-2xl border border-black/[0.07] bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FE6501] text-xs font-bold text-white">
              5
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              Confirm & Sign Onchain
            </h3>
          </div>
          <p className="text-xs text-foreground/70 leading-relaxed sm:pl-8.5">
            Click <strong>Confirm swap</strong> (or transfer/revoke) on the execution card. Your connected Web3 wallet will prompt you to review and sign the transaction. Once broadcast, Xecute verifies the receipt onchain and gives you a direct link to the <a href="https://www.okx.com/web3/explorer/xlayer-test" target="_blank" rel="noreferrer" className="text-[#FE6501] font-medium hover:underline">OKX X Layer Testnet Explorer</a>.
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h2 id="next-steps" className="text-lg font-semibold tracking-tight text-foreground">
          Next Steps
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/docs/networks"
            className="rounded-xl border border-black/[0.07] bg-white p-4 transition-all hover:border-[#FE6501]/40"
          >
            <span className="text-xs font-semibold text-foreground">Testnet vs. Mainnet</span>
            <p className="mt-0.5 text-xs text-foreground/55">Understand chain parameters and the execution boundary.</p>
          </Link>
          <Link
            href="/docs/safeguards"
            className="rounded-xl border border-black/[0.07] bg-white p-4 transition-all hover:border-[#FE6501]/40"
          >
            <span className="text-xs font-semibold text-foreground">7 Pre-Flight Safeguards</span>
            <p className="mt-0.5 text-xs text-foreground/55">Explore how Xecute protects your wallet before signing.</p>
          </Link>
        </div>
      </div>

      <DocsPrevNext prev={prev} next={next} />
    </div>
  )
}
