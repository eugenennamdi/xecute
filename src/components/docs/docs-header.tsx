"use client"

import Link from "next/link"
import { ExternalLink, Menu, Search, X } from "lucide-react"

import { GithubIcon } from "@/components/brand/github-icon"
import { XSocialIcon } from "@/components/brand/x-social-icon"
import { XecuteMark } from "@/components/brand/xecute-mark"
import { Button } from "@/components/ui/button"

interface DocsHeaderProps {
  onSearchClick: () => void
  mobileNavOpen: boolean
  onToggleMobileNav: () => void
}

export function DocsHeader({
  onSearchClick,
  mobileNavOpen,
  onToggleMobileNav,
}: DocsHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-black/[0.06] bg-[#fafafa]/90 px-3 sm:px-6 backdrop-blur-md">
      {/* Left: Brand & Docs Badge */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground/60 hover:bg-black/[0.05] hover:text-foreground md:hidden"
          aria-label="Toggle navigation"
        >
          {mobileNavOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>

        <Link
          href="/"
          className="group flex items-center gap-1.5 sm:gap-2 shrink-0 transition-transform active:scale-95"
        >
          <XecuteMark className="size-5 transform-gpu text-[#FE6501] transition-transform duration-200 ease-out group-hover:scale-110" />
          <span className="font-semibold text-sm tracking-tight text-foreground">
            Xecute
          </span>
        </Link>

        <span className="text-foreground/25">/</span>

        <Link
          href="/docs"
          className="rounded-md bg-black/[0.04] px-2 py-0.5 text-xs font-semibold text-foreground/80 hover:bg-black/[0.08] shrink-0"
        >
          Docs
        </Link>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Quick Search Button */}
        <button
          type="button"
          onClick={onSearchClick}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-2.5 py-1.5 text-xs text-foreground/55 shadow-2xs hover:border-black/20 hover:text-foreground"
        >
          <Search className="size-3.5" />
          <span>Search</span>
          <kbd className="rounded border border-black/[0.08] bg-black/[0.03] px-1 text-[10px] font-mono text-foreground/40">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          onClick={onSearchClick}
          className="flex size-8 items-center justify-center rounded-lg border border-black/[0.08] bg-white text-foreground/60 sm:hidden shadow-2xs"
          aria-label="Search docs"
        >
          <Search className="size-3.5" />
        </button>

        {/* X (Twitter) link */}
        <a
          href="https://x.com/xecute_xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex size-8 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-black/[0.05] hover:text-foreground"
          aria-label="X (Twitter)"
        >
          <XSocialIcon className="size-3.5" />
        </a>

        {/* GitHub link */}
        <a
          href="https://github.com/eugenennamdi/xecute"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex size-8 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-black/[0.05] hover:text-foreground"
          aria-label="GitHub repository"
        >
          <GithubIcon className="size-4" />
        </a>

        {/* X Layer Docs */}
        <a
          href="https://web3.okx.com/onchainos/dev-docs/xlayer/developer/build-on-xlayer/about-xlayer"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground/60 hover:bg-black/[0.04] hover:text-foreground"
        >
          <span>X Layer Docs</span>
          <ExternalLink className="size-3 text-foreground/40" />
        </a>

        {/* Launch App Primary CTA */}
        <Link href="/">
          <Button
            size="sm"
            className="h-8 rounded-lg bg-[#FE6501] px-2.5 sm:px-3.5 text-xs font-medium text-white shadow-2xs hover:bg-[#e25a00] active:scale-98"
          >
            Open Xecute
          </Button>
        </Link>
      </div>
    </header>
  )
}
