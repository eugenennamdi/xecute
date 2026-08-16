import { TrendingDown } from "lucide-react"

import { cn } from "@/lib/utils"

type ScenarioInsightProps = {
  asset: string
  change: number
  embedded?: boolean
}

export function ScenarioInsight({ asset, change, embedded = false }: ScenarioInsightProps) {
  return (
    <div className={cn(
      "overflow-hidden",
      !embedded && "rounded-xl border border-black/[0.07] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.04)]",
    )}>
      <div className="flex items-center justify-between border-b border-black/[0.06] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-[#FE6501]/10 text-[#FE6501]">
            <TrendingDown className="size-3.5" />
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground/80">{asset} stress scenario</p>
            <p className="text-[10px] text-foreground/40">Illustrative portfolio impact model</p>
          </div>
        </div>
        <span className="font-mono text-sm font-semibold text-[#d94b2a]">{change}%</span>
      </div>
      <div className="grid grid-cols-2 gap-3 px-3.5 pt-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/40">Asset move</p>
          <p className="mt-0.5 font-mono text-base font-semibold text-[#d94b2a]">{change}%</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/40">Est. portfolio</p>
          <p className="mt-0.5 font-mono text-base font-semibold text-foreground/80">−4.2%</p>
        </div>
      </div>
      <div className="px-3.5 pb-3.5 pt-2.5">
        <div className="relative h-24 overflow-hidden rounded-lg border border-black/[0.06] bg-[#f8f9fa]" role="img" aria-label={`${asset} declines ${Math.abs(change)} percent while the modeled portfolio declines 4.2 percent`}>
          <span className="absolute left-2.5 top-2 text-[9px] font-mono text-foreground/35">Exposure snapshot</span>
          <svg viewBox="0 0 280 84" className="absolute inset-x-2 bottom-1 h-[74px] w-[calc(100%-16px)]" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 18 H280 M0 42 H280 M0 66 H280" stroke="rgba(0,0,0,0.05)" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M0 24 C34 20 54 29 82 30 C118 31 132 42 162 45 C198 49 230 60 280 70" fill="none" stroke="#FE6501" strokeWidth="2" strokeLinecap="round" />
            <path d="M0 27 C38 27 62 30 90 32 C122 34 153 38 184 41 C220 44 245 48 280 51" fill="none" stroke="#16845c" strokeWidth="2" strokeLinecap="round" />
            <circle cx="280" cy="70" r="2.5" fill="#FE6501" />
            <circle cx="280" cy="51" r="2.5" fill="#16845c" />
          </svg>
        </div>
        <div className="mt-2 flex items-center gap-4 text-[10px] text-foreground/45">
          <span className="flex items-center gap-1.5 font-medium"><span className="size-1.5 rounded-full bg-[#FE6501]" />{asset}</span>
          <span className="flex items-center gap-1.5 font-medium"><span className="size-1.5 rounded-full bg-[#16845c]" />Portfolio</span>
        </div>
      </div>
    </div>
  )
}
