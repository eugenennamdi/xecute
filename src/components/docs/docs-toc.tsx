"use client"

import { useEffect, useState } from "react"
import { List } from "lucide-react"

import { cn } from "@/lib/utils"

export interface TocItem {
  id: string
  title: string
  level?: number
}

interface DocsTocProps {
  items?: TocItem[]
  className?: string
}

export function DocsToc({ items, className }: DocsTocProps) {
  const [activeId, setActiveId] = useState<string>("")
  const [pageHeadings, setPageHeadings] = useState<TocItem[]>(items || [])

  useEffect(() => {
    if (items && items.length > 0) {
      setPageHeadings(items)
      return
    }

    // Auto-discover headings in the document if not passed statically
    const elements = Array.from(
      document.querySelectorAll("main h2[id], main h3[id]"),
    )
    const discovered: TocItem[] = elements.map((el) => ({
      id: el.id,
      title: el.textContent || "",
      level: el.tagName === "H3" ? 3 : 2,
    }))
    setPageHeadings(discovered)
  }, [items])

  useEffect(() => {
    if (pageHeadings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: "-80px 0% -60% 0%" },
    )

    pageHeadings.forEach((h) => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [pageHeadings])

  if (pageHeadings.length === 0) return null

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">
        <List className="size-3.5" />
        <span>On this page</span>
      </div>
      <nav className="space-y-1 text-xs">
        {pageHeadings.map((heading) => {
          const isActive = activeId === heading.id
          return (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={cn(
                "block rounded-md py-1.5 transition-colors",
                heading.level === 3 ? "pl-5 text-foreground/55 text-[11px]" : "pl-2.5 text-foreground/70",
                isActive
                  ? "font-medium text-[#FE6501] bg-[#FE6501]/[0.06]"
                  : "hover:text-foreground hover:bg-black/[0.03]",
              )}
            >
              {heading.title}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
