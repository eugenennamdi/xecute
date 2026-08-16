import assert from "node:assert/strict"
import test from "node:test"

import { lightweightConversationAnswer } from "../src/agents/lightweight-conversation"

test("routes conversational greetings and inquiries to full agent reasoning without static interceptors", () => {
  assert.equal(lightweightConversationAnswer("Hello!"), null)
  assert.equal(lightweightConversationAnswer("What are you?"), null)
  assert.equal(lightweightConversationAnswer("How does X Layer finality work?"), null)
  assert.equal(lightweightConversationAnswer("Swap 10 USDT0 to OKB"), null)
})
