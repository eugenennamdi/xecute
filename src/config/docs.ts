export interface DocItem {
  title: string
  href: string
  description: string
  section: string
  badge?: string
  headings?: Array<{ id: string; title: string }>
}

export interface DocSection {
  title: string
  items: DocItem[]
}

export const DOCS_NAVIGATION: DocSection[] = [
  {
    title: "Getting Started",
    items: [
      {
        title: "Overview",
        href: "/docs",
        section: "Getting Started",
        description: "Introduction to Xecute, the AI execution and intelligence terminal on X Layer.",
      },
      {
        title: "Quick Start",
        href: "/docs/quick-start",
        section: "Getting Started",
        description: "Fastest way to connect, prompt, preview, and execute your first transaction.",
      },
      {
        title: "Testnet & Mainnet",
        href: "/docs/networks",
        section: "Getting Started",
        description: "Understand the hard boundary between Testnet execution and Mainnet intelligence.",
      },
    ],
  },
  {
    title: "Using Xecute",
    items: [
      {
        title: "Act",
        href: "/docs/act",
        section: "Using Xecute",
        description: "Conversational swaps, direct transfers, token approvals, and revocations on Testnet.",
      },
      {
        title: "Advise",
        href: "/docs/advise",
        section: "Using Xecute",
        description: "Curated protocol discovery, real-time market data, and yield scouting on Mainnet.",
      },
      {
        title: "Protect",
        href: "/docs/protect",
        section: "Using Xecute",
        description: "Live onchain allowance audits, risk scanner, and preflight transaction guards.",
      },
      {
        title: "Predict",
        href: "/docs/predict",
        section: "Using Xecute",
        description: "Portfolio scenario modeling, exposure deltas, and stress testing without false hype.",
      },
    ],
  },
  {
    title: "Execution & Safeguards",
    items: [
      {
        title: "How Execution Works",
        href: "/docs/execution",
        section: "Execution & Safeguards",
        description: "The 10-step lifecycle from natural-language prompt to onchain settlement.",
      },
      {
        title: "7 Deterministic Safeguards",
        href: "/docs/safeguards",
        section: "Execution & Safeguards",
        description: "Deterministic pre-flight checks that enforce safety outside the LLM.",
      },
      {
        title: "Supported Actions",
        href: "/docs/supported-actions",
        section: "Execution & Safeguards",
        description: "Complete matrix of executable, read-only, and planned capabilities.",
      },
    ],
  },
  {
    title: "Security & Reference",
    items: [
      {
        title: "Security Model",
        href: "/docs/security",
        section: "Security & Reference",
        description: "Non-custodial design, human confirmation, simulation-first, and fail-closed rules.",
      },
      {
        title: "Contracts & Deployments",
        href: "/docs/contracts",
        section: "Security & Reference",
        description: "Contract addresses, official explorers, and chain parameters.",
      },
      {
        title: "Current Limitations",
        href: "/docs/limitations",
        section: "Security & Reference",
        description: "Honest boundaries and non-goals of the current hackathon release.",
      },
      {
        title: "Roadmap & Pipeline",
        href: "/docs/roadmap",
        section: "Security & Reference",
        description: "Earn execution, borrow/repay, x402 payments, multi-step plans, and SDK.",
      },
    ],
  },
]

export const ALL_DOC_PAGES: DocItem[] = DOCS_NAVIGATION.flatMap((section) => section.items)

export function getDocPage(href: string): DocItem | undefined {
  return ALL_DOC_PAGES.find((item) => item.href === href)
}

export function getPrevNextPages(href: string): { prev: DocItem | null; next: DocItem | null } {
  const index = ALL_DOC_PAGES.findIndex((item) => item.href === href)
  if (index === -1) return { prev: null, next: null }
  return {
    prev: index > 0 ? ALL_DOC_PAGES[index - 1] : null,
    next: index < ALL_DOC_PAGES.length - 1 ? ALL_DOC_PAGES[index + 1] : null,
  }
}
