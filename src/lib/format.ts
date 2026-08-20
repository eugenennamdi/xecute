/**
 * Formats a token amount or numeric string for human-readable display.
 * Display-only utility: does not alter execution calldata, bigints, or mathematical precision.
 *
 * Rules:
 * - >= 1: up to 4 decimal places
 * - 0.01–1: up to 4 decimal places
 * - 0.0001–0.01: up to 6 decimal places
 * - Very small non-zero: enough significant digits to avoid showing 0
 * - Trims trailing zeros
 */
export function formatDisplayAmount(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "number") {
    if (isNaN(value)) return ""
    if (value === 0) return "0"
    return formatNumberMagnitude(value)
  }

  const trimmed = value.trim()
  if (!trimmed) return ""

  if (
    trimmed === "Unavailable" ||
    trimmed === "Unlimited" ||
    trimmed === "Market quote" ||
    trimmed === "N/A"
  ) {
    return trimmed
  }

  // Match optional sign, number part, and optional trailing suffix/unit
  const match = trimmed.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)(.*)$/)
  if (!match) return trimmed

  const num = parseFloat(match[1])
  if (isNaN(num)) return trimmed
  const suffix = match[2] // e.g. " OKB", " allowance", " USDT"

  if (num === 0) {
    return `0${suffix}`
  }

  const formattedNum = formatNumberMagnitude(num)
  return `${formattedNum}${suffix}`
}

function formatNumberMagnitude(num: number): string {
  const abs = Math.abs(num)
  const sign = num < 0 ? "-" : ""

  if (abs === 0) return "0"

  let formatted: string
  if (abs >= 0.01) {
    // >= 0.01: up to 4 decimal places
    formatted = abs.toFixed(4)
  } else if (abs >= 0.0001) {
    // 0.0001 - 0.01: up to 6 decimal places
    formatted = abs.toFixed(6)
  } else if (abs >= 0.000001) {
    // 0.000001 - 0.0001: up to 8 decimal places
    formatted = abs.toFixed(8)
  } else {
    // Very small non-zero: up to 4 significant digits to avoid showing 0
    formatted = abs.toPrecision(4)
    if (formatted.includes("e") || formatted.includes("E")) {
      const parsed = parseFloat(formatted)
      formatted = parsed.toFixed(12)
    }
  }

  // Trim trailing zeros after decimal point
  if (formatted.includes(".")) {
    formatted = formatted.replace(/\.?0+$/, "")
  }

  return `${sign}${formatted}`
}
