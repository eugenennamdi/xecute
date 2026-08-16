import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id").notNull(),
    title: text("title").notNull(),
    mode: text("mode").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("conversations_session_updated_idx").on(table.sessionId, table.updatedAt),
  ],
)

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    mode: text("mode"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("messages_conversation_created_idx").on(table.conversationId, table.createdAt)],
)

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userMessageId: uuid("user_message_id").references(() => messages.id, { onDelete: "set null" }),
    assistantMessageId: uuid("assistant_message_id").references(() => messages.id, { onDelete: "set null" }),
    provider: text("provider").notNull(),
    model: text("model"),
    status: text("status").notNull(),
    durationMs: integer("duration_ms").notNull(),
    intent: jsonb("intent"),
    safetyReport: jsonb("safety_report"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("agent_runs_conversation_created_idx").on(table.conversationId, table.createdAt)],
)

export const toolEvents = pgTable(
  "tool_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => agentRuns.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    status: text("status").notNull(),
    summary: text("summary").notNull(),
    sources: jsonb("sources").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("tool_events_run_idx").on(table.runId)],
)

export const executionReceipts = pgTable(
  "execution_receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").notNull(),
    intent: jsonb("intent").notNull(),
    safetyReport: jsonb("safety_report").notNull(),
    transactionHash: text("transaction_hash").notNull(),
    status: text("status").notNull(),
    checks: jsonb("checks").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("execution_receipts_session_created_idx").on(table.sessionId, table.createdAt)],
)

export const knowledgeDocuments = pgTable(
  "knowledge_documents",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    summary: text("summary").notNull(),
    facts: jsonb("facts").notNull(),
    keywords: text("keywords").array().notNull(),
    network: text("network").notNull(),
    status: text("status").notNull(),
    source: jsonb("source").notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
    contentHash: text("content_hash").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("knowledge_documents_category_idx").on(table.category),
    index("knowledge_documents_network_idx").on(table.network),
  ],
)
