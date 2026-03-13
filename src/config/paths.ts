import { mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"

const DATA_DIR = join(homedir(), ".opencode-continuity", "data")
const DB_PATH = join(DATA_DIR, "continuity.sqlite")

export function ensureDataDir(): string {
  mkdirSync(DATA_DIR, { recursive: true })
  return DATA_DIR
}

export function getDefaultDatabasePath(): string {
  ensureDataDir()
  mkdirSync(dirname(DB_PATH), { recursive: true })
  return DB_PATH
}
