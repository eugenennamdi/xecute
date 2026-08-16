import { z } from "zod"

export const ModeSchema = z.enum(["trade", "earn", "predict", "protect"])
export type Mode = z.infer<typeof ModeSchema>

const SharedIntentSchema = z.object({
  rawPrompt: z.string().min(1),
  network: z.enum(["mainnet", "testnet"]),
  requiresConfirmation: z.boolean(),
})

export const TradeIntentSchema = SharedIntentSchema.extend({
  mode: z.literal("trade"),
  action: z.enum(["swap", "transfer", "approve", "revoke"]).default("swap"),
  fromToken: z.string().nullable(),
  toToken: z.string().nullable().optional(),
  recipient: z.string().nullable().optional(),
  spender: z.string().nullable().optional(),
  amount: z.string().nullable(),
  maxSlippage: z.number().min(0).max(100).default(0.5),
  preserveGasBalance: z.boolean().default(true),
})

export const EarnIntentSchema = SharedIntentSchema.extend({
  mode: z.literal("earn"),
  action: z.literal("discover"),
  asset: z.string().nullable(),
  amount: z.string().nullable(),
  riskPreference: z.enum(["low", "balanced", "any"]),
})

export const PredictIntentSchema = SharedIntentSchema.extend({
  mode: z.literal("predict"),
  action: z.literal("scenario"),
  asset: z.string().nullable(),
  changePercent: z.number().nullable(),
})

export const ProtectIntentSchema = SharedIntentSchema.extend({
  mode: z.literal("protect"),
  action: z.enum(["approval-scan", "transaction-check", "token-check"]),
  target: z.string().nullable(),
})

export const IntentSchema = z.discriminatedUnion("mode", [
  TradeIntentSchema,
  EarnIntentSchema,
  PredictIntentSchema,
  ProtectIntentSchema,
])

export type TradeIntent = z.infer<typeof TradeIntentSchema>
export type EarnIntent = z.infer<typeof EarnIntentSchema>
export type PredictIntent = z.infer<typeof PredictIntentSchema>
export type ProtectIntent = z.infer<typeof ProtectIntentSchema>
export type Intent = z.infer<typeof IntentSchema>

export function isCompleteTradeIntent(intent: Intent | null): boolean {
  if (!intent || intent.mode !== "trade") return false
  if (intent.action === "transfer") {
    return Boolean(intent.amount && intent.fromToken && intent.recipient)
  }
  if (intent.action === "approve") {
    return Boolean(intent.amount && intent.fromToken && intent.spender)
  }
  if (intent.action === "revoke") {
    return Boolean(intent.fromToken && intent.spender)
  }
  return Boolean(intent.amount && intent.fromToken && intent.toToken)
}

export function toIntentJson(intent: Intent) {
  const { rawPrompt: _rawPrompt, ...displayIntent } = intent
  void _rawPrompt
  return displayIntent
}
