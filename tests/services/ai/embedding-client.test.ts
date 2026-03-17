import { afterEach, describe, expect, mock, test } from "bun:test"

import { createEmbeddingClient } from "../../../src/services/ai/embedding-client.js"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe("createEmbeddingClient", () => {
  test("does not send dimensions in the request payload but still validates returned vector length", async () => {
    const fetchMock = mock(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body))

      expect(body).toEqual({
        input: "worker reuse",
        model: "Qwen3-embedding",
      })

      return new Response(
        JSON.stringify({
          data: [{ embedding: [1, 0, 0] }],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    })

    globalThis.fetch = fetchMock as typeof fetch

    const client = createEmbeddingClient({
      apiUrl: "http://127.0.0.1:3000/v1",
      apiKey: "sk-test",
      model: "Qwen3-embedding",
      dimensions: 3,
      backend: "usearch",
    })

    const vector = await client.embed("worker reuse")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(vector).toEqual(new Float32Array([1, 0, 0]))
  })
})
