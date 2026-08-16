import { z } from "zod"

import { hasDatabaseConfiguration } from "@/lib/db/client"
import { listConversations } from "@/lib/db/repository"

export const runtime = "nodejs"

const QuerySchema = z.object({
  sessionId: z.string().uuid(),
})

export async function GET(request: Request) {
  if (!hasDatabaseConfiguration()) {
    return Response.json({ conversations: [], persistence: "unavailable" })
  }

  try {
    const url = new URL(request.url)
    const { sessionId } = QuerySchema.parse({ sessionId: url.searchParams.get("sessionId") })
    const conversations = await listConversations(sessionId)
    return Response.json(
      { conversations, persistence: "stored" },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Conversation history is unavailable"
    return Response.json({ error: "Could not load conversations", detail: detail.slice(0, 160) }, { status: 400 })
  }
}
