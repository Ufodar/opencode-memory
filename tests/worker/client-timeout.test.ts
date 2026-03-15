import { describe, expect, test } from "bun:test"

import { checkMemoryWorkerHealth, createMemoryWorkerHttpClient } from "../../src/worker/client.js"

describe("memory worker http client timeout", () => {
  test("aborts a hanging worker request after timeout", async () => {
    let aborted = false

    const worker = createMemoryWorkerHttpClient({
      baseUrl: "http://127.0.0.1:50123",
      requestTimeoutMs: 5,
      fetchImpl: ((_input: RequestInfo | URL, init?: RequestInit) => {
        init?.signal?.addEventListener("abort", () => {
          aborted = true
        })
        return new Promise<Response>(() => {})
      }) as typeof fetch,
    })

    await expect(
      worker.captureRequestAnchorFromMessage({
        sessionID: "ses_demo",
        messageID: "msg_1",
        text: "梳理资格条件",
      }),
    ).rejects.toThrow("timed out")
    expect(aborted).toBe(true)
  })

  test("treats a hanging health check as unhealthy", async () => {
    let aborted = false

    const healthy = await checkMemoryWorkerHealth({
      baseUrl: "http://127.0.0.1:50123",
      requestTimeoutMs: 5,
      fetchImpl: ((_input: RequestInfo | URL, init?: RequestInit) => {
        init?.signal?.addEventListener("abort", () => {
          aborted = true
        })
        return new Promise<Response>(() => {})
      }) as typeof fetch,
    })

    expect(healthy).toBe(false)
    expect(aborted).toBe(true)
  })
})
