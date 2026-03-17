import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { isAbsolute, join } from "node:path"

export interface OpenCodeMemoryConfig {
  storagePath?: string
  outputLanguage?: string
  embeddingApiUrl?: string
  embeddingApiKey?: string
  embeddingModel?: string
  embeddingDimensions?: number
  vectorBackend?: "usearch" | "exact-scan"
  summaryApiUrl?: string
  summaryApiKey?: string
  summaryModel?: string
  observationApiUrl?: string
  observationApiKey?: string
  observationModel?: string
}

interface PluginConfigDependencies {
  env?: NodeJS.ProcessEnv
  existsSyncImpl?: typeof existsSync
  readFileSyncImpl?: typeof readFileSync
}

export function getOpenCodeMemoryConfig(
  dependencies: PluginConfigDependencies = {},
): OpenCodeMemoryConfig {
  const env = dependencies.env ?? process.env
  const existsImpl = dependencies.existsSyncImpl ?? existsSync
  const readFileImpl = dependencies.readFileSyncImpl ?? readFileSync
  const configPath = getOpenCodeMemoryConfigPath(env)

  if (!existsImpl(configPath)) return {}

  try {
    const raw = readFileImpl(configPath, "utf8")
    const parsed = JSON.parse(stripJsonComments(raw))
    return isPlainObject(parsed) ? parsed as OpenCodeMemoryConfig : {}
  } catch {
    return {}
  }
}

export function getOpenCodeMemoryConfigPath(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const explicitPath = env.OPENCODE_MEMORY_CONFIG_PATH?.trim()
  if (explicitPath) {
    return expandHome(explicitPath)
  }

  return join(homedir(), ".config", "opencode", "opencode-memory.jsonc")
}

export function resolveConfiguredSecret(
  value: string | undefined,
  dependencies: PluginConfigDependencies = {},
): string | undefined {
  if (!value) return undefined

  const env = dependencies.env ?? process.env
  const readFileImpl = dependencies.readFileSyncImpl ?? readFileSync
  const trimmed = value.trim()

  if (trimmed.startsWith("env://")) {
    const name = trimmed.slice("env://".length).trim()
    return name ? env[name]?.trim() : undefined
  }

  if (trimmed.startsWith("file://")) {
    const filePath = expandHome(trimmed.slice("file://".length).trim())
    return readFileImpl(filePath, "utf8").trim()
  }

  return trimmed
}

export function expandHome(input: string): string {
  if (!input) return input
  if (input === "~") return homedir()
  if (input.startsWith("~/")) return join(homedir(), input.slice(2))
  return isAbsolute(input) ? input : input
}

function stripJsonComments(value: string): string {
  let result = ""
  let inString = false
  let escaped = false
  let lineComment = false
  let blockComment = false

  for (let index = 0; index < value.length; index += 1) {
    const current = value[index]
    const next = value[index + 1]

    if (lineComment) {
      if (current === "\n") {
        lineComment = false
        result += current
      }
      continue
    }

    if (blockComment) {
      if (current === "*" && next === "/") {
        blockComment = false
        index += 1
      }
      continue
    }

    if (inString) {
      result += current
      if (escaped) {
        escaped = false
        continue
      }
      if (current === "\\") {
        escaped = true
        continue
      }
      if (current === "\"") {
        inString = false
      }
      continue
    }

    if (current === "/" && next === "/") {
      lineComment = true
      index += 1
      continue
    }

    if (current === "/" && next === "*") {
      blockComment = true
      index += 1
      continue
    }

    result += current
    if (current === "\"") {
      inString = true
    }
  }

  return result
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
