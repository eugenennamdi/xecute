"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Search, X } from "lucide-react"

import { ALL_DOC_PAGES, type DocItem } from "@/config/docs"
import { cn } from "@/lib/utils"

interface DocsSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DocsSearch({ open, onOpenChange }: DocsSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filtered = query.trim()
    ? ALL_DOC_PAGES.filter(
        (page) =>
          page.title.toLowerCase().includes(query.toLowerCase()) ||
          page.description.toLowerCase().includes(query.toLowerCase()) ||
          page.section.toLowerCase().includes(query.toLowerCase()),
      )
    : ALL_DOC_PAGES

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
      if (!open) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1))
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault()
        router.push(filtered[selectedIndex].href)
        onOpenChange(false)
      } else if (e.key === "Escape") {
        e.preventDefault()
        onOpenChange(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange, filtered, selectedIndex, router])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in-0 duration-200"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="flex items-center gap-2.5 border-b border-black/[0.06] px-4 py-3.5">
          <Search className="size-4 text-foreground/40 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documentation..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 outline-none"
            autoFocus
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-foreground/40 hover:text-foreground/80 p-0.5 rounded"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
          <kbd className="hidden sm:inline-block rounded border border-black/[0.08] bg-black/[0.03] px-1.5 py-0.5 text-[10px] font-mono text-foreground/50">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length > 0 ? (
            <div className="space-y-1">
              {filtered.map((item: DocItem, idx: number) => {
                const isSelected = idx === selectedIndex
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => {
                      router.push(item.href)
                      onOpenChange(false)
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      isSelected
                        ? "bg-[#FE6501]/[0.08] text-foreground"
                        : "hover:bg-black/[0.03] text-foreground/80",
                    )}
                  >
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-black/[0.04]">
                      <FileText
                        className={cn(
                          "size-3.5",
                          isSelected ? "text-[#FE6501]" : "text-foreground/50",
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{item.title}</span>
                        <span className="rounded bg-black/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-foreground/50">
                          {item.section}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-foreground/50">
                        {item.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-foreground/50">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-black/[0.04] bg-[#fafafa] px-4 py-2 text-[11px] text-foreground/45">
          <span>Navigate with ↑ ↓ keys</span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  )
}
