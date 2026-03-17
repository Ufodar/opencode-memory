const ENABLED_VALUES = new Set(["1", "true", "yes", "on", "debug"])

export function log(message: string, metadata?: Record<string, unknown>) {
  if (!isDebugLoggingEnabled()) return

  const payload = metadata ? ` ${JSON.stringify(metadata)}` : ""
  console.log(`[opencode-memory] ${message}${payload}`)
}

export function isDebugLoggingEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env.OPENCODE_MEMORY_DEBUG_LOGS?.trim().toLowerCase()
  return raw ? ENABLED_VALUES.has(raw) : false
}
