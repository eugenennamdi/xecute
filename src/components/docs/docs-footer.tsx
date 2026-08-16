import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { XecuteMark } from "@/components/brand/xecute-mark"

export function DocsFooter() {
  return (
    <footer className="mt-20 border-t border-black/[0.06] py-10 text-xs text-foreground/50">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <XecuteMark className="size-4 text-[#FE6501]" />
          <span className="font-semibold text-foreground/80">Xecute</span>
          <span className="text-foreground/30">·</span>
          <span className="italic">Prompt it. Preview it. Xecute it.</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <Link href="/" className="hover:text-foreground">
            Open App
          </Link>
          <a
            href="https://x.com/xecute_xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            X (@xecute_xyz)
          </a>
          <a
            href="https://github.com/eugenennamdi/xecute"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
          <a
            href="https://www.okx.com/web3/explorer/xlayer-test/address/0x9be3af8223f49b9357941db269a39775f7802acb"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <span>Router</span>
            <ExternalLink className="size-3" />
          </a>
          <a
            href="https://web3.okx.com/onchainos/dev-docs/xlayer/developer/build-on-xlayer/about-xlayer"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <span>X Layer</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    </footer>
  )
}
