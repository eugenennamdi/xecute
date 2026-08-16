import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs"
import { DocsCallout } from "@/components/docs/docs-callout"
import { DocsPrevNext } from "@/components/docs/docs-prev-next"
import { getPrevNextPages } from "@/config/docs"
import { ROUTER_ADDRESS_TESTNET } from "@/config/contracts"

export const metadata = {
  title: "Testnet & Mainnet · Xecute Docs",
  description: "Understand the environment model, chain IDs, RPC endpoints, and execution boundary between X Layer Testnet and Mainnet.",
}

export default function NetworksPage() {
  const { prev, next } = getPrevNextPages("/docs/networks")

  return (
    <div className="space-y-8">
      <DocsBreadcrumbs section="Getting Started" pageTitle="Testnet & Mainnet" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Testnet & Mainnet Environment Model
        </h1>
        <p className="text-sm text-foreground/70 leading-relaxed">
          Xecute deliberately separates <strong>execution</strong> from <strong>intelligence</strong> across networks to ensure financial safety while demonstrating full capability.
        </p>
      </div>

      {/* Network Specifications Table */}
      <div className="space-y-4">
        <h2 id="network-specs" className="text-lg font-semibold tracking-tight text-foreground">
          Network Specifications
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-black/[0.07] bg-white shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-black/[0.06] bg-[#fafafa] text-foreground/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Parameter</th>
                <th className="px-4 py-3 font-semibold text-foreground">X Layer Testnet</th>
                <th className="px-4 py-3 font-semibold text-foreground">X Layer Mainnet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] text-foreground/80 font-mono text-[11px]">
              <tr>
                <td className="px-4 py-3 font-sans font-medium text-foreground">Chain ID</td>
                <td className="px-4 py-3 text-foreground font-bold">1952</td>
                <td className="px-4 py-3 text-foreground font-bold">196</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-sans font-medium text-foreground">Execution Status</td>
                <td className="px-4 py-3 text-foreground font-bold">Active Execution</td>
                <td className="px-4 py-3 text-foreground/60 font-bold">Read-Only / Gated</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-sans font-medium text-foreground">Native Gas Token</td>
                <td className="px-4 py-3">OKB (Testnet)</td>
                <td className="px-4 py-3">OKB</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-sans font-medium text-foreground">RPC Endpoint</td>
                <td className="px-4 py-3">https://testrpc.xlayer.tech/terigon</td>
                <td className="px-4 py-3">https://rpc.xlayer.tech</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-sans font-medium text-foreground">Block Explorer</td>
                <td className="px-4 py-3 text-[#FE6501]">
                  <a href="https://www.okx.com/web3/explorer/xlayer-test" target="_blank" rel="noreferrer" className="hover:underline">
                    okx.com/web3/explorer/xlayer-test
                  </a>
                </td>
                <td className="px-4 py-3 text-[#FE6501]">
                  <a href="https://www.okx.com/web3/explorer/xlayer" target="_blank" rel="noreferrer" className="hover:underline">
                    okx.com/web3/explorer/xlayer
                  </a>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-sans font-medium text-foreground">Router Contract</td>
                <td className="px-4 py-3 truncate max-w-[200px]" title={ROUTER_ADDRESS_TESTNET}>
                  {ROUTER_ADDRESS_TESTNET}
                </td>
                <td className="px-4 py-3 text-foreground/40">None (Gated)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* X Layer Testnet Deep Dive */}
      <div className="space-y-3 pt-2">
        <h2 id="x-layer-testnet" className="text-lg font-semibold tracking-tight text-foreground">
          1. X Layer Testnet (Chain ID: 1952)
        </h2>
        <p className="text-xs leading-relaxed text-foreground/75">
          Testnet is Xecute&apos;s full-stack execution sandbox. Every supported action passes through Xecute&apos;s deterministic capability adapters to construct standard Web3 transactions that are submitted to the user&apos;s connected wallet for onchain signature and broadcast.
        </p>

        <div className="rounded-xl border border-black/[0.06] bg-white p-4 space-y-2 text-xs">
          <p className="font-semibold text-foreground">Supported Testnet Capabilities:</p>
          <ul className="space-y-1 text-foreground/70 list-disc list-inside">
            <li><strong>Decentralized Swaps:</strong> Live routing through the deployed <code>XecuteTestnetRouter</code> with automatic token approvals and deterministic 1:60 OKB/USD rate mechanics.</li>
            <li><strong>Direct Transfers:</strong> Native OKB and ERC-20 token transfers with recipient address checksum validation.</li>
            <li><strong>Token Approvals & Revocations:</strong> Setting exact allowances or executing zero-allowance revocations directly on ERC-20 token contracts.</li>
            <li><strong>Live Gas Estimation:</strong> Dynamic <code>eth_estimateGas</code> calls with 20% safety buffers without hardcoded fallbacks.</li>
          </ul>
        </div>
      </div>

      {/* X Layer Mainnet Deep Dive */}
      <div className="space-y-3 pt-2">
        <h2 id="x-layer-mainnet" className="text-lg font-semibold tracking-tight text-foreground">
          2. X Layer Mainnet (Chain ID: 196)
        </h2>
        <p className="text-xs leading-relaxed text-foreground/75">
          On Mainnet, Xecute functions as an ecosystem intelligence and risk inspection terminal. It connects directly to live onchain contracts and protocol registries on X Layer without constructing state-changing transactions.
        </p>

        <div className="rounded-xl border border-black/[0.06] bg-white p-4 space-y-2 text-xs">
          <p className="font-semibold text-foreground">Supported Mainnet Intelligence Capabilities:</p>
          <ul className="space-y-1 text-foreground/70 list-disc list-inside">
            <li><strong>Protocol & Yield Discovery:</strong> Live scouting of verified lending reserves (Aave V3 at <code>0xE3F3Ca...</code>) and liquidity pools (Uniswap V3 on X Layer) with official deep links.</li>
            <li><strong>Wallet Permission Auditing:</strong> Live historical log indexing (<code>Approval</code> events) and real-time <code>allowance(owner, spender)</code> queries to identify unlimited exposure.</li>
            <li><strong>Scenario Analytics:</strong> Portfolio stress-testing under market price movements without making speculative financial forecasts.</li>
          </ul>
        </div>
      </div>

      <DocsCallout type="warning" title="Why Mainnet Execution is Gated">
        Mainnet execution is intentionally disabled in this release to prioritize user fund safety during the hackathon. Future Mainnet execution will be introduced progressively following comprehensive third-party smart contract audits and protocol adapter verification.
      </DocsCallout>

      <DocsPrevNext prev={prev} next={next} />
    </div>
  )
}
