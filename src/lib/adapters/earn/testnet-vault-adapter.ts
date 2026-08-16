import type { Intent } from "@/lib/intents"
import type { AdapterPreview, ExecutionContext, XecuteAdapter } from "@/lib/adapters/types"
import type { SimulationResult, TransactionRequest } from "@/types/execution"

export class TestnetVaultAdapter implements XecuteAdapter {
  id = "xecute-test-vault"
  name = "Xecute Test Earn Vault (X Layer Testnet)"
  category = "earn" as const
  chainIds = [1952]
  executionEnabled = true

  supports(intent: Intent, context: ExecutionContext): boolean {
    return (
      intent.mode === "earn" &&
      (context.chainId === 1952 || intent.network === "testnet")
    )
  }

  async getPreview(_intent: Intent, _context: ExecutionContext): Promise<AdapterPreview> {
    return {
      earnOpportunities: [
        {
          name: "xUSDT Liquidity Vault",
          protocol: "Xecute Test Vault",
          apy: "5.4% (Simulated)",
          tvlUsd: "$150,000 (Testnet)",
          risk: "Low",
          isTestVault: true,
        },
        {
          name: "xWETH Staking Vault",
          protocol: "Xecute Test Vault",
          apy: "3.8% (Simulated)",
          tvlUsd: "50 xWETH",
          risk: "Low",
          isTestVault: true,
        },
      ],
      routeDescription: "Xecute Testnet Earn Sandbox",
    }
  }

  async simulate(_intent: Intent, _context: ExecutionContext): Promise<SimulationResult> {
    return {
      success: true,
      gasUsed: "95,000",
      logs: ["TestnetVaultDepositSimulationSuccess"],
    }
  }

  async buildTransaction(intent: Intent, _context: ExecutionContext): Promise<TransactionRequest | null> {
    return {
      to: "0x1952000000000000000000000000000000000002",
      data: "0xb6b55f250000000000000000000000000000000000000000000000000000000000000000",
      value: "0",
      gasLimit: "120000",
      chainId: 1952,
    }
  }
}
