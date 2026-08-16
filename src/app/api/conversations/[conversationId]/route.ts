import { z } from "zod"

import { hasDatabaseConfiguration } from "@/lib/db/client"
import { deleteConversation, getConversation } from "@/lib/db/repository"

export const runtime = "nodejs"

const ParamsSchema = z.object({ conversationId: z.string().uuid() })
const QuerySchema = z.object({ sessionId: z.string().uuid() })

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  if (!hasDatabaseConfiguration()) {
    return Response.json({ error: "Persistence is not configured" }, { status: 503 })
  }

  try {
    const { conversationId } = ParamsSchema.parse(await params)
    const url = new URL(request.url)
    const { sessionId } = QuerySchema.parse({ sessionId: url.searchParams.get("sessionId") })
    const conversation = await getConversation(sessionId, conversationId)
    if (!conversation) return Response.json({ error: "Conversation not found" }, { status: 404 })
    return Response.json(conversation, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Conversation is unavailable"
    return Response.json({ error: "Could not load conversation", detail: detail.slice(0, 160) }, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  if (!hasDatabaseConfiguration()) {
    return Response.json({ error: "Persistence is not configured" }, { status: 503 })
  }

  try {
    const { conversationId } = ParamsSchema.parse(await params)
    const url = new URL(request.url)
    const { sessionId } = QuerySchema.parse({ sessionId: url.searchParams.get("sessionId") })
    const deleted = await deleteConversation(sessionId, conversationId)
    if (!deleted) return Response.json({ error: "Conversation not found" }, { status: 404 })
    return Response.json({ success: true, conversationId }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Could not delete conversation"
    return Response.json({ error: "Could not delete conversation", detail: detail.slice(0, 160) }, { status: 400 })
  }
}
