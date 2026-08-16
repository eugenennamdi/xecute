import { and, asc, desc, eq } from "drizzle-orm"

import type { PreparedAction } from "@/lib/action-plan"
import type { AgentMetadata, AgentResponse } from "@/lib/agent-types"
import { getDatabase } from "@/lib/db/client"
import {
  agentRuns,
  conversations,
  executionReceipts,
  knowledgeDocuments,
  messages,
  toolEvents,
} from "@/lib/db/schema"
import { generateConversationTitle } from "@/lib/chat/title-generator"
import type { Intent, Mode } from "@/lib/intents"
import type { AgentSource } from "@/lib/agent-types"
import {
  rankXLayerKnowledge,
  type KnowledgeCategory,
  type XLayerKnowledgeRecord,
} from "@/lib/knowledge/xlayer"
import type { ExecutionReceipt } from "@/config/constants"
import type { SafetyReport } from "@/lib/safety/types"

export type ExchangeContext = {
  conversationId: string
  userMessageId: string
  prompt: string
  mode: Mode
  isNew: boolean
  existingTitle?: string
}

export async function beginExchange({
  sessionId,
  conversationId,
  newConversationId = crypto.randomUUID(),
  prompt,
  mode,
}: {
  sessionId: string
  conversationId?: string
  newConversationId?: string
  prompt: string
  mode: Mode
}): Promise<ExchangeContext> {
  const db = getDatabase()
  let resolvedConversationId = conversationId
  let isNew = false
  let existingTitle: string | undefined

  if (resolvedConversationId) {
    const [existing] = await db
      .select({ id: conversations.id, title: conversations.title })
      .from(conversations)
      .where(and(eq(conversations.id, resolvedConversationId), eq(conversations.sessionId, sessionId)))
      .limit(1)
    if (existing) {
      existingTitle = existing.title
    } else {
      resolvedConversationId = undefined
    }
  }

  if (!resolvedConversationId) {
    isNew = true
    const initialTitle = generateConversationTitle(prompt, null, mode)
    const [created] = await db
      .insert(conversations)
      .values({
        id: newConversationId,
        sessionId,
        mode,
        title: initialTitle,
      })
      .returning({ id: conversations.id })
    resolvedConversationId = created.id
    existingTitle = initialTitle
  }

  const [userMessage] = await db
    .insert(messages)
    .values({
      conversationId: resolvedConversationId,
      role: "user",
      content: prompt,
      mode,
    })
    .returning({ id: messages.id })

  await db
    .update(conversations)
    .set({ mode, updatedAt: new Date() })
    .where(eq(conversations.id, resolvedConversationId))

  return { conversationId: resolvedConversationId, userMessageId: userMessage.id, prompt, mode, isNew, existingTitle }
}

export async function completeExchange(
  context: ExchangeContext,
  result: AgentResponse,
): Promise<{ runId: string; title: string }> {
  const db = getDatabase()
  const [assistantMessage] = await db
    .insert(messages)
    .values({
      conversationId: context.conversationId,
      role: "assistant",
      content: result.message,
      mode: result.plan?.intent.mode,
      metadata: { agent: result.metadata, plan: result.plan },
    })
    .returning({ id: messages.id })

  const [run] = await db
    .insert(agentRuns)
    .values({
      conversationId: context.conversationId,
      userMessageId: context.userMessageId,
      assistantMessageId: assistantMessage.id,
      provider: result.metadata.provider,
      model: result.metadata.model,
      status: result.metadata.tools.some((tool) => tool.status === "error") ? "completed_with_errors" : "completed",
      durationMs: Math.round(result.metadata.durationMs),
      intent: result.plan?.intent,
      safetyReport: result.plan?.safety,
    })
    .returning({ id: agentRuns.id })

  if (result.metadata.tools.length) {
    await db.insert(toolEvents).values(result.metadata.tools.map((tool) => ({
      runId: run.id,
      name: tool.name,
      status: tool.status,
      summary: tool.summary,
      sources: result.metadata.sources.filter((source) =>
        result.metadata.tools.length === 1 || source.id.length > 0,
      ),
    })))
  }

  let title = context.existingTitle
  if (context.isNew || !title || title === "New conversation") {
    title = generateConversationTitle(
      context.prompt,
      result.plan?.intent,
      result.plan?.intent.mode ?? context.mode,
    )
    await db
      .update(conversations)
      .set({ title, mode: context.mode, updatedAt: new Date() })
      .where(eq(conversations.id, context.conversationId))
  } else {
    await db
      .update(conversations)
      .set({ mode: context.mode, updatedAt: new Date() })
      .where(eq(conversations.id, context.conversationId))
  }

  return { runId: run.id, title: title ?? "New conversation" }
}

