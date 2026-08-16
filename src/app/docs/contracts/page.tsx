import { ExternalLink } from "lucide-react"

import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs"
import { DocsPrevNext } from "@/components/docs/docs-prev-next"
import { getPrevNextPages } from "@/config/docs"
import { AAVE_V3_POOL_MAINNET, ROUTER_ADDRESS_TESTNET } from "@/config/contracts"
import { XLAYER_MAINNET_TOKENS, XLAYER_TESTNET_TOKENS } from "@/config/tokens"

export const metadata = {
  title: "Contracts & Deployments · Xecute Docs",
  description: "Official smart contracts, router addresses, and verified token registries on X Layer Testnet and Mainnet.",
}

export default function ContractsPage() {
  const { prev, next } = getPrevNextPages("/docs/contracts")

  return (
    <div className="space-y-8">
      <DocsBreadcrumbs section="Security & Reference" pageTitle="Contracts & Deployments" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Contracts & Verified Deployments
        </h1>
        <p className="text-sm text-foreground/70 leading-relaxed">
          Canonical list of deployed smart contracts and verified token registries used by Xecute across X Layer Testnet and Mainnet.
        </p>
      </div>

      {/* Protocol & Router Contracts */}
      <div className="space-y-4">
        <h2 id="core-contracts" className="text-lg font-semibold tracking-tight text-foreground">
          Core Protocol Contracts
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-black/[0.07] bg-white shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-black/[0.06] bg-[#fafafa] text-foreground/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Contract</th>
                <th className="px-4 py-3 font-semibold">Network</th>
                <th className="px-4 py-3 font-semibold">Address</th>
                <th className="px-4 py-3 font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] text-foreground/80 font-mono text-[11px]">
              <tr>
                <td className="px-4 py-3 font-sans font-medium text-foreground">XecuteTestnetRouter</td>
                <td className="px-4 py-3 font-sans text-foreground font-semibold">Testnet (1952)</td>
                <td className="px-4 py-3">
                  <a
                    href={`https://www.okx.com/web3/explorer/xlayer-test/address/${ROUTER_ADDRESS_TESTNET}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#FE6501] hover:underline"
                  >
                    <span>{ROUTER_ADDRESS_TESTNET.slice(0, 6)}...{ROUTER_ADDRESS_TESTNET.slice(-4)}</span>
                    <ExternalLink className="size-3 font-sans" />
                  </a>
                </td>
                <td className="px-4 py-3 font-sans text-foreground/70">Testnet Swaps & Execution</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-sans font-medium text-foreground">Aave V3 Pool</td>
                <td className="px-4 py-3 font-sans text-foreground font-semibold">Mainnet (196)</td>
                <td className="px-4 py-3">
                  <a
                    href={`https://www.okx.com/web3/explorer/xlayer/address/${AAVE_V3_POOL_MAINNET}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#FE6501] hover:underline"
                  >
                    <span>{AAVE_V3_POOL_MAINNET.slice(0, 6)}...{AAVE_V3_POOL_MAINNET.slice(-4)}</span>
                    <ExternalLink className="size-3 font-sans" />
                  </a>
                </td>
                <td className="px-4 py-3 font-sans text-foreground/70">Mainnet Yield & Lending Reserves</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Verified Mainnet Token Registry */}
      <div className="space-y-4 pt-2">
        <h2 id="mainnet-tokens" className="text-lg font-semibold tracking-tight text-foreground">
          Verified Mainnet Token Registry (Chain ID: 196)
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-black/[0.07] bg-white shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-black/[0.06] bg-[#fafafa] text-foreground/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Asset</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Decimals</th>
                <th className="px-4 py-3 font-semibold">Contract Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] text-foreground/80 font-mono text-[11px]">
              {Object.entries(XLAYER_MAINNET_TOKENS).map(([symbol, token]) => (
                <tr key={symbol}>
                  <td className="px-4 py-3 font-sans font-medium text-foreground">{symbol}</td>
                  <td className="px-4 py-3 font-sans text-foreground/60">{token.name}</td>
                  <td className="px-4 py-3">{token.decimals}</td>
                  <td className="px-4 py-3">
                    {token.address === "native" ? (
                      <span className="font-sans text-foreground/50">Native (Gas Token)</span>
                    ) : (
                      <a
                        href={`https://www.okx.com/web3/explorer/xlayer/address/${token.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#FE6501] hover:underline"
                      >
                        <span>{token.address.slice(0, 8)}...{token.address.slice(-6)}</span>
                        <ExternalLink className="size-3 font-sans" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verified Testnet Token Registry */}
      <div className="space-y-4 pt-2">
        <h2 id="testnet-tokens" className="text-lg font-semibold tracking-tight text-foreground">
          Verified Testnet Token Registry (Chain ID: 1952)
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-black/[0.07] bg-white shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-black/[0.06] bg-[#fafafa] text-foreground/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Asset</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Decimals</th>
                <th className="px-4 py-3 font-semibold">Contract Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] text-foreground/80 font-mono text-[11px]">
              {Object.entries(XLAYER_TESTNET_TOKENS).map(([symbol, token]) => (
                <tr key={symbol}>
                  <td className="px-4 py-3 font-sans font-medium text-foreground">{symbol}</td>
                  <td className="px-4 py-3 font-sans text-foreground/60">{token.name}</td>
                  <td className="px-4 py-3">{token.decimals}</td>
                  <td className="px-4 py-3">
                    {token.address === "native" ? (
                      <span className="font-sans text-foreground/50">Native (Gas Token)</span>
                    ) : (
                      <a
                        href={`https://www.okx.com/web3/explorer/xlayer-test/address/${token.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#FE6501] hover:underline"
                      >
                        <span>{token.address.slice(0, 8)}...{token.address.slice(-6)}</span>
                        <ExternalLink className="size-3 font-sans" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DocsPrevNext prev={prev} next={next} />
    </div>
  )
}
