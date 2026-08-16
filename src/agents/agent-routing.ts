import type { Mode } from "@/lib/intents"

export type DirectProvider = "deepseek" | "gemini"

const complexPatterns = [
  /\b(analy[sz]e|compare|evaluate|recommend|strategy|optimi[sz]e|research)\b/i,
  /\b(best|safest|most profitable|trade-?offs?|pros and cons)\b/i,
  /\b(why|how does|explain|walk me through)\b/i,
  /\b(portfolio|exposure|scenario|stress test|risk model|impermanent loss)\b/i,
  /\b(across|multiple|several|versus|vs\.?)\b/i,
]

export function isComplexAgentRequest(prompt: string, mode: Mode) {
  const normalized = prompt.trim()

  if (mode === "predict") return true
  if (normalized.length >= 220) return true
  return complexPatterns.some((pattern) => pattern.test(normalized))
}

export function preferredDirectProvider({
  prompt,
  mode,
  hasDeepSeek,
  hasGemini,
}: {
  prompt: string
  mode: Mode
  hasDeepSeek: boolean
  hasGemini: boolean
}): DirectProvider | null {
  const complex = isComplexAgentRequest(prompt, mode)

  if (complex && hasGemini) return "gemini"
  if (!complex && hasDeepSeek) return "deepseek"
  if (hasGemini) return "gemini"
  if (hasDeepSeek) return "deepseek"
  return null
}
