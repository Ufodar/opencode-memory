export function log(message: string, metadata?: Record<string, unknown>) {
  const payload = metadata ? ` ${JSON.stringify(metadata)}` : ""
  console.log(`[opencode-memory] ${message}${payload}`)
}
