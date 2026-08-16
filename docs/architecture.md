# Xecute Architecture

Xecute separates probabilistic reasoning from deterministic policy and execution.
The language model can choose read-only tools and explain evidence, but it cannot
approve, sign, prepare executable calldata, or broadcast a transaction.

## Request Flow

1. The browser assigns a random anonymous session ID and sends recent messages to
   `POST /api/chat`.
2. The server records the user message in Neon when persistence is available.
3. The bounded agent loop selects from the read-only X Layer tool catalog.
4. Application code parses the latest prompt into a Zod-validated intent.
5. The deterministic safety engine evaluates that intent independently of the model.
6. The server returns a prepared action containing intent, safety report, provenance,
   and an optional live or simulated preview.
7. A separate call to `POST /api/execution/confirm` revalidates the intent and policy.
8. The current milestone writes a durable mock receipt and stops before wallet signing.

## Layers

### Knowledge Base

`src/lib/knowledge/xlayer.ts` is the reviewed, source-tagged registry. Each record has
a category, network, deployment status, official source, and verification date.
`npm run db:seed` versions the records in Neon with a SHA-256 content hash. Retrieval
uses Neon when available and falls back to the bundled registry during an incident.

### Live Tools

`src/agents/tools/xlayer-tools.ts` exposes read-only RPC and OKX tools for knowledge,
network health, market data, swap quotes, DeFi discovery, addresses, transactions,
and token risk. Every tool validates its input with Zod, has a timeout, returns source
metadata, and reports unavailable data instead of fabricating a value.

### Reasoning Loop

`src/agents/xecute-agent.ts` runs at most four tool rounds. Tool output is treated as
evidence rather than instruction. OpenRouter and OpenAI share the same orchestration;
a deterministic local agent remains available when the remote provider fails.

### Safety Engine

`src/lib/safety/policy.ts` checks the network boundary, confirmation requirement,
simulation capability, intent completeness, token registry, distinct assets, positive
amount, slippage limits, and native gas reserve. A client-provided safety result is
never trusted during confirmation.

### Persistence

The server-only data access layer in `src/lib/db` owns Neon access. Drizzle migrations
create conversations, messages, agent runs, tool events, execution receipts, and
knowledge documents. Browser components only receive sanitized DTOs through route
handlers.

## Execution Boundary

Real execution remains intentionally disabled. The future wallet adapter must consume
only a server-approved plan, simulate the exact transaction, bind confirmation to an
expiring plan hash, and require an explicit wallet signature. Private keys must never
enter Xecute application memory or the model context.
