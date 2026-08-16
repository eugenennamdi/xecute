import { drizzle } from "drizzle-orm/neon-http"

import * as schema from "@/lib/db/schema"

let database: ReturnType<typeof drizzle<typeof schema>> | null = null

export function hasDatabaseConfiguration() {
  return Boolean(process.env.DATABASE_URL)
}

export function getDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured")
  }

  database ??= drizzle(process.env.DATABASE_URL, { schema })
  return database
}
