import { startMemoryWorkerServer } from "./server.js"
import { log } from "../services/logger.js"

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const handle = await startMemoryWorkerServer({
    port: args.port,
    projectPath: args.projectPath,
    databasePath: args.databasePath,
    registryPath: args.registryPath,
    statusPath: args.statusPath,
    idleShutdownMs: args.idleShutdownMs,
    activeSessionMaxIdleMs: args.activeSessionMaxIdleMs,
    activeSessionReapIntervalMs: args.activeSessionReapIntervalMs,
  })

  log("memory worker listening", {
    port: handle.port,
    projectPath: args.projectPath,
  })

  const shutdown = async () => {
    await handle.stop()
    process.exit(0)
  }

  process.once("SIGINT", () => {
    void shutdown()
  })
  process.once("SIGTERM", () => {
    void shutdown()
  })
}

void main().catch((error) => {
  log("memory worker failed to start", {
    error: error instanceof Error ? error.message : String(error),
  })
  process.exit(1)
})

function parseArgs(args: string[]) {
  const values = new Map<string, string>()

  for (let index = 0; index < args.length; index += 2) {
    const key = args[index]
    const value = args[index + 1]

    if (!key?.startsWith("--") || value === undefined) {
      throw new Error(`Invalid worker argument sequence: ${args.join(" ")}`)
    }

    values.set(key.slice(2), value)
  }

  const port = Number(values.get("port"))
  const projectPath = values.get("project-path")
  const databasePath = values.get("database-path")
  const registryPath = values.get("registry-path")
  const statusPath = values.get("status-path")
  const idleShutdownMs = values.has("idle-shutdown-ms")
    ? Number(values.get("idle-shutdown-ms"))
    : undefined
  const activeSessionMaxIdleMs = values.has("active-session-max-idle-ms")
    ? Number(values.get("active-session-max-idle-ms"))
    : undefined
  const activeSessionReapIntervalMs = values.has("active-session-reap-interval-ms")
    ? Number(values.get("active-session-reap-interval-ms"))
    : undefined

  if (!Number.isFinite(port)) {
    throw new Error("Missing or invalid --port")
  }

  if (!projectPath) {
    throw new Error("Missing --project-path")
  }

  if (!databasePath) {
    throw new Error("Missing --database-path")
  }

  if (idleShutdownMs !== undefined && !Number.isFinite(idleShutdownMs)) {
    throw new Error("Invalid --idle-shutdown-ms")
  }

  if (activeSessionMaxIdleMs !== undefined && !Number.isFinite(activeSessionMaxIdleMs)) {
    throw new Error("Invalid --active-session-max-idle-ms")
  }

  if (
    activeSessionReapIntervalMs !== undefined &&
    !Number.isFinite(activeSessionReapIntervalMs)
  ) {
    throw new Error("Invalid --active-session-reap-interval-ms")
  }

  return {
    port,
    projectPath,
    databasePath,
    registryPath,
    statusPath,
    idleShutdownMs,
    activeSessionMaxIdleMs,
    activeSessionReapIntervalMs,
  }
}
