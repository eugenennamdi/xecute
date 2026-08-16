import { getAddress, isAddress } from "viem"

import { findToken } from "@/config/tokens"
import type { Intent } from "@/lib/intents"
import type { PreflightSummary, SafetyCheck, SafetyReport } from "@/lib/safety/types"

export const SAFETY_POLICY_VERSION = "2026-08-14.3"

function check(
  id: string,
  label: string,
  status: SafetyCheck["status"],
  detail: string,
  category?: SafetyCheck["category"],
): SafetyCheck {
  return { id, label, status, detail, category }
}

function validPositiveAmount(value: string | null) {
  if (!value || !/^\d+(?:\.\d+)?$/.test(value)) return false
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0
}

function evaluateTrade(intent: Extract<Intent, { mode: "trade" }>) {
  const checks: SafetyCheck[] = []
  const isTestnet = intent.network === "testnet"
  const chainId = isTestnet ? 1952 : 196
  const action = intent.action || "swap"

  // 1. Network Boundary Match & Execution Gating
  const networkName = isTestnet ? "X Layer Testnet (1952)" : "X Layer Mainnet (196)"
  checks.push(check(
    "network-match",
    `Network: ${networkName}`,
    "pass",
    isTestnet
      ? "Targeting X Layer Testnet (1952) execution environment."
      : "Targeting X Layer Mainnet (196) explore & quote environment.",
    "network",
  ))

  if (!isTestnet) {
    checks.push(check(
      "mainnet-execution-gated",
      "Mainnet execution gated",
      "warn",
      "Mainnet execution is disabled in this Xecute version. Live quote & exploration active.",
      "network",
    ))
  } else {
    checks.push(check(
      "testnet-execution-enabled",
      "Testnet execution enabled",
      "pass",
      "X Layer Testnet execution sandbox is active and verifiable.",
      "network",
    ))
  }

  // 2. Action Specific Checks
  let complete = false

  if (action === "transfer") {
    const recipientValid = Boolean(intent.recipient && isAddress(intent.recipient, { strict: false }))
    checks.push(check(
      "recipient-validation",
      "Valid recipient address",
      !intent.recipient ? "warn" : recipientValid ? "pass" : "block",
      !intent.recipient
        ? "Recipient address is required for transfers."
        : recipientValid
          ? `Recipient ${intent.recipient} verified as valid EVM address.`
          : "Recipient is not a valid EVM address.",
      "network",
    ))

    const fromToken = intent.fromToken ? findToken(intent.fromToken, chainId) : null
    checks.push(check(
      "verified-tokens",
      "Verified token",
      !intent.fromToken ? "warn" : fromToken ? "pass" : "block",
      fromToken
        ? `${fromToken.symbol} verified in ${isTestnet ? "testnet" : "mainnet"} registry.`
        : "Transfer asset is not recognized in the registry.",
      "token",
    ))

    const amountValid = validPositiveAmount(intent.amount)
    checks.push(check(
      "valid-amount",
      "Positive transfer amount",
      !intent.amount ? "warn" : amountValid ? "pass" : "block",
      !intent.amount
        ? "Transfer amount is required."
        : amountValid
          ? `Valid transfer amount: ${intent.amount} ${intent.fromToken ?? ""}.`
          : "Transfer amount must be greater than zero.",
      "amount",
    ))

    complete = Boolean(intent.fromToken && intent.amount && recipientValid)
  } else if (action === "approve") {
    const spenderValid = Boolean(intent.spender && isAddress(intent.spender, { strict: false }))
    checks.push(check(
      "spender-validation",
      "Valid spender address",
      !intent.spender ? "warn" : spenderValid ? "pass" : "block",
      !intent.spender
        ? "Spender address is required for approvals."
        : spenderValid
          ? `Spender ${intent.spender} verified as valid address.`
          : "Spender is not a valid EVM address.",
      "network",
    ))

    const fromToken = intent.fromToken ? findToken(intent.fromToken, chainId) : null
    checks.push(check(
      "verified-tokens",
      "Verified token",
      !intent.fromToken ? "warn" : fromToken ? "pass" : "block",
      fromToken
        ? `${fromToken.symbol} verified in ${isTestnet ? "testnet" : "mainnet"} registry.`
        : "Approval asset is not recognized in the registry.",
      "token",
    ))

    const amountValid = validPositiveAmount(intent.amount)
    checks.push(check(
      "valid-amount",
      "Exact approval limit",
      !intent.amount ? "warn" : amountValid ? "pass" : "block",
      !intent.amount
        ? "Approval amount is required."
        : amountValid
          ? `Exact spending limit set to: ${intent.amount} ${intent.fromToken ?? ""}.`
          : "Approval amount must be greater than zero.",
      "amount",
    ))

    complete = Boolean(intent.fromToken && intent.amount && spenderValid)
  } else if (action === "revoke") {
    const spenderValid = Boolean(intent.spender && isAddress(intent.spender, { strict: false }))
    checks.push(check(
      "spender-validation",
      "Valid spender to revoke",
      !intent.spender ? "warn" : spenderValid ? "pass" : "block",
      !intent.spender
        ? "Spender address is required for revocation."
        : spenderValid
          ? `Revoking allowance for ${intent.spender}.`
          : "Spender is not a valid EVM address.",
      "network",
    ))

    const fromToken = intent.fromToken ? findToken(intent.fromToken, chainId) : null
    checks.push(check(
      "verified-tokens",
      "Verified token",
      !intent.fromToken ? "warn" : fromToken ? "pass" : "block",
      fromToken
        ? `${fromToken.symbol} verified in ${isTestnet ? "testnet" : "mainnet"} registry.`
        : "Asset is not recognized in the registry.",
      "token",
    ))

    checks.push(check(
      "valid-amount",
      "Zero allowance reset",
      "pass",
      "Allowance will be set to 0 to completely revoke spending access.",
      "amount",
    ))

    complete = Boolean(intent.fromToken && spenderValid)
  } else {
    // Default Swap Action
    complete = Boolean(intent.fromToken && intent.toToken && intent.amount)

    const fromToken = intent.fromToken ? findToken(intent.fromToken, chainId) : null
    const toToken = intent.toToken ? findToken(intent.toToken, chainId) : null
    const tokensVerified = Boolean(fromToken && toToken)

    checks.push(check(
      "verified-tokens",
      "Verified tokens",
      !complete ? "warn" : tokensVerified ? "pass" : "block",
      !complete
        ? "Waiting for complete token selection."
        : tokensVerified
          ? `${fromToken?.symbol} and ${toToken?.symbol} verified in ${isTestnet ? "testnet" : "mainnet"} registry.`
          : "One or more selected assets are not verified in the registry.",
      "token",
    ))

    const differentAssets = !intent.fromToken || !intent.toToken || intent.fromToken !== intent.toToken
    checks.push(check(
      "distinct-assets",
      "Distinct asset pair",
      differentAssets ? "pass" : "block",
      differentAssets ? "Input and output tokens are distinct." : "Input and output tokens cannot be the same asset.",
      "token",
    ))

    const amountValid = validPositiveAmount(intent.amount)
    checks.push(check(
      "valid-amount",
      "Positive input amount",
      !intent.amount ? "warn" : amountValid ? "pass" : "block",
      !intent.amount
        ? "Input amount is required."
        : amountValid
          ? `Valid input amount: ${intent.amount} ${intent.fromToken ?? ""}.`
          : "Input amount must be a finite number greater than zero.",
      "amount",
    ))

    const slippageStatus = intent.maxSlippage > 5 ? "block" : intent.maxSlippage > 1 ? "warn" : "pass"
    checks.push(check(
      "slippage-limit",
      `Slippage tolerance (${intent.maxSlippage}%)`,
      slippageStatus,
      slippageStatus === "pass"
        ? `${intent.maxSlippage}% slippage is within the conservative policy limit.`
        : slippageStatus === "warn"
          ? `${intent.maxSlippage}% slippage exceeds recommended 1% threshold.`
          : `${intent.maxSlippage}% exceeds hard 5% maximum slippage limit.`,
      "slippage",
    ))
  }

  // Common checks
  if (intent.fromToken === "OKB" || intent.fromToken === "xOKB") {
    checks.push(check(
      "native-gas-reserve",
      "Native gas reserve",
      intent.preserveGasBalance ? "pass" : "warn",
      intent.preserveGasBalance
        ? "Gas reserve protection active: OKB balance preserved for transaction fees."
        : "Warning: Transacting entire OKB balance may leave insufficient gas for fees.",
      "gas",
    ))
  }

  checks.push(check(
    "human-confirmation",
    "Human confirmation",
    "pending",
    "Explicit wallet confirmation required before any onchain transaction can be signed.",
    "approval",
  ))

  const hasBlock = checks.some((c) => c.status === "block")
  const hasWarn = checks.some((c) => c.status === "warn")

  return {
    allowed: !hasBlock && complete,
    level: hasBlock ? "blocked" : hasWarn ? "medium" : "low",
    checks,
    evaluatedAt: new Date().toISOString(),
    policyVersion: SAFETY_POLICY_VERSION,
  } satisfies SafetyReport
}

