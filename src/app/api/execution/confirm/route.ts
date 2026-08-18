import { z } from "zod"

import { isExecutionEnabled } from "@/config/networks"
import { createExecutionReceipt } from "@/config/constants"
import { PreparedActionSchema } from "@/lib/action-plan"
import { hasDatabaseConfiguration } from "@/lib/db/client"
import { storeReceipt } from "@/lib/db/repository"
import { evaluateIntentSafety } from "@/lib/safety/policy"

export const runtime = "nodejs"

const ConfirmationSchema = z.object({
  sessionId: z.string().uuid(),
  conversationId: z.string().uuid(),
  plan: PreparedActionSchema,
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "A valid 66-character onchain transaction hash is required."),
})

export async function POST(request: Request) {
  try {
    const { sessionId, conversationId, plan, txHash } = ConfirmationSchema.parse(await request.json())
    
    // Hard Network Execution Gating: Mainnet execution is strictly disabled in this Xecute version
    if (plan.intent.network === "mainnet") {
      return Response.json(
        {
          error: "Mainnet execution disabled",
          detail: "X Layer Mainnet write actions are disabled in this Xecute version. Switch to X Layer Testnet for live onchain execution.",
        },
        { status: 403 },
      )
    }

    const validStatuses = ["ready_to_execute", "preview-ready", "simulated_preview"]
    if (plan.intent.mode !== "trade" || !validStatuses.includes(plan.status)) {
      return Response.json({ error: "Only a valid trade action can be confirmed" }, { status: 409 })
    }

    const safety = evaluateIntentSafety(plan.intent)
    if (!safety.allowed || safety.level === "blocked") {
      return Response.json({ error: "The action failed the current safety policy", safety }, { status: 409 })
    }

    // Query onchain RPC for verified receipt status
    const { getXLayerTransactionReceipt, callXLayerRpc } = await import("@/lib/xlayer/rpc")

    // Verify transaction details if available onchain
    try {
      const txObj = await callXLayerRpc<{ from?: string; to?: string; chainId?: string } | null>(
        "eth_getTransactionByHash",
        [txHash],
        "testnet",
      )
      if (txObj && txObj.chainId) {
        const txChainId = Number.parseInt(txObj.chainId, 16)
        if (txChainId !== 1952) {
          return Response.json(
            { error: `Transaction chainId mismatch: broadcast to chain ${txChainId}, expected X Layer Testnet (1952).` },
            { status: 400 },
          )
        }
      }
    } catch {
      // Continue to receipt evaluation if getTransactionByHash is delayed
    }

    const rpcReceipt = await getXLayerTransactionReceipt(txHash, "testnet")

    let status: "executed" | "pending" | "reverted" | "broadcast" = "broadcast"
    let gasUsed: string | undefined
    let blockNumber: number | undefined

    if (rpcReceipt.status === "mined") {
      status = rpcReceipt.success ? "executed" : "reverted"
      gasUsed = rpcReceipt.gasUsed
      blockNumber = rpcReceipt.blockNumber
    } else if (rpcReceipt.status === "pending") {
      status = "pending"
    }

    const receipt = createExecutionReceipt(plan.intent, txHash as `0x${string}`, {
      status,
      gasUsed,
      blockNumber,
    })

    let persistence: "stored" | "unavailable" = "unavailable"

    if (hasDatabaseConfiguration()) {
      await storeReceipt({ sessionId, conversationId, intent: plan.intent, safety, receipt })
      persistence = "stored"
    }

    return Response.json(
      {
        receipt: {
          ...receipt,
          explorerUrl: `https://www.okx.com/web3/explorer/xlayer-test/tx/${receipt.transactionHash}`,
        },
        safety,
        persistence,
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Confirmation failed"
    return Response.json(
      { error: "The action could not be confirmed", detail: detail.slice(0, 180) },
      { status: 400 },
    )
  }
}
