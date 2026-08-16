# Xecute · AI Execution & Intelligence Layer for X Layer

> **A chat-first, intent-driven execution terminal and ecosystem intelligence engine for X Layer.**
>
> Describe what you want to do in plain English. Xecute verifies the required onchain state, applies deterministic safeguards, previews the outcome, and prepares human-confirmed transactions on X Layer Testnet.
>
> On X Layer Mainnet, Xecute operates as a verified, read-only ecosystem assistant for markets, protocols, wallet risk, and opportunities.
>
> **Prompt it. Preview it. Xecute it.**

---

## What is Xecute?

DeFi users routinely jump between DEXs, explorers, yield dashboards, wallets, bridge interfaces, approval scanners, and protocol documentation just to complete a single objective.

AI interfaces can simplify that experience, but introducing AI directly into financial execution creates a fundamental challenge: models can hallucinate token addresses, fabricate quotes, misunderstand network state, or generate unsafe transaction parameters.

**Xecute bridges those two worlds.**

Users express their intent naturally:
- *"Swap 0.01 OKB to USDT with low slippage."*
- *"Send 5 USDC to 0x71C8...73a9."*
- *"Where can I earn with USDT on X Layer?"*
- *"Check my wallet for risky approvals."*

Xecute converts that request into structured intent, retrieves live onchain state, validates the request against deterministic execution policies, simulates or previews the action, and only allows supported transactions to proceed after explicit wallet confirmation.

**The AI helps determine what the user wants. Deterministic application code controls what is actually allowed to execute.**

---

## Deployment Model

Xecute deliberately separates Testnet execution from Mainnet intelligence:

| Capability | X Layer Testnet (`1952`) | X Layer Mainnet (`196`) |
| :--- | :---: | :---: |
| **Read onchain state** | Yes | Yes |
| **Wallet analysis** | Yes | Yes |
| **Protocol discovery** | Yes | Yes |
| **Scenario analysis** | Yes | Yes |
| **Quote / preview** | Yes | Yes (where verified) |
| **Transfers** | Yes | Read-only |
| **Token approvals** | Yes | Inspect-only |
| **Approval revocations** | Yes | Inspect-only |
| **Swaps** | Yes | Preview / advisory |
| **State-changing execution** | **Enabled** | **Disabled (Advisory only)** |

### X Layer Testnet (Chain ID: 1952)
Testnet is Xecute's live execution environment. Supported actions are executed as genuine X Layer Testnet transactions through the connected wallet.

### X Layer Mainnet (Chain ID: 196)
Mainnet is currently Xecute's live read, discovery, analysis, and advisory environment. Xecute inspects real-time Mainnet state and surfaces verified opportunities, while direct state-changing mutations remain restricted to the verified Testnet router in this release.

---

## Core Capabilities

### 1. Act · Intent-Aware Onchain Execution
Xecute turns natural-language instructions into structured, human-confirmed actions on X Layer Testnet.

#### Testnet Swaps
Users can request swaps conversationally:
> *"Swap 100 test USDT to xWETH with max 0.5% slippage."*

Xecute:
1. Parses the requested assets and amount
2. Validates the selected network
3. Checks wallet balances
4. Checks native OKB available for gas
5. Evaluates the supported route
6. Applies slippage constraints
7. Constructs transaction parameters deterministically
8. Simulates and validates the action
9. Shows a complete execution preview
10. Waits for explicit user confirmation
11. Hands the transaction to the connected wallet for signing
12. Tracks the resulting transaction onchain

