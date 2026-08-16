import type { Intent } from "@/lib/intents"
import type { AdapterPreview, ExecutionContext, XecuteAdapter } from "@/lib/adapters/types"
import type { SimulationResult, TransactionRequest } from "@/types/execution"

export class TestnetVaultAdapter implements XecuteAdapter {
  id = "xecute-test-vault"
  name = "Xecute Test Earn Vault (X Layer Testnet)"
  category = "earn" as const
  chainIds = [1952]
  executionEnabled = false // Disabled: Testnet sandbox has no active vault contract

  supports(intent: Intent, context: ExecutionContext): boolean {
    return (
      intent.mode === "earn" &&
      (context.chainId === 1952 || intent.network === "testnet")
    )
  }

  async getPreview(_intent: Intent, _context: ExecutionContext): Promise<AdapterPreview> {
    return {
      earnOpportunities: [],
      routeDescription: "X Layer Testnet sandbox has no active DeFi yield deployments.",
    }
  }

  async simulate(_intent: Intent, _context: ExecutionContext): Promise<SimulationResult> {
    return {
      success: false,
      error: "Testnet earn execution is disabled (sandbox environment has no active vault deployment).",
    }
  }

  async buildTransaction(_intent: Intent, _context: ExecutionContext): Promise<TransactionRequest | null> {
    return null
  }
}
