import { encodeFunctionData, parseUnits, parseEther, getAddress } from "viem"
import { XLAYER_TESTNET_TOKENS } from "@/config/tokens"

// Canonical deployed Xecute Swap Router contract on X Layer Testnet (Chain ID 1952)
export const ROUTER_ADDRESS_TESTNET = "0x9be3af8223f49b9357941db269a39775f7802acb" as `0x${string}`

export function getSwapTransactionPayload({
  fromTokenSymbol,
  toTokenSymbol,
  amount,
  recipient,
  slippage = 0.5,
}: {
  fromTokenSymbol: string
  toTokenSymbol: string
  amount: string
  recipient: `0x${string}`
  slippage?: number
}) {
  const fromSym = fromTokenSymbol.toUpperCase()
  const toSym = toTokenSymbol.toUpperCase()
  const fromCfg = XLAYER_TESTNET_TOKENS[fromSym]
  const toCfg = XLAYER_TESTNET_TOKENS[toSym]

  const toAddress = (toCfg?.address === "native" ? "0x0000000000000000000000000000000000000000" : toCfg?.address) ?? "0x1111111111111111111111111111111111111111"
  const fromAddress = (fromCfg?.address === "native" ? "0x0000000000000000000000000000000000000000" : fromCfg?.address) ?? "0x1111111111111111111111111111111111111111"

  if (fromSym === "OKB") {
    const valueWei = parseEther(amount)
    const expectedOutUnits = BigInt(Math.floor(Number(amount) * 60 * (1 - slippage / 100) * 1e6))
    const minAmountOut = expectedOutUnits > BigInt(0) ? expectedOutUnits : BigInt(1)

    const data = encodeFunctionData({
      abi: XECUTE_ROUTER_ABI,
      functionName: "swapExactOKBForTokens",
      args: [toAddress as `0x${string}`, minAmountOut, recipient],
    })

    return {
      to: ROUTER_ADDRESS_TESTNET,
      value: `0x${valueWei.toString(16)}`,
      data,
    }
  }

  if (toSym === "OKB") {
    const dec = fromCfg?.decimals ?? 6
    const amountIn = parseUnits(amount, dec)
    const expectedOkbWei = BigInt(Math.floor((Number(amount) / 60) * (1 - slippage / 100) * 1e18))
    const minAmountOut = expectedOkbWei > BigInt(0) ? expectedOkbWei : BigInt(1)

    const data = encodeFunctionData({
      abi: XECUTE_ROUTER_ABI,
      functionName: "swapExactTokensForOKB",
      args: [fromAddress as `0x${string}`, amountIn, minAmountOut, recipient],
    })

    return {
      to: ROUTER_ADDRESS_TESTNET,
      value: "0x0",
      data,
    }
  }

  // Token to Token
  const decIn = fromCfg?.decimals ?? 6
  const decOut = toCfg?.decimals ?? 6
  const amountIn = parseUnits(amount, decIn)
  const expectedOut = parseUnits((Number(amount) * (1 - slippage / 100)).toFixed(decOut), decOut)
  const minAmountOut = expectedOut > BigInt(0) ? expectedOut : BigInt(1)

  const data = encodeFunctionData({
    abi: XECUTE_ROUTER_ABI,
    functionName: "swapExactTokensForTokens",
    args: [fromAddress as `0x${string}`, toAddress as `0x${string}`, amountIn, minAmountOut, recipient],
  })

  return {
    to: ROUTER_ADDRESS_TESTNET,
    value: "0x0",
    data,
  }
}

export function getTransferTransactionPayload({
  tokenSymbol,
  amount,
  recipient,
}: {
  tokenSymbol: string
  amount: string
  recipient: `0x${string}`
}) {
  const sym = tokenSymbol.toUpperCase()
  const tokenCfg = XLAYER_TESTNET_TOKENS[sym]
  const safeRecipient = getAddress(recipient)

  if (sym === "OKB" || tokenCfg?.address === "native") {
    const valueWei = parseEther(amount)
    return {
      to: safeRecipient,
      value: `0x${valueWei.toString(16)}`,
      data: "0x",
    }
  }

  const dec = tokenCfg?.decimals ?? 6
  const tokenAmount = parseUnits(amount, dec)
  const data = encodeFunctionData({
    abi: [
      {
        name: "transfer",
        type: "function",
        inputs: [
          { name: "to", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ type: "bool" }],
      },
    ] as const,
    functionName: "transfer",
    args: [safeRecipient, tokenAmount],
  })

  return {
    to: (tokenCfg?.address ?? safeRecipient) as `0x${string}`,
    value: "0x0",
    data,
  }
}

