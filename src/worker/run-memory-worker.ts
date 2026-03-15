import { startMemoryWorkerServer } from "./server.js"
import { log } from "../services/logger.js"

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const handle = await startMemoryWorkerServer({
    port: args.port,
    projectPath: args.projectPath,
    databasePath: args.databasePath,
    registryPath: args.registryPath,
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

  if (!Number.isFinite(port)) {
    throw new Error("Missing or invalid --port")
  }

  if (!projectPath) {
    throw new Error("Missing --project-path")
  }

  if (!databasePath) {
    throw new Error("Missing --database-path")
  }

  return {
    port,
    projectPath,
    databasePath,
    registryPath,
  }
}
