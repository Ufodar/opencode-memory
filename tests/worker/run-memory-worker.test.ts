import { afterEach, describe, expect, test } from "bun:test"
import { spawn } from "node:child_process"
import { mkdtemp, rm } from "node:fs/promises"
import { createServer } from "node:net"
import { tmpdir } from "node:os"
import path from "node:path"

import { checkMemoryWorkerHealth } from "../../src/worker/client.js"

const cleanupTasks: Array<() => Promise<void>> = []

afterEach(async () => {
  while (cleanupTasks.length > 0) {
    const task = cleanupTasks.pop()
    if (task) {
      await task()
    }
  }
})

describe("run-memory-worker", () => {
  test("exits the detached worker process after idle shutdown", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-runner-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const workerEntry = path.resolve(
      "/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/worker/run-memory-worker.ts",
    )
    const bunExecutable = Bun.which("bun")
    expect(bunExecutable).toBeTruthy()

    const port = await findAvailablePort()
    const databasePath = path.join(root, "memory.sqlite")
    const registryPath = path.join(root, "worker-registry.json")
    const statusPath = path.join(root, "worker-status.json")

    const child = spawn(
      bunExecutable!,
      [
        workerEntry,
        "--port",
        String(port),
        "--project-path",
        "/workspace/demo",
        "--database-path",
        databasePath,
        "--registry-path",
        registryPath,
        "--status-path",
        statusPath,
        "--idle-shutdown-ms",
        "50",
      ],
      {
        stdio: "ignore",
      },
    )

    cleanupTasks.push(async () => {
      if (child.exitCode !== null) {
        return
      }

      child.kill("SIGTERM")
      await waitForChildExit(child, 2_000).catch(() => undefined)
    })

    const baseUrl = `http://127.0.0.1:${port}`
    await waitForHealth(baseUrl, 2_000)
    await waitForChildExit(child, 2_000)

    expect(child.exitCode).toBe(0)
  })
})

async function waitForHealth(baseUrl: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (await checkMemoryWorkerHealth({ baseUrl, requestTimeoutMs: 100 })) {
      return
    }

    await Bun.sleep(25)
  }

  throw new Error(`worker did not become healthy within ${timeoutMs}ms`)
}

async function waitForChildExit(child: ReturnType<typeof spawn>, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      return
    }

    await Bun.sleep(25)
  }

  throw new Error(`worker did not exit within ${timeoutMs}ms`)
}

async function findAvailablePort(): Promise<number> {
  const server = createServer()
  server.listen(0, "127.0.0.1")
  await new Promise<void>((resolve) => server.once("listening", () => resolve()))
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
    throw new Error("failed to allocate port")
  }

  return port
}
