import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import type { DocItem } from "@/config/docs"
import { cn } from "@/lib/utils"

interface DocsPrevNextProps {
  prev: DocItem | null
  next: DocItem | null
  className?: string
}

export function DocsPrevNext({ prev, next, className }: DocsPrevNextProps) {
  if (!prev && !next) return null

  return (
    <div
      className={cn(
        "mt-10 sm:mt-12 grid grid-cols-1 gap-3 sm:gap-4 border-t border-black/[0.06] pt-6 sm:pt-8 sm:grid-cols-2",
        className,
      )}
    >
      {prev ? (
        <Link
          href={prev.href}
          className="group flex flex-col items-start rounded-xl border border-black/[0.06] bg-white p-4 transition-all hover:border-black/20 hover:bg-[#fafafa] hover:shadow-2xs active:scale-[0.99]"
        >
          <div className="flex items-center gap-1.5 text-xs text-foreground/50 transition-colors group-hover:text-[#FE6501]">
            <ChevronLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Previous</span>
          </div>
          <span className="mt-1 text-sm font-semibold text-foreground/90 group-hover:text-foreground">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}

      {next ? (
        <Link
          href={next.href}
          className="group flex flex-col items-end text-right rounded-xl border border-black/[0.06] bg-white p-4 transition-all hover:border-black/20 hover:bg-[#fafafa] hover:shadow-2xs active:scale-[0.99]"
        >
          <div className="flex items-center gap-1.5 text-xs text-foreground/50 transition-colors group-hover:text-[#FE6501]">
            <span>Next</span>
            <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
          <span className="mt-1 text-sm font-semibold text-foreground/90 group-hover:text-foreground">
            {next.title}
          </span>
        </Link>
      ) : null}
    </div>
  )
}
