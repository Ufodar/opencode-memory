import { spawn } from "node:child_process"
import { once } from "node:events"
import { createServer } from "node:net"
import { fileURLToPath } from "node:url"

import { log } from "../services/logger.js"
import type { MemoryWorkerService } from "../services/memory-worker-service.js"
import { checkMemoryWorkerHealth, createMemoryWorkerHttpClient } from "./client.js"

const STARTUP_TIMEOUT_MS = 5000

export interface ManagedMemoryWorker {
  worker: MemoryWorkerService
  stop(): Promise<void>
}

export async function startManagedMemoryWorker(input: {
  projectPath: string
  databasePath: string
}): Promise<ManagedMemoryWorker> {
  const port = await findAvailablePort()
  const workerEntry = fileURLToPath(new URL("./run-memory-worker.js", import.meta.url))
  const bunExecutable = Bun.which("bun")

  if (!bunExecutable) {
    throw new Error("Failed to locate Bun executable for memory worker startup")
  }

  const child = spawn(
    bunExecutable,
    [
      workerEntry,
      "--port",
      String(port),
      "--project-path",
      input.projectPath,
      "--database-path",
      input.databasePath,
    ],
    {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  )

  child.stdout?.on("data", (chunk) => {
    process.stdout.write(chunk)
  })
  child.stderr?.on("data", (chunk) => {
    process.stderr.write(chunk)
  })
  child.on("exit", (code, signal) => {
    log("memory worker exited", { code, signal })
  })

  const baseUrl = `http://127.0.0.1:${port}`
  await waitForWorkerHealth(baseUrl, child)

  const stop = createStopHandle(child)
  registerProcessCleanup(stop)

  return {
    worker: createMemoryWorkerHttpClient({ baseUrl }),
    stop,
  }
}

async function findAvailablePort(): Promise<number> {
  const server = createServer()
  server.listen(0, "127.0.0.1")
  await once(server, "listening")
  const address = server.address()
  const port =
    typeof address === "object" && address && "port" in address ? address.port : undefined

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })

  if (!port) {
    throw new Error("Failed to allocate memory worker port")
  }

  return port
}

async function waitForWorkerHealth(
  baseUrl: string,
  child: ReturnType<typeof spawn>,
): Promise<void> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Memory worker exited before becoming healthy (exitCode=${child.exitCode})`)
    }

    if (await checkMemoryWorkerHealth({ baseUrl })) {
      return
    }

    await sleep(100)
  }

  child.kill("SIGTERM")
  throw new Error(`Memory worker did not become healthy within ${STARTUP_TIMEOUT_MS}ms`)
}

function createStopHandle(child: ReturnType<typeof spawn>) {
  let stopped = false

  return async () => {
    if (stopped) return
    stopped = true

    if (child.exitCode !== null) {
      return
    }

    child.kill("SIGTERM")
    await once(child, "exit").catch(() => undefined)
  }
}

function registerProcessCleanup(stop: () => Promise<void>) {
  const cleanup = () => {
    void stop()
  }

  process.once("exit", cleanup)
  process.once("SIGINT", cleanup)
  process.once("SIGTERM", cleanup)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
