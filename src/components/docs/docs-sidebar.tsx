"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { DOCS_NAVIGATION, type DocItem, type DocSection } from "@/config/docs"
import { cn } from "@/lib/utils"

interface DocsSidebarProps {
  onItemClick?: () => void
  className?: string
}

export function DocsSidebar({
  onItemClick,
  className,
}: DocsSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={cn("flex flex-col space-y-6 pb-8 text-xs", className)}>
      {/* Navigation Sections */}
      <div className="space-y-6">
        {DOCS_NAVIGATION.map((section: DocSection) => (
          <div key={section.title} className="space-y-1.5">
            <h4 className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/45">
              {section.title}
            </h4>
            <div className="space-y-0.5">
              {section.items.map((item: DocItem) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onItemClick}
                    className={cn(
                      "group flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-all text-xs",
                      isActive
                        ? "bg-[#FE6501]/[0.09] font-semibold text-[#FE6501]"
                        : "text-foreground/70 hover:bg-black/[0.04] hover:text-foreground",
                    )}
                  >
                    <span className="truncate">{item.title}</span>
                    {item.badge ? (
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none tracking-tight",
                          isActive
                            ? "bg-[#FE6501]/20 text-[#FE6501]"
                            : "bg-black/[0.04] text-foreground/50 group-hover:bg-black/[0.08]",
                        )}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
