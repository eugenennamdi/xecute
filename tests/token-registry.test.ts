import assert from "node:assert/strict"
import test from "node:test"
import { isAddress, getAddress } from "viem"

import {
  findToken,
  XLAYER_MAINNET_TOKENS,
  XLAYER_TESTNET_TOKENS,
} from "../src/config/tokens"

test("All Testnet tokens have checksummed addresses and valid chain ID", () => {
  for (const [key, token] of Object.entries(XLAYER_TESTNET_TOKENS)) {
    assert.equal(token.chainId, 1952, `Token ${key} should have chainId 1952`)
    assert.equal(token.isTestAsset, true, `Token ${key} should be marked as test asset`)
    assert.equal(token.verified, true, `Token ${key} should be verified`)
    if (token.address !== "native") {
      assert.ok(isAddress(token.address), `Token ${key} address should be a valid address`)
      assert.equal(token.address, getAddress(token.address), `Token ${key} address should be checksummed`)
    }
  }
})

test("All Mainnet tokens have checksummed addresses and valid chain ID", () => {
  for (const [key, token] of Object.entries(XLAYER_MAINNET_TOKENS)) {
    assert.equal(token.chainId, 196, `Token ${key} should have chainId 196`)
    assert.equal(token.isTestAsset, false, `Token ${key} should not be marked as test asset`)
    assert.equal(token.verified, true, `Token ${key} should be verified`)
    if (token.address !== "native") {
      assert.ok(isAddress(token.address), `Token ${key} address should be a valid address`)
      assert.equal(token.address, getAddress(token.address), `Token ${key} address should be checksummed`)
    }
  }
})

test("Mainnet USDT and USD₮0 are distinct token assets on X Layer", () => {
  const usdtBridged = findToken("USDT", 196)
  const usdt0 = findToken("USDT0", 196)

  assert.ok(usdtBridged)
  assert.ok(usdt0)
  assert.notEqual(usdtBridged.address, usdt0.address, "USDT_Bridged and USD₮0 must have distinct contract addresses")
  assert.equal(usdt0.address, "0x779Ded0c9e1022225f8E0630b35a9b54bE713736")
  assert.equal(usdtBridged.address, "0x1E4a5963aBFD975d8c9021ce480b42188849D41d")
})

test("Native USDC and Bridged USDC are distinct token assets on Mainnet", () => {
  const usdcNative = findToken("USDC", 196)
  const usdcBridged = findToken("USDC_BRIDGED", 196)

  assert.ok(usdcNative)
  assert.ok(usdcBridged)
  assert.notEqual(usdcNative.address, usdcBridged.address, "Native Circle USDC and Bridged USDC must have distinct addresses")
  assert.equal(usdcNative.address, "0xB6CEceAB302E2E4948951eE7843FC24E92933061")
  assert.equal(usdcBridged.address, "0x74b7F16337b8972027F6196A17a631aC6dE26d22")
})

test("findToken fails closed for unsupported networks or unknown symbols", () => {
  assert.equal(findToken("UNKNOWN_TOKEN", 1952), null)
  assert.equal(findToken("USDT", 999 as unknown as 1952), null)
  assert.equal(findToken("USDT", 1 as unknown as 1952), null)
})
