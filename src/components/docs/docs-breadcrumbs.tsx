import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

interface DocsBreadcrumbsProps {
  section?: string
  pageTitle?: string
  className?: string
}

export function DocsBreadcrumbs({ section, pageTitle, className }: DocsBreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumbs"
      className={cn("mb-4 flex flex-wrap items-center gap-1.5 text-xs text-foreground/50", className)}
    >
      <Link
        href="/docs"
        className="transition-colors hover:text-foreground/90 font-medium"
      >
        Docs
      </Link>
      {section && (
        <>
          <ChevronRight className="size-3 text-foreground/30 shrink-0" />
          <span className="truncate">{section}</span>
        </>
      )}
      {pageTitle && (
        <>
          <ChevronRight className="size-3 text-foreground/30 shrink-0" />
          <span className="truncate font-medium text-foreground/80">{pageTitle}</span>
        </>
      )}
    </nav>
  )
}
