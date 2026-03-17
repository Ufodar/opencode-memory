export type EmbeddingVectorBackend = "usearch" | "exact-scan"

export interface EmbeddingConfig {
  apiUrl: string
  apiKey: string
  model: string
  dimensions: number
  backend: EmbeddingVectorBackend
}

export function getEmbeddingConfig(
  env: NodeJS.ProcessEnv = process.env,
): EmbeddingConfig | null {
  const apiUrl = env.OPENCODE_MEMORY_EMBEDDING_API_URL?.trim()
  const apiKey = env.OPENCODE_MEMORY_EMBEDDING_API_KEY?.trim()
  const model = env.OPENCODE_MEMORY_EMBEDDING_MODEL?.trim()
  const dimensionsValue = env.OPENCODE_MEMORY_EMBEDDING_DIMENSIONS?.trim()

  if (!apiUrl || !apiKey || !model || !dimensionsValue) {
    return null
  }

  const dimensions = Number.parseInt(dimensionsValue, 10)
  if (!Number.isFinite(dimensions) || dimensions <= 0) {
    return null
  }

  return {
    apiUrl,
    apiKey,
    model,
    dimensions,
    backend: normalizeBackend(env.OPENCODE_MEMORY_VECTOR_BACKEND),
  }
}

function normalizeBackend(value: string | undefined): EmbeddingVectorBackend {
  return value?.trim() === "exact-scan" ? "exact-scan" : "usearch"
}
