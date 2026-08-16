import assert from "node:assert/strict"
import test from "node:test"

import { lightweightConversationAnswer } from "../src/agents/lightweight-conversation"

test("answers simple greetings without invoking the remote agent", () => {
  assert.equal(
    lightweightConversationAnswer("Hello!"),
    "Hi. What would you like to do on X Layer?",
  )
})

test("does not intercept substantive X Layer questions", () => {
  assert.equal(lightweightConversationAnswer("How does X Layer finality work?"), null)
  assert.equal(lightweightConversationAnswer("Swap 10 USDT0 to OKB"), null)
})
