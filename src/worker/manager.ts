import { spawn } from "node:child_process"
import { once } from "node:events"
import { createServer } from "node:net"
import { fileURLToPath } from "node:url"

import { getDefaultWorkerRegistryPath } from "../config/paths.js"
import { log } from "../services/logger.js"
import type { MemoryWorkerService } from "../services/memory-worker-service.js"
import {
  checkMemoryWorkerHealth,
  createMemoryWorkerHttpClient,
  shutdownMemoryWorker,
} from "./client.js"
import {
  buildWorkerKey,
  readWorkerRegistryRecord,
  removeWorkerRegistryRecord,
  removeWorkerRegistryRecordByKey,
  listWorkerRegistryRecords,
} from "./registry.js"

const STARTUP_TIMEOUT_MS = 5000
const RECOVERY_COORDINATION_WINDOW_MS = 5_000
const RECOVERY_POLL_INTERVAL_MS = 100

export interface ManagedMemoryWorker {
  worker: MemoryWorkerService
  stop(): Promise<void>
}

interface ManagedMemoryWorkerProcess {
  worker: MemoryWorkerService
  isHealthy(): Promise<boolean>
  stop(): Promise<void>
}

interface ManagedMemoryWorkerEntry {
  key: string
  input: {
    projectPath: string
    databasePath: string
  }
  process: ManagedMemoryWorkerProcess
  refCount: number
  retired: boolean
  stopPromise?: Promise<void>
  restartPromise?: Promise<void>
}

interface ManagedMemoryWorkerManagerDependencies {
  createProcess(input: {
    projectPath: string
    databasePath: string
  }): Promise<ManagedMemoryWorkerProcess>
  recoverProcess?(input: {
    projectPath: string
    databasePath: string
  }): Promise<ManagedMemoryWorkerProcess | undefined>
  registerProcessCleanup(stopAll: () => Promise<void>): void
}

export function createManagedMemoryWorkerManager(
  dependencies: ManagedMemoryWorkerManagerDependencies,
) {
  const entries = new Map<string, ManagedMemoryWorkerEntry>()
  let cleanupRegistered = false

  async function start(input: {
    projectPath: string
    databasePath: string
  }): Promise<ManagedMemoryWorker> {
    if (!cleanupRegistered) {
      dependencies.registerProcessCleanup(async () => {
        await Promise.allSettled(
          Array.from(entries.values()).map((entry) => retireEntry(entries, entry.key, entry)),
        )
      })
      cleanupRegistered = true
    }

    const key = buildWorkerKey(input)
    const existing = entries.get(key)

    if (existing) {
      await ensureHealthyProcess(existing, dependencies)
      existing.refCount += 1
      return createLease(entries, existing, dependencies)
    }

    const process =
      (await dependencies.recoverProcess?.(input)) ?? (await dependencies.createProcess(input))
    const entry: ManagedMemoryWorkerEntry = {
      key,
      input,
      process,
      refCount: 1,
      retired: false,
    }
    entries.set(key, entry)

    return createLease(entries, entry, dependencies)
  }

  return { start }
}

const defaultManager = createManagedMemoryWorkerManager({
  createProcess: startManagedMemoryWorkerProcess,
  recoverProcess: recoverManagedMemoryWorkerProcess,
  registerProcessCleanup: registerPersistentProcessCleanup,
})

export async function startManagedMemoryWorker(input: {
  projectPath: string
  databasePath: string
}): Promise<ManagedMemoryWorker> {
  return defaultManager.start(input)
}

export async function pruneWorkerRegistryRecords(
  registryPath: string,
  dependencies: PruneWorkerRegistryRecordsDependencies = {
    isPidAlive(pid) {
      try {
        process.kill(pid, 0)
        return true
      } catch {
        return false
      }
    },
  },
) {
  const records = listWorkerRegistryRecords(registryPath)
  let removed = 0

  for (const record of records) {
    if (!dependencies.isPidAlive(record.pid)) {
      removeWorkerRegistryRecordByKey({
        registryPath,
        key: record.key,
      })
      removed += 1
    }
  }

  return removed
}

