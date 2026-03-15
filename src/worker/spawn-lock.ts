import { createHash } from "node:crypto"
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

type WorkerSpawnLockPayload = {
  pid: number
  createdAt: number
}

export interface WorkerSpawnLockHandle {
  release(): void
}

const DEFAULT_LOCK_STALE_MS = 15_000

export function buildWorkerSpawnLockPath(input: {
  registryPath: string
  projectPath: string
  databasePath: string
}) {
  const hash = createHash("sha256")
    .update(`${input.projectPath}::${input.databasePath}`)
    .digest("hex")
    .slice(0, 16)

  return join(dirname(input.registryPath), `worker-spawn-${hash}.lock`)
}

export function tryAcquireWorkerSpawnLock(
  lockPath: string,
  dependencies: {
    now(): number
    pid: number | undefined
    isPidAlive(pid: number): boolean
    staleMs?: number
  } = {
    now: () => Date.now(),
    pid: process.pid,
    isPidAlive(pid) {
      try {
        process.kill(pid, 0)
        return true
      } catch {
        return false
      }
    },
    staleMs: DEFAULT_LOCK_STALE_MS,
  },
): WorkerSpawnLockHandle | undefined {
  const tryWrite = () => {
    writeFileSync(
      lockPath,
      JSON.stringify({
        pid: dependencies.pid ?? -1,
        createdAt: dependencies.now(),
      } satisfies WorkerSpawnLockPayload),
      {
        encoding: "utf8",
        flag: "wx",
      },
    )

    return {
      release() {
        rmSync(lockPath, { force: true })
      },
    } satisfies WorkerSpawnLockHandle
  }

  try {
    return tryWrite()
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") {
      throw error
    }
  }

  const stalePayload = readSpawnLockPayload(lockPath)
  const staleMs = dependencies.staleMs ?? DEFAULT_LOCK_STALE_MS

  if (
    stalePayload &&
    dependencies.now() - stalePayload.createdAt > staleMs &&
    !dependencies.isPidAlive(stalePayload.pid)
  ) {
    rmSync(lockPath, { force: true })
    return tryAcquireWorkerSpawnLock(lockPath, dependencies)
  }

  return undefined
}

function readSpawnLockPayload(lockPath: string): WorkerSpawnLockPayload | undefined {
  if (!existsSync(lockPath)) {
    return undefined
  }

  try {
    const raw = readFileSync(lockPath, "utf8")
    const parsed = JSON.parse(raw) as Partial<WorkerSpawnLockPayload>

    if (typeof parsed.pid !== "number" || typeof parsed.createdAt !== "number") {
      return undefined
    }

    return {
      pid: parsed.pid,
      createdAt: parsed.createdAt,
    }
  } catch {
    return undefined
  }
}
