"use client"

import { useState } from "react"
import { Shield, Sliders } from "lucide-react"

import { cn } from "@/lib/utils"

type ParameterTunerProps = {
  slippage: number
  preserveGas?: boolean
  showSlippage?: boolean
  onChangeSlippage: (newSlippage: number) => void
  onTogglePreserveGas?: (preserve: boolean) => void
  disabled?: boolean
  className?: string
}

const PRESETS = [0.1, 0.5, 1.0]

export function ParameterTuner({
  slippage,
  preserveGas = true,
  showSlippage = true,
  onChangeSlippage,
  onTogglePreserveGas,
  disabled = false,
  className,
}: ParameterTunerProps) {
  const [isCustom, setIsCustom] = useState(!PRESETS.includes(slippage))
  const [customVal, setCustomVal] = useState(String(slippage))

  return (
    <div className={cn("rounded-2xl border border-black/[0.07] bg-[#fafafa] p-3 text-xs shadow-xs", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium text-foreground/80">
          <Sliders className="size-3.5 text-[#FE6501]" />
          <span>Execution Parameters</span>
        </div>
        {showSlippage && (
          <span className="font-mono text-[11px] font-medium text-foreground/50">
            Max Slippage: {slippage}%
          </span>
        )}
      </div>

      {showSlippage && (
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-foreground/55">Slippage tolerance:</span>
          <div className="flex items-center gap-1">
            {PRESETS.map((preset) => {
              const active = !isCustom && slippage === preset
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setIsCustom(false)
                    onChangeSlippage(preset)
                  }}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium transition-all active:scale-[0.96]",
                    active
                      ? "bg-[#FE6501] text-white shadow-xs"
                      : "bg-white border border-black/[0.06] text-foreground/70 hover:border-black/[0.12] hover:bg-[#f4f5f6]",
                    disabled && "pointer-events-none opacity-50",
                  )}
                >
                  {preset}%
                </button>
              )
            })}

            <button
              type="button"
              disabled={disabled}
              onClick={() => setIsCustom(true)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all active:scale-[0.96]",
                isCustom
                  ? "bg-[#FE6501] text-white shadow-xs"
                  : "bg-white border border-black/[0.06] text-foreground/70 hover:border-black/[0.12] hover:bg-[#f4f5f6]",
              )}
            >
              Custom
            </button>
          </div>
        </div>
      )}

      {isCustom && (
        <div className="mt-2 flex items-center justify-end gap-1.5">
          <span className="text-[11px] text-foreground/50">Custom value:</span>
          <input
            type="number"
            step="0.1"
            min="0.01"
            max="5.0"
            value={customVal}
            disabled={disabled}
            onChange={(e) => {
              const val = e.target.value
              setCustomVal(val)
              const num = Number(val)
              if (Number.isFinite(num) && num > 0 && num <= 5) {
                onChangeSlippage(num)
              }
            }}
            className="w-16 rounded-lg border border-black/[0.1] bg-white px-2 py-0.5 font-mono text-[11px] text-foreground outline-none focus:border-[#FE6501]"
            placeholder="0.5"
          />
          <span className="text-[11px] text-foreground/50">%</span>
        </div>
      )}

      {onTogglePreserveGas && (
        <div className="mt-2.5 flex items-center justify-between border-t border-black/[0.06] pt-2 text-[11px]">
          <span className="flex items-center gap-1.5 text-foreground/65">
            <Shield className="size-3 text-[#16845c]" />
            Reserve OKB for gas (≥ 0.005 buffer)
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onTogglePreserveGas(!preserveGas)}
            className={cn(
              "flex h-4.5 w-8 items-center rounded-full p-0.5 transition-colors active:scale-[0.95]",
              preserveGas ? "bg-[#16845c]" : "bg-black/[0.16]",
            )}
          >
            <span
              className={cn(
                "size-3.5 rounded-full bg-white shadow-xs transition-transform",
                preserveGas ? "translate-x-3.5" : "translate-x-0",
              )}
            />
          </button>
        </div>
      )}
    </div>
  )
}
