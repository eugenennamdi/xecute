import { after } from "next/server"

import { AgentRequestSchema, AgentResponseSchema } from "@/lib/agent-types"
import { lightweightConversationAnswer } from "@/agents/lightweight-conversation"
import { runXecuteAgent } from "@/agents/xecute-agent"
import { generateConversationTitle } from "@/lib/chat/title-generator"
import { hasDatabaseConfiguration } from "@/lib/db/client"
import { beginExchange, completeExchange, type ExchangeContext } from "@/lib/db/repository"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = AgentRequestSchema.parse(await request.json())
    const prompt = body.messages.at(-1)?.content ?? ""
    let exchange: ExchangeContext | null = null
    if (body.sessionId && hasDatabaseConfiguration()) {
      try {
        exchange = await beginExchange({
          sessionId: body.sessionId,
          conversationId: body.conversationId,
          prompt,
          mode: body.mode,
        })
      } catch {
        exchange = null
      }
    }

    const agentResult = await runXecuteAgent(body)
    let runId: string | undefined
    let conversationTitle: string | undefined
    let persistence: "stored" | "unavailable" = "unavailable"

    if (exchange) {
      try {
        const exchangeResult = await completeExchange(exchange, agentResult)
        runId = exchangeResult.runId
        conversationTitle = exchangeResult.title
        persistence = "stored"
      } catch {
        persistence = "unavailable"
      }
    }

    if (!conversationTitle) {
      conversationTitle = generateConversationTitle(prompt, agentResult.plan?.intent, body.mode)
    }

    const result = AgentResponseSchema.parse({
      ...agentResult,
      conversationId: exchange?.conversationId,
      conversationTitle,
      runId,
      persistence,
    })

    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid agent request"
    return Response.json(
      { error: "The agent could not process this request.", detail: message.slice(0, 180) },
      { status: 400 },
    )
  }
}
