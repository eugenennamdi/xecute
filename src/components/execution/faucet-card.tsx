"use client"

import { useState } from "react"
import { Check, Droplets, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Copy01Icon } from "@/components/ui/copy-01"
import { useTerminalStore } from "@/lib/store"

export function FaucetCard() {
  const [copied, setCopied] = useState(false)
  const walletAddress = useTerminalStore((state) => state.walletAddress)

  async function copyAddress() {
    if (!walletAddress) return
    await navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 8)}…${walletAddress.slice(-6)}`
    : "Wallet not connected"

  return (
    <div className="rounded-2xl border border-[#FE6501]/25 bg-gradient-to-b from-[#FE6501]/[0.04] to-transparent p-4 shadow-xs">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-xl bg-[#FE6501]/10 text-[#FE6501]">
          <Droplets className="size-4" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-foreground/90">X Layer Testnet Faucet</h4>
          <p className="text-[11px] text-foreground/50">Claim test OKB for gas and test USD₮0, USDC & USDG</p>
        </div>
      </div>

      <div className="mt-3.5 space-y-2.5 rounded-xl border border-black/[0.06] bg-white p-3 shadow-2xs">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-foreground/50">Your Connected Address</span>
          <button
            type="button"
            onClick={copyAddress}
            disabled={!walletAddress}
            className="inline-flex items-center gap-1.5 rounded-md border border-black/[0.08] bg-black/[0.02] px-2 py-0.5 font-mono text-[10px] font-medium text-foreground/75 transition-colors hover:bg-black/[0.05] active:scale-[0.98]"
            title="Copy wallet address"
          >
            <span>{shortAddress}</span>
            {copied ? (
              <Check className="size-3 text-[#16845c] stroke-[2.5]" />
            ) : (
              <Copy01Icon size={12} className="text-foreground/45" />
            )}
          </button>
        </div>

        <div className="border-t border-black/[0.04] pt-2 text-[11px] text-foreground/55">
          <p>
            Official OKX X Layer Faucet dispenses <strong>0.2 Testnet OKB</strong> and <strong>10 test tokens (USDC, USDT, USDG)</strong> once every 12 hours.
          </p>
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-end gap-2">
        <a
          href="https://web3.okx.com/xlayer/faucet/xlayerfaucet"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#FE6501] px-3 text-xs font-medium text-white shadow-2xs transition-colors hover:bg-[#FE6501]/90"
        >
          <span>Open Official OKX Faucet</span>
          <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  )
}
