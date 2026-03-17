import { getEmbeddingConfig, type EmbeddingConfig } from "./embedding-config.js"

export interface EmbeddingClient {
  config: EmbeddingConfig
  embed(text: string): Promise<Float32Array>
}

export function createEmbeddingClient(
  config: EmbeddingConfig = requireEmbeddingConfig(),
): EmbeddingClient {
  return {
    config,
    async embed(text: string) {
      const response = await fetch(`${config.apiUrl}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          input: text,
          model: config.model,
        }),
      })

      if (!response.ok) {
        throw new Error(`Embedding request failed: ${response.status} ${response.statusText}`)
      }

      const payload = (await response.json()) as {
        data?: Array<{ embedding?: number[] }>
      }
      const embedding = payload.data?.[0]?.embedding
      if (!Array.isArray(embedding)) {
        throw new Error("Embedding response missing vector data")
      }

      const vector = new Float32Array(embedding)
      if (vector.length !== config.dimensions) {
        throw new Error(
          `Embedding dimensions mismatch: expected ${config.dimensions}, got ${vector.length}`,
        )
      }

      return vector
    },
  }
}

function requireEmbeddingConfig(): EmbeddingConfig {
  const config = getEmbeddingConfig()
  if (!config) {
    throw new Error("Embedding config is missing")
  }
  return config
}
