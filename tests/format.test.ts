import test from "node:test"
import assert from "node:assert/strict"
import { formatDisplayAmount } from "../src/lib/format"
import { formatApy } from "../src/lib/action-plan"

test("formatDisplayAmount formats >= 1 amounts to up to 4 decimal places and trims trailing zeros", () => {
  assert.equal(formatDisplayAmount("10.0000"), "10")
  assert.equal(formatDisplayAmount("1.250000"), "1.25")
  assert.equal(formatDisplayAmount(10.0), "10")
  assert.equal(formatDisplayAmount(1.25), "1.25")
  assert.equal(formatDisplayAmount("1234.56789"), "1234.5679")
})

test("formatDisplayAmount formats 0.01 to 1 amounts to up to 4 decimal places and trims trailing zeros", () => {
  assert.equal(formatDisplayAmount("0.166666666"), "0.1667")
  assert.equal(formatDisplayAmount("0.166666666666666666"), "0.1667")
  assert.equal(formatDisplayAmount("0.5000"), "0.5")
  assert.equal(formatDisplayAmount("0.0500"), "0.05")
  assert.equal(formatDisplayAmount(0.166666666666666666), "0.1667")
})

test("formatDisplayAmount formats 0.0001 to 0.01 amounts to up to 6 decimal places and trims trailing zeros", () => {
  assert.equal(formatDisplayAmount("0.004321987"), "0.004322")
  assert.equal(formatDisplayAmount("0.0005000"), "0.0005")
  assert.equal(formatDisplayAmount(0.004321987), "0.004322")
})

test("formatDisplayAmount formats very small non-zero amounts without displaying 0", () => {
  assert.equal(formatDisplayAmount("0.00001234"), "0.00001234")
  assert.equal(formatDisplayAmount(0.00001234), "0.00001234")
  assert.equal(formatDisplayAmount("0"), "0")
  assert.equal(formatDisplayAmount(0), "0")
})

test("formatDisplayAmount preserves suffixes like token symbols", () => {
  assert.equal(formatDisplayAmount("0.166666666666666666 OKB"), "0.1667 OKB")
  assert.equal(formatDisplayAmount("10.0000 USDT"), "10 USDT")
  assert.equal(formatDisplayAmount("-0.166666666666666666 OKB"), "-0.1667 OKB")
})

test("formatDisplayAmount preserves special non-numeric strings", () => {
  assert.equal(formatDisplayAmount("Unavailable"), "Unavailable")
  assert.equal(formatDisplayAmount("Unlimited"), "Unlimited")
  assert.equal(formatDisplayAmount("Market quote"), "Market quote")
  assert.equal(formatDisplayAmount(null), "")
  assert.equal(formatDisplayAmount(undefined), "")
})

test("formatApy formats variable yield as 'Variable'", () => {
  assert.equal(formatApy("Variable"), "Variable")
  assert.equal(formatApy("Variable (Live telemetry unavailable)"), "Variable")
  assert.equal(formatApy(""), "Variable")
})

test("formatApy formats numerical APY properly", () => {
  assert.equal(formatApy("0.0342"), "3.42% APY")
  assert.equal(formatApy("3.42%"), "3.42% APY")
  assert.equal(formatApy("3.42% APY"), "3.42% APY")
  assert.equal(formatApy("12.5"), "12.50% APY")
})

test("formatApy handles unavailable APY", () => {
  assert.equal(formatApy("Unavailable"), "Unavailable")
  assert.equal(formatApy("N/A"), "Unavailable")
})
