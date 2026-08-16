"use client"

import { useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"

import { DocsHeader } from "@/components/docs/docs-header"
import { DocsSidebar } from "@/components/docs/docs-sidebar"
import { DocsSearch } from "@/components/docs/docs-search"
import { DocsToc } from "@/components/docs/docs-toc"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"

export default function DocsLayout({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const pathname = usePathname()

  // On the docs landing page (/docs), we don't necessarily need the right TOC column to allow the hero and cards to breathe
  const isLandingPage = pathname === "/docs"

  return (
    <div className="min-h-screen bg-[#fafafa] text-foreground flex flex-col selection:bg-[#FE6501]/20 selection:text-foreground">
      {/* Top Header */}
      <DocsHeader
        onSearchClick={() => setSearchOpen(true)}
        mobileNavOpen={mobileNavOpen}
        onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
      />

      {/* Main 3-Column Container */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[calc(100vh-3.5rem)] gap-8">
          {/* Desktop Left Sidebar */}
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto pt-8 pr-2 md:block">
            <DocsSidebar />
          </aside>

          {/* Center Main Content */}
          <main className="min-w-0 flex-1 py-8 sm:py-10 max-w-3xl pb-16">
            {children}
          </main>

          {/* Desktop Right TOC (Sticky) */}
          {!isLandingPage ? (
            <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto pt-8 pl-4 xl:block">
              <DocsToc />
            </aside>
          ) : null}
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-6 bg-[#fafafa] overflow-y-auto max-h-screen">
          <SheetTitle className="sr-only">Documentation Navigation</SheetTitle>
          <div className="mt-4">
            <DocsSidebar onItemClick={() => setMobileNavOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Global Cmd+K Search Modal */}
      <DocsSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}
