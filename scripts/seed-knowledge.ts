import { createHash } from "node:crypto"

import { loadEnvConfig } from "@next/env"
import { drizzle } from "drizzle-orm/neon-http"

import { knowledgeDocuments } from "../src/lib/db/schema"
import { xLayerKnowledge } from "../src/lib/knowledge/xlayer"

loadEnvConfig(process.cwd())

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed X Layer knowledge")
}

async function main() {
  const db = drizzle(process.env.DATABASE_URL!)

  for (const record of xLayerKnowledge) {
    const contentHash = createHash("sha256").update(JSON.stringify(record)).digest("hex")
    const values = {
      id: record.id,
      title: record.title,
      category: record.category,
      summary: record.summary,
      facts: record.facts,
      keywords: record.keywords,
      network: record.network,
      status: record.status,
      source: record.source,
      verifiedAt: new Date(record.source.verifiedAt),
      contentHash,
      updatedAt: new Date(),
    }

    await db
      .insert(knowledgeDocuments)
      .values(values)
      .onConflictDoUpdate({
        target: knowledgeDocuments.id,
        set: values,
      })
  }

  console.log(`Seeded ${xLayerKnowledge.length} source-tagged X Layer knowledge records.`)
}

void main()
