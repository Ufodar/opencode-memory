import { mkdirSync } from "node:fs"
import { createHash } from "node:crypto"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { expandHome, getOpenCodeMemoryConfig } from "./plugin-config.js"

const DEFAULT_DATA_DIR = join(homedir(), ".opencode-memory", "data")

export function ensureDataDir(env: NodeJS.ProcessEnv = process.env): string {
  const dataDir = getDataDir(env)
  mkdirSync(dataDir, { recursive: true })
  return dataDir
}

export function getDefaultDatabasePath(env: NodeJS.ProcessEnv = process.env): string {
  const dataDir = ensureDataDir(env)
  const dbPath = join(dataDir, "memory.sqlite")
  mkdirSync(dirname(dbPath), { recursive: true })
  return dbPath
}

export function getDefaultWorkerRegistryPath(env: NodeJS.ProcessEnv = process.env): string {
  const dataDir = ensureDataDir(env)
  const registryPath = join(dataDir, "worker-registry.json")
  mkdirSync(dirname(registryPath), { recursive: true })
  return registryPath
}

export function getDefaultWorkerStatusPath(input: {
  projectPath: string
  databasePath: string
}, env: NodeJS.ProcessEnv = process.env): string {
  const dataDir = ensureDataDir(env)
  const statusPath = join(
    dataDir,
    `worker-status-${hashWorkerStatusKey(input)}.json`,
  )
  mkdirSync(dirname(statusPath), { recursive: true })
  return statusPath
}

function hashWorkerStatusKey(input: { projectPath: string; databasePath: string }) {
  return createHash("sha256")
    .update(`${input.projectPath}::${input.databasePath}`)
    .digest("hex")
    .slice(0, 16)
}

function getDataDir(env: NodeJS.ProcessEnv): string {
  const pluginConfig = getOpenCodeMemoryConfig({ env })
  return pluginConfig.storagePath
    ? expandHome(pluginConfig.storagePath)
    : DEFAULT_DATA_DIR
}