Current Testnet swap execution uses the Xecute-deployed router:
- **Contract**: [`XecuteTestnetRouter`](https://www.okx.com/web3/explorer/xlayer-test/address/0x9be3af8223f49b9357941db269a39775f7802acb)
- **Address**: `0x9be3af8223f49b9357941db269a39775f7802acb`

#### Direct Transfers
Xecute supports native OKB and registered ERC-20 transfers. Before preparing a transfer, Xecute validates:
- Recipient address checksum and format
- Target network
- Asset and decimals
- Amount
- Wallet balance
- Native gas balance buffer

The complete recipient address and transaction details are shown before signing.

#### Permission Management
Xecute can prepare granular Testnet token approvals and revocations:
- Exact token approvals
- Existing allowance inspection
- Allowance reduction
- Zero-allowance revocation

Xecute does not default to unlimited approvals.

#### Faucet Assistance
Xecute understands when an action cannot proceed because the wallet lacks Testnet OKB or required Testnet assets.
- If the wallet lacks enough OKB for gas, Xecute detects the problem and surfaces the official X Layer Testnet faucet with the connected wallet address ready to use.
- Xecute does not attempt to bypass or reverse-engineer faucet anti-abuse systems.

#### Action-Specific Execution UI
Xecute generates dedicated confirmation interfaces based on the requested operation:
- **Swap Preview**: Input amount → Estimated output, Price Impact, Slippage tuner
- **Transfer Preview**: Send amount → Recipient address, Gas estimate, Asset type
- **Approval Preview**: Token → Spender contract, Allowance limit
- **Revocation Preview**: Token → Spender contract, Zero allowance confirmation

The interface shows the exact state change the user is about to authorize instead of presenting raw calldata.

---

### 2. Advise · X Layer Ecosystem Intelligence

On X Layer Mainnet, Xecute acts as a verified front-line assistant for the ecosystem.

Users can ask:
- *"Where can I earn with USDT on X Layer?"*
- *"What protocols support xBTC?"*
- *"Where can I swap USDT for OKB?"*
- *"Show me stablecoin opportunities."*
- *"What is happening with gas right now?"*

Xecute only surfaces results substantiated by its registered data sources and protocol adapters. If a result cannot be verified, Xecute does not fabricate one.

#### Verified Protocol Discovery
Xecute maintains a deterministic registry of supported X Layer protocols containing information such as:
```typescript
{ id, name, category, chainId, officialUrl, contracts, supportedAssets, verified }
```
- The AI identifies which protocol or capability is relevant.
- The application resolves official URLs and contract addresses from the registry.
- The model never invents protocol links.

#### Yield Discovery
Where supported, Xecute surfaces Mainnet earning opportunities with data such as:
- Protocol name & category
- Underlying asset
- Current APY / yield metric
- Protocol contract
- Relevant liquidity / TVL information
- Official application deep link

Values such as APY, TVL, utilization, liquidity, or withdrawal capacity come from approved data sources or deterministic protocol adapters. If a value cannot be verified, it is shown as unavailable rather than estimated by the AI.

#### Verified Deep Links
Opportunity cards link users directly to:
- Official protocol interfaces
- Relevant market / reserve pages (e.g. Aave V3 reserve overview)
- X Layer explorer contract pages
- Verified Uniswap V3 liquidity pools

---

### 3. Protect · Onchain Wallet & Transaction Intelligence

Protect is Xecute's security and risk-inspection layer operating at two levels:

#### Execution Protect
Before Xecute asks the user to sign a supported transaction, deterministic checks inspect the proposed state change.

#### Wallet Protect
Xecute inspects the connected wallet's existing approvals, spender contracts, and onchain exposure:
- *"Check my wallet risks."*
- *"Which contracts can spend my tokens?"*
- *"Do I have any unlimited approvals?"*
- *"What is this spender contract?"*
- *"Explain my highest-attention approvals."*

#### Wallet Approval Scanner
Xecute does not infer token approvals from AI output; it uses actual chain history and current contract state:
1. **Discover approval relationships**: Identifies token `Approval` events involving the connected wallet.
2. **Confirm current state**: Reads current allowance directly from the token contract: `allowance(wallet, spender)`. Only allowances active in current onchain state are surfaced.

#### Evidence-Backed Findings (No Arbitrary Scores)
Xecute avoids arbitrary AI-generated security scores (e.g. `Risk: 82/100`). Instead, Protect surfaces objective, evidence-backed findings:
- Unlimited approval
- Large allowance relative to wallet balance
- Unknown spender contract
- Externally owned account (EOA) spender
- Upgradeable contract / Proxy implementation
- Unverified contract bytecode

---

### 4. Predict · Scenario Analysis

Predict Mode helps users understand hypothetical outcomes without pretending to predict future market prices:
> *"What happens to my wallet if OKB drops 10%?"*

Xecute:
1. Reads current wallet balances
2. Determines token exposure
3. Applies the requested scenario parameters
4. Calculates estimated portfolio impact
5. Identifies the assets most affected
6. Presents the result as an objective scenario analysis, not a speculative forecast

Predict Mode also simulates price impact, minimum received output, gas expenditure, transaction deltas, and slippage constraints.

---

## Deterministic Pre-Flight Guardrails

The LLM cannot override Xecute's execution policy. Before any supported state-changing action proceeds, the application evaluates 7 deterministic safeguards:

1. **Gas Reserve Protection**: Ensures the wallet contains enough native OKB to cover estimated gas plus a configured safety buffer ($\ge 0.005\text{ OKB}$).
2. **Slippage Enforcement**: Enforces user constraints while respecting the system safety ceiling ($\text{effectiveMaxSlippage} = \min(\text{userConstraint}, 5.0\%)$).
3. **Invalid Action Detection**: Rejects zero-value transactions, identical input/output assets (`OKB` $\to$ `OKB`), and malformed amounts.
4. **Address Validation**: Validates recipient, token, spender, router, and contract addresses before payload construction.
5. **Network Boundary Isolation**: Strictly enforces that Chain ID `1952` (Testnet) is execution-enabled and Chain ID `196` (Mainnet) is execution-disabled.
6. **Balance Verification**: Checks real-time onchain balances prior to proposing supported state changes.
7. **Route / Transaction Simulation**: Validates the prepared action against live contract state. Failed simulations block execution immediately.

---

## AI & Execution Security Boundary

```mermaid
flowchart TD
    Prompt["Natural-Language Prompt"] --> Interpret["AI Intent Interpretation<br/>(DeepSeek V4 / Gemini 3.7)"]
    Interpret --> Intent["Structured Intent Object<br/>(Action, Network, Assets, Amount, Target)"]
    Intent --> Schema["Schema Validation<br/>(Strict Zod Enforcers)"]
    Schema --> Router["Capability Router<br/>(Swap / Transfer / Approve / Revoke)"]
    Router --> Adapter["Allowlisted Deterministic Adapter<br/>(Live RPC & Contract Invocations)"]
    Adapter --> Safeguards["Deterministic Safeguards & State Check<br/>(7-Point Policy Gate)"]
    Safeguards --> Preview["Simulation & Execution Preview UI<br/>(State Deltas & Parameter Tuner)"]
    Preview --> Confirm["Human Confirmation<br/>(Explicit User Trigger)"]
    Confirm --> Sign["Wallet Signature<br/>(Reown AppKit / Viem)"]
    Sign --> Broadcast["X Layer Onchain Broadcast<br/>(XecuteTestnetRouter)"]
```

**User prompts cannot override:**
- Network execution policies
- Approved capability adapters
- Registered contract addresses
- Simulation requirements
- Safety policies
- Human confirmation requirements

---

## System Architecture

```mermaid
flowchart TB
    subgraph UI_Layer ["1. Client & Interface Layer"]
        Prompt["User Instruction"] --> AI["AI Orchestration Engine<br/>• Natural-Language Understanding<br/>• Mode Detection & Tool Invocation"]
        AI --> ValidatedIntent["Validated Intent Schema<br/>• Action & Target Network<br/>• Amounts, Assets, Constraints"]
    end

    subgraph Server_Engine ["2. Deterministic Execution & Safety Engine"]
        ValidatedIntent --> CapRouter["Execution Capability Router<br/>• Swaps · Transfers · Approvals · Revocations"]
        ValidatedIntent --> ReadTools["Ecosystem Intelligence Tools<br/>• Live RPC · Allowances · Protocols"]
        
        CapRouter --> SafetyGate["Deterministic Safety Gate<br/>• Gas Reserve Buffer (≥ 0.005 OKB)<br/>• Hard Slippage Ceiling (≤ 5%)<br/>• Checksum & Simulation Check"]
    end

    subgraph Confirmation_Layer ["3. Interactive Preview & Authorization"]
        SafetyGate --> PreviewCard["Tactile Confirmation Card<br/>• Pay vs Receive Delta Diff<br/>• Preflight Checklist<br/>• User Confirmation Trigger"]
        ReadTools --> PreviewCard
    end

    subgraph Settlement_Layer ["4. Onchain Execution & Audit"]
        PreviewCard --> Wallet["Connected Web3 Wallet<br/>(Reown AppKit / Wagmi / Viem)"]
        Wallet --> RouterContract["XecuteTestnetRouter (Chain 1952)<br/>0x9be3af8223f49b9357941db269a39775f7802acb"]
        RouterContract --> AuditReceipt["Durable Execution Receipt<br/>(Neon Postgres Audit Log)"]
    end
```

---

## Source-of-Truth Principle

Every critical user-facing value in Xecute is derived from a deterministic source:

| Value | Source |
| :--- | :--- |
| **Wallet balance** | RPC / contract read |
| **Native gas balance** | RPC (`eth_getBalance`) |
| **Current allowance** | ERC-20 `allowance(owner, spender)` |
| **Approval history** | Onchain event logs |
| **Spender bytecode** | RPC (`eth_getCode`) |
| **Proxy implementation** | Standard ERC-1967 proxy storage inspection |
| **Swap quote** | Registered DEX quote adapter |
| **APY / Yield** | Verified protocol adapter / reserve contract |
| **Protocol URL** | Curated ecosystem registry |
| **Contract address** | Verified ecosystem registry |
| **Transaction status** | Transaction receipt (`eth_getTransactionReceipt`) |
| **Block number** | RPC (`eth_blockNumber`) |

*If the source of a financial or execution value is simply "The AI generated it", that value is never presented as fact.*

---

## Deployments & Network References

### Xecute Smart Contracts
| Network | Chain ID | Contract | Address | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **X Layer Testnet** | `1952` | `XecuteTestnetRouter` | [`0x9be3af8223f49b9357941db269a39775f7802acb`](https://www.okx.com/web3/explorer/xlayer-test/address/0x9be3af8223f49b9357941db269a39775f7802acb) | Testnet swap and execution routing contract |

---

## Tech Stack

- **Application**: Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind CSS v4, Radix UI Primitives, Lucide Icons
- **AI Orchestration**: Hybrid model routing (`deepseek-v4-flash`, `deepseek-v4-pro`, `gemini-3.7-flash`, `gemini-3.5-flash-lite`, OpenRouter / OpenAI fallback)
- **Web3 & Wallets**: Reown AppKit, Wagmi v2, Viem v2
- **Data & Persistence**: Neon Serverless Postgres, Drizzle ORM
- **Smart Contracts**: Solidity ^0.8.20, Hardhat / tsx deployment and compilation tooling

---

## Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/your-org/xecute.git
cd xecute
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env.local
```

Configure the environment variables in `.env.local`:
```env
# AI Provider (hybrid, deepseek, gemini, or openai)
AI_PROVIDER=hybrid
GEMINI_API_KEY=
DEEPSEEK_API_KEY=

# Neon Serverless Postgres
DATABASE_URL=postgresql://user:password@ep-sample.neon.tech/neondb?sslmode=require

# Web3 (Reown Project ID)
NEXT_PUBLIC_REOWN_PROJECT_ID=

# Optional OKX Market Data API Credentials
OKX_API_KEY=
OKX_SECRET_KEY=
OKX_API_PASSPHRASE=
OKX_PROJECT_ID=
```

### 3. Initialize Database
```bash
npm run db:migrate
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## Verification & Automated Test Suite

Xecute includes a comprehensive 40-test automated verification suite covering RPC integrations, safety guardrails, intent parsers, smart routing, and title generation:

```bash
# Type check
npm run typecheck

# Automated test suite (40 passing tests)
npm test

# Production build
npm run build
```

---

## Security & Non-Custodial Architecture

- **Non-Custodial**: Xecute never holds user funds, private keys, or seed phrases. Every state-changing transaction requires explicit signature confirmation from the user's connected Web3 wallet.
- **No Autonomous Financial Execution**: Xecute does not broadcast transactions on behalf of the user without explicit manual interaction.
- **No Arbitrary AI Calldata**: AI generates structured intent; executable payloads are produced exclusively by deterministic, allowlisted capability adapters.
- **Hard Network Boundary**: Testnet execution is active on Chain ID `1952`; Mainnet financial execution is disabled on Chain ID `196`.
- **Fail Closed**: If required execution parameters, balances, or safety checks cannot be substantiated, Xecute blocks the action immediately rather than guessing or fabricating values.

---

## Current Release Boundaries

Xecute is currently in active early-access release (v0.1) and is designed with strict boundaries:
- State-changing execution is enabled only on X Layer Testnet.
- X Layer Mainnet remains read-only/advisory.
- Testnet assets may have no real monetary value.
- Execution is limited to registered capability adapters.
- Not every X Layer protocol is currently indexed.
- Mainnet opportunities are surfaced only when Xecute can verify the required data.
- Unsupported or unverifiable requests fail safely rather than returning fabricated results.
- Xecute does not custody user assets or wallet credentials.

---

## Roadmap

### Current Release (v0.1)
- [x] Chat-first interface
- [x] Structured intent parsing
- [x] X Layer Testnet wallet support
- [x] Testnet/Mainnet execution boundary
- [x] Testnet swap execution (`XecuteTestnetRouter`)
- [x] Direct transfers
- [x] Token approval flows
- [x] Token revocation flows
- [x] Deterministic execution safeguards
- [x] Mainnet ecosystem intelligence
- [x] Wallet Protect approval scanner
- [x] Expanded contract inspection
- [x] Additional Mainnet protocol adapters
- [x] Testnet Earn discovery
- [x] Onchain execution receipts

### Future Roadmap (v0.2+)
- [ ] Production security audit
- [ ] Expanded X Layer protocol registry
- [ ] More execution adapters
- [ ] Mainnet transaction simulation
- [ ] Limited, allowlisted Mainnet execution
- [ ] Cross-protocol action planning
- [ ] Multi-step intents
- [ ] Cross-chain intent routing
- [ ] Xecute SDK / API

---

## Product Thesis

Most blockchain interfaces force users to understand protocol mechanics before expressing what they want.

**Xecute reverses that relationship:**
$$\text{Intent} \longrightarrow \text{Verified Onchain State} \longrightarrow \text{Deterministic Policy} \longrightarrow \text{Preview} \longrightarrow \text{Human Confirmation} \longrightarrow \text{Onchain Action}$$

- **Testnet proves Xecute can act.**
- **Mainnet proves Xecute understands X Layer.**
- **Protect proves Xecute verifies before asking users to trust an action.**

Together, they form the foundation for Xecute as the AI execution and intelligence layer for X Layer.