export type ConversationSummary = {
  id: string
  title: string
  mode: Mode
  updatedAt: string
}

export async function listConversations(sessionId: string): Promise<ConversationSummary[]> {
  const db = getDatabase()
  const rows = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      mode: conversations.mode,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(eq(conversations.sessionId, sessionId))
    .orderBy(desc(conversations.updatedAt))
    .limit(30)

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    mode: row.mode as Mode,
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export type ConversationMessageDto = {
  id: string
  role: "user" | "assistant"
  content: string
  mode?: Mode
  agent?: AgentMetadata
  plan?: PreparedAction | null
}

export async function getConversation(
  sessionId: string,
  conversationId: string,
): Promise<{ id: string; title: string; mode: Mode; messages: ConversationMessageDto[] } | null> {
  const db = getDatabase()
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.sessionId, sessionId)))
    .limit(1)
  if (!conversation) return null

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))

  return {
    id: conversation.id,
    title: conversation.title,
    mode: conversation.mode as Mode,
    messages: rows.map((row) => {
      const metadata = row.metadata as { agent?: AgentMetadata; plan?: PreparedAction | null } | null
      return {
        id: row.id,
        role: row.role as "user" | "assistant",
        content: row.content,
        mode: row.mode as Mode | undefined,
        agent: metadata?.agent,
        plan: metadata?.plan,
      }
    }),
  }
}

export async function deleteConversation(sessionId: string, conversationId: string): Promise<boolean> {
  const db = getDatabase()
  const deleted = await db
    .delete(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.sessionId, sessionId)))
    .returning({ id: conversations.id })
  return deleted.length > 0
}

export async function storeReceipt({
  sessionId,
  conversationId,
  intent,
  safety,
  receipt,
}: {
  sessionId: string
  conversationId: string
  intent: Intent
  safety: SafetyReport
  receipt: ExecutionReceipt
}) {
  const db = getDatabase()
  const [conversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.sessionId, sessionId)))
    .limit(1)
  if (!conversation) throw new Error("Conversation was not found for this session")

  const [stored] = await db
    .insert(executionReceipts)
    .values({
      conversationId,
      sessionId,
      intent,
      safetyReport: safety,
      transactionHash: receipt.transactionHash,
      status: "mock_confirmed",
      checks: receipt.checks,
      createdAt: new Date(receipt.timestamp),
    })
    .returning({ id: executionReceipts.id })

  return stored.id
}

export async function searchKnowledgeRepository(
  query: string,
  options: { category?: KnowledgeCategory; limit?: number },
) {
  const db = getDatabase()
  const rows = options.category
    ? await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.category, options.category))
    : await db.select().from(knowledgeDocuments)

  const records: XLayerKnowledgeRecord[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category as KnowledgeCategory,
    summary: row.summary,
    facts: row.facts as string[],
    keywords: row.keywords,
    network: row.network as XLayerKnowledgeRecord["network"],
    status: row.status as XLayerKnowledgeRecord["status"],
    source: row.source as AgentSource,
  }))

  return rankXLayerKnowledge(query, records, options)
}
