import { z } from "zod"

export const SafetyCheckSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(["pass", "warn", "block", "pending"]),
  detail: z.string(),
  category: z.enum(["network", "token", "amount", "slippage", "gas", "simulation", "approval", "auth"]).optional(),
})

export const SafetyReportSchema = z.object({
  allowed: z.boolean(),
  level: z.enum(["low", "medium", "high", "blocked"]),
  checks: z.array(SafetyCheckSchema),
  evaluatedAt: z.string(),
  policyVersion: z.string(),
})

export type SafetyCheck = z.infer<typeof SafetyCheckSchema>
export type SafetyReport = z.infer<typeof SafetyReportSchema>

export type PreflightSummary = {
  total: number
  passed: number
  warned: number
  blocked: number
  pending: number
  allRequiredPassed: boolean
}
