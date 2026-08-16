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

    const receipt = createExecutionReceipt(plan.intent, txHash as `0x${string}`)

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