async function startManagedMemoryWorkerProcess(input: {
  projectPath: string
  databasePath: string
}): Promise<ManagedMemoryWorkerProcess> {
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
      "--registry-path",
      getDefaultWorkerRegistryPath(),
    ],
    {
      env: process.env,
      stdio: "ignore",
      detached: true,
    },
  )
  child.unref()
  child.on("exit", (code, signal) => {
    log("memory worker exited", { code, signal })
  })

  const baseUrl = `http://127.0.0.1:${port}`
  await waitForWorkerHealth(baseUrl, child)
  if (!child.pid) {
    throw new Error("Memory worker started without a child pid")
  }

  return {
    worker: createMemoryWorkerHttpClient({ baseUrl }),
    async isHealthy() {
      if (child.exitCode !== null) {
        return false
      }

      return checkMemoryWorkerHealth({ baseUrl })
    },
    stop: createStopHandle({
      pid: child.pid,
      port,
      projectPath: input.projectPath,
      databasePath: input.databasePath,
    }),
  }
}

interface RecoverManagedMemoryWorkerProcessDependencies {
  registryPath: string
  checkHealth(baseUrl: string): Promise<boolean>
  shutdown(baseUrl: string): Promise<void>
  isPidAlive(pid: number): boolean
  sleep(ms: number): Promise<void>
  now(): number
}

interface PruneWorkerRegistryRecordsDependencies {
  isPidAlive(pid: number): boolean
}

export async function recoverManagedMemoryWorkerProcess(input: {
  projectPath: string
  databasePath: string
}, dependencies: RecoverManagedMemoryWorkerProcessDependencies = {
  registryPath: getDefaultWorkerRegistryPath(),
  checkHealth(baseUrl) {
    return checkMemoryWorkerHealth({ baseUrl })
  },
  shutdown(baseUrl) {
    return shutdownMemoryWorker({ baseUrl, requestTimeoutMs: 1_000 })
  },
  isPidAlive(pid) {
    try {
      process.kill(pid, 0)
      return true
    } catch {
      return false
    }
  },
  sleep,
  now: () => Date.now(),
}): Promise<ManagedMemoryWorkerProcess | undefined> {
  const registryPath = dependencies.registryPath
  await pruneWorkerRegistryRecords(registryPath, {
    isPidAlive: dependencies.isPidAlive,
  })

  const record = readWorkerRegistryRecord({
    registryPath,
    projectPath: input.projectPath,
    databasePath: input.databasePath,
  })

  if (!record) {
    return undefined
  }

  if (!dependencies.isPidAlive(record.pid)) {
    removeWorkerRegistryRecord({
      registryPath,
      projectPath: input.projectPath,
      databasePath: input.databasePath,
    })
    return undefined
  }

  const baseUrl = `http://127.0.0.1:${record.port}`
  let healthy = await dependencies.checkHealth(baseUrl)

  if (!healthy && dependencies.now() - record.updatedAt < RECOVERY_COORDINATION_WINDOW_MS) {
    const deadline = dependencies.now() + RECOVERY_COORDINATION_WINDOW_MS

    while (dependencies.now() < deadline) {
      if (!dependencies.isPidAlive(record.pid)) {
        break
      }

      await dependencies.sleep(RECOVERY_POLL_INTERVAL_MS)
      healthy = await dependencies.checkHealth(baseUrl)
      if (healthy) {
        break
      }
    }
  }

  if (!healthy) {
    await dependencies.shutdown(baseUrl).catch(() => undefined)
    removeWorkerRegistryRecord({
      registryPath,
      projectPath: input.projectPath,
      databasePath: input.databasePath,
    })
    return undefined
  }

  return {
    worker: createMemoryWorkerHttpClient({ baseUrl }),
    async isHealthy() {
      return checkMemoryWorkerHealth({ baseUrl })
    },
    stop: createStopHandle({
      pid: record.pid,
      port: record.port,
      projectPath: input.projectPath,
      databasePath: input.databasePath,
    }),
  }
}

function createLease(
  entries: Map<string, ManagedMemoryWorkerEntry>,
  entry: ManagedMemoryWorkerEntry,
  dependencies: ManagedMemoryWorkerManagerDependencies,
): ManagedMemoryWorker {
  let released = false
  const worker = createProxyWorker(entry, dependencies)

  return {
    worker,
    async stop() {
      if (released) return
      released = true

      if (entry.retired) {
        return
      }

      entry.refCount -= 1
      if (entry.refCount <= 0) {
        await retireEntry(entries, entry.key, entry)
      }
    },
  }
}

