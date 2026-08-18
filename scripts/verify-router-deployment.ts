import fs from "node:fs"
import path from "node:path"
import solc from "solc"
import { callXLayerRpc } from "../src/lib/xlayer/rpc"
import { ROUTER_ADDRESS_TESTNET } from "../src/config/contracts"

function normalizeBytecode(bytecodeHex: string, immutableRefs: Record<string, Array<{ start: number; length: number }>> = {}): string {
  let clean = bytecodeHex.startsWith("0x") ? bytecodeHex.slice(2) : bytecodeHex
  // 1. Strip CBOR metadata footer: 0xa2 0x64 "ipfs" ... 0x64 "solc" ...
  const cborIndex = clean.lastIndexOf("a264697066735822")
  if (cborIndex !== -1 && cborIndex > clean.length - 250) {
    clean = clean.slice(0, cborIndex)
  }
  // 2. Zero out immutable references at known byte offsets (standard EVM verification normalization)
  const bytes = Buffer.from(clean, "hex")
  for (const refId of Object.keys(immutableRefs)) {
    for (const ref of immutableRefs[refId]) {
      if (ref.start + ref.length <= bytes.length) {
        bytes.fill(0, ref.start, ref.start + ref.length)
      }
    }
  }
  return bytes.toString("hex").toLowerCase()
}

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
  const immutableRefs = contractObj.evm.deployedBytecode.immutableReferences || {}

  console.log(`[2/3] Compilation Successful!`)
  console.log(`  - Local Deployed Bytecode Length: ${localDeployedBytecode.length} hex chars (${localDeployedBytecode.length / 2 - 1} bytes)`)

  // 3. Query Live Onchain Code via eth_getCode
  console.log(`\n[3/3] Querying live onchain bytecode from X Layer Testnet RPC...`)
  const onchainCode = await callXLayerRpc<string>("eth_getCode", [ROUTER_ADDRESS_TESTNET, "latest"], "testnet")

  console.log(`  - Onchain Bytecode Length: ${onchainCode.length} hex chars (${onchainCode.length / 2 - 1} bytes)`)

  const isContract = onchainCode !== "0x" && onchainCode.length > 2
  if (!isContract) {
    console.error("❌ FAILED: Address has no onchain bytecode deployed!")
    process.exit(1)
  }

  // 4. Compare Normalized Opcode Bytecode and Cryptographic Hashes
  const localNorm = normalizeBytecode(localDeployedBytecode, immutableRefs)
  const onchainNorm = normalizeBytecode(onchainCode, immutableRefs)

  const isBytecodeMatch = localNorm === onchainNorm

  const { createHash } = await import("node:crypto")
  const localHash = createHash("sha256").update(localNorm).digest("hex")
  const onchainHash = createHash("sha256").update(onchainNorm).digest("hex")

  console.log("\n==================================================")
  console.log("Verification Summary:")
  console.log("  - Contract is deployed onchain: YES")
  console.log("  - Deployed Address: " + ROUTER_ADDRESS_TESTNET)
  console.log("  - Runtime Code Length: " + onchainCode.length + " hex chars")
  console.log("  - Normalized Runtime SHA256 (Local):   " + localHash)
  console.log("  - Normalized Runtime SHA256 (Onchain): " + onchainHash)
  console.log("  - ABI Function Count: " + contractObj.abi.filter((a: { type: string }) => a.type === "function").length)
  console.log("  - ABI Event Count: " + contractObj.abi.filter((a: { type: string }) => a.type === "event").length)
  console.log("  - Status: " + (isBytecodeMatch ? "MATCH" : "MISMATCH"))
  console.log("==================================================")

  if (!isBytecodeMatch) {
    console.error("❌ FAILED: Compiled runtime bytecode does not exactly match deployed onchain bytecode.")
    process.exit(1)
  }
}

verifyRouterDeployment().catch((err) => {
  console.error("Verification failed:", err)
  process.exit(1)
})