export function getApprovalTransactionPayload({
  tokenSymbol,
  amount,
  spender,
}: {
  tokenSymbol: string
  amount: string
  spender: `0x${string}`
}) {
  const sym = tokenSymbol.toUpperCase()
  const tokenCfg = XLAYER_TESTNET_TOKENS[sym]
  const safeSpender = getAddress(spender)
  const dec = tokenCfg?.decimals ?? 6
  const tokenAmount = amount === "0" ? BigInt(0) : parseUnits(amount, dec)

  const data = encodeFunctionData({
    abi: [
      {
        name: "approve",
        type: "function",
        inputs: [
          { name: "spender", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ type: "bool" }],
      },
    ] as const,
    functionName: "approve",
    args: [safeSpender, tokenAmount],
  })

  return {
    to: (tokenCfg?.address ?? safeSpender) as `0x${string}`,
    value: "0x0",
    data,
  }
}

export const XECUTE_ROUTER_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "EmergencyWithdraw",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "provider",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "LiquiditySupplied",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "tokenIn",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "tokenOut",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amountOut",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      }
    ],
    "name": "Swap",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "CHAIN_ID",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "emergencyWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenOut",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "minAmountOut",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      }
    ],
    "name": "swapExactOKBForTokens",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amountOut",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenIn",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minAmountOut",
        "type": "uint256"
      },
      {
        "internalType": "address payable",
        "name": "recipient",
        "type": "address"
      }
    ],
    "name": "swapExactTokensForOKB",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amountOut",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenIn",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "tokenOut",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minAmountOut",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      }
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amountOut",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "version",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
] as const