function createProxyWorker(
  entry: ManagedMemoryWorkerEntry,
  dependencies: ManagedMemoryWorkerManagerDependencies,
): MemoryWorkerService {
  return {
    captureRequestAnchorFromMessage(payload) {
      return callWorker(entry, dependencies, (worker) =>
        worker.captureRequestAnchorFromMessage(payload),
      )
    },

    captureObservationFromToolCall(toolInput, output) {
      return callWorker(entry, dependencies, (worker) =>
        worker.captureObservationFromToolCall(toolInput, output),
      )
    },

    handleSessionIdle(sessionID) {
      return callWorker(entry, dependencies, (worker) => worker.handleSessionIdle(sessionID))
    },

    selectInjectionRecords(payload) {
      return callWorker(entry, dependencies, (worker) => worker.selectInjectionRecords(payload))
    },

    buildSystemContext(payload) {
      return callWorker(entry, dependencies, (worker) => worker.buildSystemContext(payload))
    },

    buildCompactionContext(payload) {
      return callWorker(entry, dependencies, (worker) => worker.buildCompactionContext(payload))
    },

    searchMemoryRecords(payload) {
      return callWorker(entry, dependencies, (worker) => worker.searchMemoryRecords(payload))
    },

    getMemoryTimeline(payload) {
      return callWorker(entry, dependencies, (worker) => worker.getMemoryTimeline(payload))
    },

    getMemoryDetails(ids) {
      return callWorker(entry, dependencies, (worker) => worker.getMemoryDetails(ids))
    },
  }
}

async function callWorker<T>(
  entry: ManagedMemoryWorkerEntry,
  dependencies: ManagedMemoryWorkerManagerDependencies,
  invoke: (worker: MemoryWorkerService) => T | Promise<T>,
): Promise<T> {
  await ensureHealthyProcess(entry, dependencies)
  return invoke(entry.process.worker)
}

async function ensureHealthyProcess(
  entry: ManagedMemoryWorkerEntry,
  dependencies: ManagedMemoryWorkerManagerDependencies,
): Promise<void> {
  if (entry.retired) {
    throw new Error("Managed memory worker handle is already retired")
  }

  const healthy = await entry.process.isHealthy()
  if (healthy) {
    return
  }

  if (!entry.restartPromise) {
    entry.restartPromise = (async () => {
      const previous = entry.process
      const next = await dependencies.createProcess(entry.input)
      entry.process = next
      await previous.stop().catch((error) => {
        log("memory worker stop failed during restart", {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    })().finally(() => {
      entry.restartPromise = undefined
    })
  }

  await entry.restartPromise
}

async function retireEntry(
  entries: Map<string, ManagedMemoryWorkerEntry>,
  key: string,
  entry: ManagedMemoryWorkerEntry,
): Promise<void> {
  if (entry.retired) {
    return entry.stopPromise
  }

  entry.retired = true
  if (entries.get(key) === entry) {
    entries.delete(key)
  }

  entry.stopPromise = entry.process
    .stop()
    .catch((error) => {
      log("memory worker stop failed", {
        error: error instanceof Error ? error.message : String(error),
      })
    })
    .then(() => undefined)

  await entry.stopPromise
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

function createStopHandle(input: {
  pid: number | undefined
  port: number
  projectPath: string
  databasePath: string
}) {
  let stopped = false

  return async () => {
    if (stopped) return
    stopped = true

    if (!input.pid) {
      return
    }

    const baseUrl = `http://127.0.0.1:${input.port}`

    try {
      await shutdownMemoryWorker({
        baseUrl,
        requestTimeoutMs: 1_000,
      })
      await waitForPidExit(input.pid).catch(() => undefined)
      removeWorkerRegistryRecord({
        registryPath: getDefaultWorkerRegistryPath(),
        projectPath: input.projectPath,
        databasePath: input.databasePath,
      })
      return
    } catch {
      // Fallback to PID-based termination below.
    }

    try {
      process.kill(input.pid, 0)
    } catch {
      removeWorkerRegistryRecord({
        registryPath: getDefaultWorkerRegistryPath(),
        projectPath: input.projectPath,
        databasePath: input.databasePath,
      })
      return
    }

    process.kill(input.pid, "SIGTERM")
    await waitForPidExit(input.pid).catch(() => undefined)
    removeWorkerRegistryRecord({
      registryPath: getDefaultWorkerRegistryPath(),
      projectPath: input.projectPath,
      databasePath: input.databasePath,
    })
  }
}

function registerPersistentProcessCleanup(_stopAll: () => Promise<void>) {
  // Intentionally left blank.
  // We keep workers alive across multiple `opencode run` invocations
  // and rely on explicit stop/recovery instead of parent-process exit cleanup.
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function waitForPidExit(pid: number, timeoutMs = STARTUP_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    try {
      process.kill(pid, 0)
    } catch {
      return
    }

    await sleep(100)
  }
}
