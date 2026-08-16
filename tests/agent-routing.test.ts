import assert from "node:assert/strict"
import test from "node:test"

import {
  isComplexAgentRequest,
  preferredDirectProvider,
} from "../src/agents/agent-routing"

test("routes routine tool requests to DeepSeek when both providers are available", () => {
  assert.equal(preferredDirectProvider({
    prompt: "What is the current OKB price?",
    mode: "trade",
    hasDeepSeek: true,
    hasGemini: true,
  }), "deepseek")
})

test("routes complex research and prediction requests to Gemini", () => {
  assert.equal(preferredDirectProvider({
    prompt: "Compare the safest USDT0 yield strategies and explain their trade-offs",
    mode: "earn",
    hasDeepSeek: true,
    hasGemini: true,
  }), "gemini")
  assert.equal(isComplexAgentRequest("What happens if OKB drops 10%?", "predict"), true)
})

test("falls back to whichever direct provider is configured", () => {
  assert.equal(preferredDirectProvider({
    prompt: "Compare X Layer bridges",
    mode: "trade",
    hasDeepSeek: true,
    hasGemini: false,
  }), "deepseek")
})
