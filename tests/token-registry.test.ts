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

test("Mainnet USDT, USDT0, and USD₮0 all resolve to canonical LayerZero OFT contract", () => {
  const usdt = findToken("USDT", 196)
  const usdt0 = findToken("USDT0", 196)
  const usdtSymbol = findToken("USD₮0", 196)
  const legacyUsdt = findToken("USDT_LEGACY", 196)

  assert.ok(usdt)
  assert.ok(usdt0)
  assert.ok(usdtSymbol)
  assert.ok(legacyUsdt)

  // Canonical USDT on X Layer is 0x779Ded...
  assert.equal(usdt.address, "0x779Ded0c9e1022225f8E0630b35a9b54bE713736")
  assert.equal(usdt0.address, "0x779Ded0c9e1022225f8E0630b35a9b54bE713736")
  assert.equal(usdtSymbol.address, "0x779Ded0c9e1022225f8E0630b35a9b54bE713736")

  // Legacy wrapped USDT is distinct and only accessible via explicit legacy identity
  assert.equal(legacyUsdt.address, "0x1E4a5963aBFD975d8c9021ce480b42188849D41d")
  assert.equal(legacyUsdt.deprecated, true)
})

test("xBTC is the default for BTC on Mainnet and distinct from WBTC", () => {
  const btc = findToken("BTC", 196)
  const xbtc = findToken("xBTC", 196)
  const wbtc = findToken("WBTC", 196)

  assert.ok(btc)
  assert.ok(xbtc)
  assert.ok(wbtc)

  assert.equal(btc.address, "0xb7C00000bcDEeF966b20B3D884B98E64d2b06b4f")
  assert.equal(xbtc.address, "0xb7C00000bcDEeF966b20B3D884B98E64d2b06b4f")
  assert.equal(wbtc.address, "0xEA034fb02eB1808C2cc3adbC15f447B93CbE08e1")
  assert.notEqual(xbtc.address, wbtc.address, "xBTC and WBTC must remain distinct contracts")
})

test("ETH and xETH resolve to current xETH asset and remain distinct from WETH contract", () => {
  const eth = findToken("ETH", 196)
  const xeth = findToken("xETH", 196)
  const weth = findToken("WETH", 196)

  assert.ok(eth)
  assert.ok(xeth)
  assert.ok(weth)

  assert.equal(eth.address, "0xE7B000003A45145decf8a28FC755aD5eC5EA025A")
  assert.equal(xeth.address, "0xE7B000003A45145decf8a28FC755aD5eC5EA025A")
  assert.equal(weth.address, "0x5A77f1443D16ee5761d310e38b62f77f726bC71c")
  assert.notEqual(xeth.address, weth.address, "xETH and WETH must remain distinct contracts")
})

test("Native USDC is default USDC on Mainnet and distinct from Bridged USDC and USDC.e", () => {
  const usdcNative = findToken("USDC", 196)
  const usdcBridged = findToken("USDC_BRIDGED", 196)
  const usdcE = findToken("USDC.E", 196)

  assert.ok(usdcNative)
  assert.ok(usdcBridged)
  assert.ok(usdcE)

  assert.equal(usdcNative.address, "0xB6CEceAB302E2E4948951eE7843FC24E92933061")
  assert.equal(usdcBridged.address, "0x74b7F16337b8972027F6196A17a631aC6dE26d22")
  assert.equal(usdcE.address, "0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035")
})

test("Testnet USD₮0 matches official OKX standard faucet address", () => {
  const testnetUsdt = findToken("USDT", 1952)
  const testnetUsdt0 = findToken("USD₮0", 1952)

  assert.ok(testnetUsdt)
  assert.ok(testnetUsdt0)
  assert.equal(testnetUsdt.address, "0x9e29b3AaDa05Bf2D2c827Af80Bd28Dc0b9b4FB0c")
  assert.equal(testnetUsdt0.address, "0x9e29b3AaDa05Bf2D2c827Af80Bd28Dc0b9b4FB0c")
  assert.equal(testnetUsdt.variant, "test-official")
})

test("findToken fails closed for unsupported networks or unknown symbols", () => {
  assert.equal(findToken("UNKNOWN_TOKEN", 1952), null)
  assert.equal(findToken("USDT", 999 as unknown as 1952), null)
  assert.equal(findToken("USDT", 1 as unknown as 1952), null)
})
