import { mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"

const DATA_DIR = join(homedir(), ".opencode-memory", "data")
const DB_PATH = join(DATA_DIR, "memory.sqlite")
const WORKER_REGISTRY_PATH = join(DATA_DIR, "worker-registry.json")
const WORKER_STATUS_PATH = join(DATA_DIR, "worker-status.json")

export function ensureDataDir(): string {
  mkdirSync(DATA_DIR, { recursive: true })
  return DATA_DIR
}

export function getDefaultDatabasePath(): string {
  ensureDataDir()
  mkdirSync(dirname(DB_PATH), { recursive: true })
  return DB_PATH
}

export function getDefaultWorkerRegistryPath(): string {
  ensureDataDir()
  mkdirSync(dirname(WORKER_REGISTRY_PATH), { recursive: true })
  return WORKER_REGISTRY_PATH
}

export function getDefaultWorkerStatusPath(): string {
  ensureDataDir()
  mkdirSync(dirname(WORKER_STATUS_PATH), { recursive: true })
  return WORKER_STATUS_PATH
}
