import { z } from "zod"

import { PreparedActionSchema } from "@/lib/action-plan"
import { ModeSchema } from "@/lib/intents"

export const AgentSourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  kind: z.enum(["official-docs", "official-api", "official-directory", "live-rpc"]),
  verifiedAt: z.string(),
})

export type AgentSource = z.infer<typeof AgentSourceSchema>

export const AgentToolTraceSchema = z.object({
  name: z.string(),
  label: z.string(),
  status: z.enum(["complete", "unavailable", "error"]),
  summary: z.string(),
})

export type AgentToolTrace = z.infer<typeof AgentToolTraceSchema>

export const AgentMetadataSchema = z.object({
  provider: z.enum(["deepseek", "gemini", "openai", "openrouter", "local"]),
  model: z.string().optional(),
  durationMs: z.number().nonnegative(),
  sources: z.array(AgentSourceSchema),
  tools: z.array(AgentToolTraceSchema),
})

export type AgentMetadata = z.infer<typeof AgentMetadataSchema>

export const AgentChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8_000),
})

export const AgentRequestSchema = z.object({
  messages: z.array(AgentChatMessageSchema).min(1).max(20),
  mode: ModeSchema,
  network: z.enum(["testnet", "mainnet"]).optional().default("testnet"),
  sessionId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
})

export const AgentResponseSchema = z.object({
  message: z.string().min(1),
  metadata: AgentMetadataSchema,
  plan: PreparedActionSchema.nullable(),
  conversationId: z.string().uuid().optional(),
  conversationTitle: z.string().optional(),
  runId: z.string().uuid().optional(),
  persistence: z.enum(["stored", "unavailable"]).optional(),
})

export type AgentRequest = z.infer<typeof AgentRequestSchema>
export type AgentResponse = z.infer<typeof AgentResponseSchema>