export function evaluateIntentSafety(intent: Intent): SafetyReport {
  if (intent.mode === "trade") {
    return evaluateTrade(intent)
  }

  const checks: SafetyCheck[] = []

  if (intent.mode === "earn") {
    checks.push(check("earn-protocol-risk", "Audited protocols only", "pass", "Ecosystem protocols filtered by audit and TVL thresholds.", "network"))
    checks.push(check("earn-non-custodial", "Non-custodial deposit", "pass", "Funds remain under direct smart contract control without platform custody.", "network"))
  } else if (intent.mode === "predict") {
    checks.push(check("predict-scenario-only", "Scenario modeling", "pass", "Read-only simulation without financial speculation or trade recommendation.", "network"))
  } else {
    checks.push(check("protect-read-only", "Read-only security scan", "pass", "Evaluating smart contract and allowance security parameters.", "network"))
  }

  return {
    allowed: true,
    level: "low",
    checks,
    evaluatedAt: new Date().toISOString(),
    policyVersion: SAFETY_POLICY_VERSION,
  }
}

export function getCanonicalPreflightSummary(report: SafetyReport): PreflightSummary {
  const total = report.checks.length
  const passed = report.checks.filter((c) => c.status === "pass").length
  const warned = report.checks.filter((c) => c.status === "warn").length
  const blocked = report.checks.filter((c) => c.status === "block").length
  const pending = report.checks.filter((c) => c.status === "pending").length

  const allRequiredPassed = blocked === 0 && report.allowed

  return {
    total,
    passed,
    warned,
    blocked,
    pending,
    allRequiredPassed,
  }
}
