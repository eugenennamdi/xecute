import { createHmac } from "node:crypto"

const OKX_BASE_URL = "https://web3.okx.com"

type OkxMethod = "GET" | "POST"

type OkxEnvelope<T> = {
  code: string | number
  msg: string
  data: T
}

export class OkxConfigurationError extends Error {
  constructor() {
    super("OKX Onchain OS credentials are not configured")
    this.name = "OkxConfigurationError"
  }
}

function okxCredentials() {
  const apiKey = process.env.OKX_API_KEY
  const secretKey = process.env.OKX_SECRET_KEY
  const passphrase = process.env.OKX_API_PASSPHRASE
  const projectId = process.env.OKX_PROJECT_ID

  if (!apiKey || !secretKey || !passphrase || !projectId) return null
  return { apiKey, secretKey, passphrase, projectId }
}

export function hasOkxCredentials() {
  return okxCredentials() !== null
}

const responseCache = new Map<string, { expiresAt: number; data: unknown }>()
const CACHE_TTL_MS = 60_000

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function okxRequest<T>({
  path,
  method,
  query,
  body,
}: {
  path: string
  method: OkxMethod
  query?: Record<string, string>
  body?: unknown
}): Promise<T> {
  const credentials = okxCredentials()
  if (!credentials) throw new OkxConfigurationError()

  const search = query ? `?${new URLSearchParams(query).toString()}` : ""
  const requestPath = `${path}${search}`
  const bodyText = body === undefined ? "" : JSON.stringify(body)
  const cacheKey = `${method}:${requestPath}:${bodyText}`

  const cached = responseCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T
  }

  let lastError: Error | null = null

  // Up to 3 attempts with exponential backoff on HTTP 429 / rate limits
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await sleep(attempt * 400)
    }

    try {
      const timestamp = new Date().toISOString()
      const signature = createHmac("sha256", credentials.secretKey)
        .update(`${timestamp}${method}${requestPath}${bodyText}`)
        .digest("base64")

      const response = await fetch(`${OKX_BASE_URL}${requestPath}`, {
        method,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
        headers: {
          "Content-Type": "application/json",
          "OK-ACCESS-KEY": credentials.apiKey,
          "OK-ACCESS-PASSPHRASE": credentials.passphrase,
          "OK-ACCESS-PROJECT": credentials.projectId,
          "OK-ACCESS-SIGN": signature,
          "OK-ACCESS-TIMESTAMP": timestamp,
        },
        body: body === undefined ? undefined : bodyText,
      })

      const payload = (await response.json().catch(() => null)) as OkxEnvelope<T> | null

      if (response.status === 429 || (payload && String(payload.code) === "50011")) {
        // Rate limited — back off and retry
        lastError = new Error("OKX Onchain OS request rate limited (Too Many Requests)")
        continue
      }

      if (!response.ok || !payload || String(payload.code) !== "0") {
        const message = payload?.msg || `HTTP ${response.status}`
        throw new Error(`OKX Onchain OS request failed: ${message.slice(0, 180)}`)
      }

      responseCache.set(cacheKey, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        data: payload.data,
      })

      return payload.data
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt === 2) break
    }
  }

  // If rate-limited or transient network failure and we have any cached data (even if slightly stale), return it gracefully
  if (cached) {
    return cached.data as T
  }

  throw lastError ?? new Error("OKX Onchain OS request failed")
}
