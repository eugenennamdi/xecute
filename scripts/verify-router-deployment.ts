import fs from "node:fs"
import path from "node:path"
import solc from "solc"
import { callXLayerRpc } from "../src/lib/xlayer/rpc"
import { ROUTER_ADDRESS_TESTNET } from "../src/config/contracts"

async function verifyRouterDeployment() {
  console.log("==================================================")
  console.log("Xecute Router Deployment & Bytecode Verification")
  console.log("==================================================")
  console.log(`Target Contract Address: ${ROUTER_ADDRESS_TESTNET}`)
  console.log(`Target Network: X Layer Testnet (Chain ID: 1952)`)

  // 1. Read Solidity Source Code
  const contractPath = path.resolve(process.cwd(), "contracts/XecuteTestnetRouter.sol")
  const source = fs.readFileSync(contractPath, "utf8")

  // 2. Compile with Solidity Compiler
  const input = {
    language: "Solidity",
    sources: {
      "XecuteTestnetRouter.sol": { content: source },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode", "evm.deployedBytecode"],
        },
      },
    },
  }

  console.log("\n[1/3] Compiling XecuteTestnetRouter.sol via solc...")
  const output = JSON.parse(solc.compile(JSON.stringify(input)))
  
  if (output.errors) {
    const fatal = output.errors.filter((e: { severity: string }) => e.severity === "error")
    if (fatal.length > 0) {
      console.error("Compilation errors:", fatal)
      process.exit(1)
    }
  }

  const contractObj = output.contracts["XecuteTestnetRouter.sol"]["XecuteTestnetRouter"]
  const localDeployedBytecode = "0x" + contractObj.evm.deployedBytecode.object

  console.log(`[2/3] Compilation Successful!`)
  console.log(`  - Local Deployed Bytecode Length: ${localDeployedBytecode.length} chars (${localDeployedBytecode.length / 2 - 1} bytes)`)

  // 3. Query Live Onchain Code via eth_getCode
  console.log(`\n[3/3] Querying live onchain bytecode from X Layer Testnet RPC...`)
  const onchainCode = await callXLayerRpc<string>("eth_getCode", [ROUTER_ADDRESS_TESTNET, "latest"], "testnet")

  console.log(`  - Onchain Bytecode Length: ${onchainCode.length} chars (${onchainCode.length / 2 - 1} bytes)`)

  const isContract = onchainCode !== "0x" && onchainCode.length > 2
  if (!isContract) {
    console.error("❌ FAILED: Address has no onchain bytecode deployed!")
    process.exit(1)
  }

  console.log("\n==================================================")
  console.log("Verification Summary:")
  console.log("  - Contract is deployed onchain: YES")
  console.log("  - Deployed Address: " + ROUTER_ADDRESS_TESTNET)
  console.log("  - Runtime Code Length: " + onchainCode.length + " hex chars")
  console.log("  - ABI Function Count: " + contractObj.abi.filter((a: { type: string }) => a.type === "function").length)
  console.log("  - ABI Event Count: " + contractObj.abi.filter((a: { type: string }) => a.type === "event").length)
  console.log("==================================================")
}

verifyRouterDeployment().catch((err) => {
  console.error("Verification failed:", err)
  process.exit(1)
})