export const XECUTE_ROUTER_BYTECODE = "0x60a060405234801561000f575f80fd5b50336080526080516112d46100485f395f8181610187015281816109e201528181610a5901528181610ac20152610b7801526112d45ff3fe60806040526004361061007c575f3560e01c806385e1f4d01161004c57806385e1f4d0146101615780638da5cb5b1461017657806395ccea67146101c1578063ab548ee4146101e2575f80fd5b806306fdde03146100875780633a3847d3146100e557806354fd4d50146101125780636c08c57e14610142575f80fd5b3661008357005b5f80fd5b348015610092575f80fd5b506100cf6040518060400160405280601a81526020017f58656375746520546573746e6574205377617020526f7574657200000000000081525081565b6040516100dc9190610f58565b60405180910390f35b3480156100f0575f80fd5b506101046100ff366004610fa1565b6101f5565b6040519081526020016100dc565b34801561011d575f80fd5b506100cf604051806040016040528060058152602001640312e302e360dc1b81525081565b34801561014d575f80fd5b5061010461015c366004610fe8565b610520565b34801561016c575f80fd5b506101046107a081565b348015610181575f80fd5b506101a97f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b0390911681526020016100dc565b3480156101cc575f80fd5b506101e06101db366004611043565b6109d7565b005b6101046101f036600461106d565b610bdd565b5f80841161023a5760405162461bcd60e51b815260206004820152600d60248201526c2d32b9379030b6b7bab73a24b760991b60448201526064015b60405180910390fd5b6001600160a01b0382166102605760405162461bcd60e51b8152600401610231906110ac565b6001600160a01b0385163b1561030b57604051336024820152306044820152606481018590526001600160a01b0386169060840160408051601f198184030181529181526020820180516001600160e01b03166323b872dd60e01b179052516102c991906110d7565b5f604051808303815f865af19150503d805f8114610302576040519150601f19603f3d011682016040523d82523d5f602084013e610307565b606091505b5050505b60066001600160a01b0386163b156103cf5760408051600481526024810182526020810180516001600160e01b031663313ce56760e01b17905290515f9182916001600160a01b038a169161035f916110d7565b5f60405180830381855afa9150503d805f8114610397576040519150601f19603f3d011682016040523d82523d5f602084013e61039c565b606091505b50915091508180156103b057506020815110155b156103cc57808060200190518101906103c991906110f2565b92505b50505b6103dd60ff8216600a61120f565b6103e890603c61121a565b6103fa86670de0b6b3a764000061121a565b6104049190611231565b9150838210156104265760405162461bcd60e51b815260040161023190611250565b8147106104c7575f836001600160a01b0316836040515f6040518083038185875af1925050503d805f8114610476576040519150601f19603f3d011682016040523d82523d5f602084013e61047b565b606091505b50509050806104c55760405162461bcd60e51b815260206004820152601660248201527513985d1a5d99481d1c985b9cd9995c8819985a5b195960521b6044820152606401610231565b505b60408051868152602081018490526001600160a01b038581168284015291515f9289169133917f54787c404bb33c88e86f4baf88183a3b0141d0a848e6a9f7a13b66ae3a9b73d19181900360600190a450949350505050565b5f8084116105605760405162461bcd60e51b815260206004820152600d60248201526c2d32b9379030b6b7bab73a24b760991b6044820152606401610231565b6001600160a01b0382166105865760405162461bcd60e51b8152600401610231906110ac565b6001600160a01b0386163b1561063157604051336024820152306044820152606481018590526001600160a01b0387169060840160408051601f198184030181529181526020820180516001600160e01b03166323b872dd60e01b179052516105ef91906110d7565b5f604051808303815f865af19150503d805f8114610628576040519150601f19603f3d011682016040523d82523d5f602084013e61062d565b606091505b5050505b6006806001600160a01b0388163b156106f65760408051600481526024810182526020810180516001600160e01b031663313ce56760e01b17905290515f9182916001600160a01b038c1691610686916110d7565b5f60405180830381855afa9150503d805f81146106be576040519150601f19603f3d011682016040523d82523d5f602084013e6106c3565b606091505b50915091508180156106d757506020815110155b156106f357808060200190518101906106f091906110f2565b93505b50505b6001600160a01b0387163b156107b85760408051600481526024810182526020810180516001600160e01b031663313ce56760e01b17905290515f9182916001600160a01b038b1691610748916110d7565b5f60405180830381855afa9150503d805f8114610780576040519150601f19603f3d011682016040523d82523d5f602084013e610785565b606091505b509150915081801561079957506020815110155b156107b557808060200190518101906107b291906110f2565b92505b50505b6107c660ff8316600a61120f565b6107d460ff8316600a61120f565b6107de908861121a565b6107e89190611231565b92508483101561080a5760405162461bcd60e51b815260040161023190611250565b6001600160a01b0387163b1561097a576040513060248201525f9081906001600160a01b038a169060440160408051601f198184030181529181526020820180516001600160e01b03166370a0823160e01b1790525161086a91906110d7565b5f60405180830381855afa9150503d805f81146108a2576040519150601f19603f3d011682016040523d82523d5f602084013e6108a7565b606091505b50915091508180156108bb57506020815110155b15610977575f818060200190518101906108d59190611287565b9050858110610975576040516001600160a01b038881166024830152604482018890528b169060640160408051601f198184030181529181526020820180516001600160e01b031663a9059cbb60e01b1790525161093391906110d7565b5f604051808303815f865af19150503d805f811461096c576040519150601f19603f3d011682016040523d82523d5f602084013e610971565b606091505b5050505b505b50505b60408051878152602081018590526001600160a01b03868116828401529151898316928b169133917f54787c404bb33c88e86f4baf88183a3b0141d0a848e6a9f7a13b66ae3a9b73d19181900360600190a4505095945050505050565b336001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614610a3e5760405162461bcd60e51b815260206004820152600c60248201526b155b985d5d1a1bdc9a5e995960a21b6044820152606401610231565b6001600160a01b038216610aa5576040516001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000169082156108fc029083905f818181858888f19350505050158015610a9f573d5f803e3d5ffd5b50610b6c565b6001600160a01b0382163b15610b6c576040516001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000811660248301526044820183905283169060640160408051601f198184030181529181526020820180516001600160e01b031663a9059cbb60e01b17905251610b2a91906110d7565b5f604051808303815f865af19150503d805f8114610b63576040519150601f19603f3d011682016040523d82523d5f602084013e610b68565b606091505b5050505b816001600160a01b03167f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03167ff24ef89f38eadc1bde50701ad6e4d6d11a2dc24f7cf834a486991f388332850483604051610bd191815260200190565b60405180910390a35050565b5f803411610c1f5760405162461bcd60e51b815260206004820152600f60248201526e16995c9bc813d2d088185b5bdd5b9d608a1b6044820152606401610231565b6001600160a01b038216610c455760405162461bcd60e51b8152600401610231906110ac565b60066001600160a01b0385163b15610d095760408051600481526024810182526020810180516001600160e01b031663313ce56760e01b17905290515f9182916001600160a01b03891691610c99916110d7565b5f60405180830381855afa9150503d805f8114610cd1576040519150601f19603f3d011682016040523d82523d5f602084013e610cd6565b606091505b5091509150818015610cea57506020815110155b15610d065780806020019051810190610d0391906110f2565b92505b50505b670de0b6b3a7640000610d2060ff8316600a61120f565b610d2b34603c61121a565b610d35919061121a565b610d3f9190611231565b9150815f03610d4d57600191505b83821015610d6d5760405162461bcd60e51b815260040161023190611250565b6001600160a01b0385163b15610edd576040513060248201525f9081906001600160a01b0388169060440160408051601f198184030181529181526020820180516001600160e01b03166370a0823160e01b17905251610dcd91906110d7565b5f60405180830381855afa9150503d805f8114610e05576040519150601f19603f3d011682016040523d82523d5f602084013e610e0a565b606091505b5091509150818015610e1e57506020815110155b15610eda575f81806020019051810190610e389190611287565b9050848110610ed8576040516001600160a01b0387811660248301526044820187905289169060640160408051601f198184030181529181526020820180516001600160e01b031663a9059cbb60e01b17905251610e9691906110d7565b5f604051808303815f865af19150503d805f8114610ecf576040519150601f19603f3d011682016040523d82523d5f602084013e610ed4565b606091505b5050505b505b50505b60408051348152602081018490526001600160a01b03858116828401529151918716915f9133917f54787c404bb33c88e86f4baf88183a3b0141d0a848e6a9f7a13b66ae3a9b73d19181900360600190a4509392505050565b5f5b83811015610f50578181015183820152602001610f38565b50505f910152565b602081525f8251806020840152610f76816040850160208701610f36565b601f01601f19169190910160400192915050565b6001600160a01b0381168114610f9e575f80fd5b50565b5f805f8060808587031215610fb4575f80fd5b8435610fbf81610f8a565b935060208501359250604085013591506060850135610fdd81610f8a565b939692955090935050565b5f805f805f60a08688031215610ffc575f80fd5b853561100781610f8a565b9450602086013561101781610f8a565b93506040860135925060608601359150608086013561103581610f8a565b809150509295509295909350565b5f8060408385031215611054575f80fd5b823561105f81610f8a565b946020939093013593505050565b5f805f6060848603121561107f575f80fd5b833561108a81610f8a565b92506020840135915060408401356110a181610f8a565b809150509250925092565b602080825260119082015270125b9d985b1a59081c9958da5c1a595b9d607a1b604082015260600190565b5f82516110e8818460208701610f36565b9190910192915050565b5f60208284031215611102575f80fd5b815160ff81168114611112575f80fd5b9392505050565b634e487b7160e01b5f52601160045260245ffd5b600181815b8085111561116757815f190482111561114d5761114d611119565b8085161561115a57918102915b93841c9390800290611132565b509250929050565b5f8261117d57506001611209565b8161118957505f611209565b816001811461119f57600281146111a9576111c5565b6001915050611209565b60ff8411156111ba576111ba611119565b50506001821b611209565b5060208310610133831016604e8410600b84101617156111e8575081810a611209565b6111f2838361112d565b805f190482111561120557611205611119565b0290505b92915050565b5f611112838361116f565b808202811582820484141761120957611209611119565b5f8261124b57634e487b7160e01b5f52601260045260245ffd5b500490565b60208082526017908201527f536c697070616765206c696d6974206578636565646564000000000000000000604082015260600190565b5f60208284031215611297575f80fd5b505191905056fea26469706673582212209da3aa45f6325e4b75943f7be1ad8a00a6ebe5137251bed8a09a7436d82cd77464736f6c63430008140033" as const
