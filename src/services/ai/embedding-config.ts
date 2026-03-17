import {
  getOpenCodeMemoryConfig,
  resolveConfiguredSecret,
} from "../../config/plugin-config.js"

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
  const pluginConfig = getOpenCodeMemoryConfig({ env })
  const apiUrl =
    env.OPENCODE_MEMORY_EMBEDDING_API_URL?.trim() ??
    pluginConfig.embeddingApiUrl?.trim()
  const apiKey = resolveConfiguredSecret(
    env.OPENCODE_MEMORY_EMBEDDING_API_KEY?.trim() ??
      pluginConfig.embeddingApiKey?.trim(),
    { env },
  )
  const model =
    env.OPENCODE_MEMORY_EMBEDDING_MODEL?.trim() ??
    pluginConfig.embeddingModel?.trim()
  const dimensionsValue =
    env.OPENCODE_MEMORY_EMBEDDING_DIMENSIONS?.trim() ??
    toOptionalString(pluginConfig.embeddingDimensions)

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
    backend: normalizeBackend(
      env.OPENCODE_MEMORY_VECTOR_BACKEND ??
        pluginConfig.vectorBackend,
    ),
  }
}

function toOptionalString(value: number | undefined): string | undefined {
  return typeof value === "number" ? String(value) : undefined
}

function normalizeBackend(value: string | undefined): EmbeddingVectorBackend {
  return value?.trim() === "exact-scan" ? "exact-scan" : "usearch"
}
