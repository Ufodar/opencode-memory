import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"

import type { MemoryWorkerStatusSnapshot } from "../memory/contracts.js"

export interface MemoryWorkerStatusSnapshotStore {
  read(): MemoryWorkerStatusSnapshot | null
  write(snapshot: MemoryWorkerStatusSnapshot): void
}

export function createMemoryWorkerStatusSnapshotStore(
  snapshotPath: string,
): MemoryWorkerStatusSnapshotStore {
  return {
    read() {
      try {
        const raw = readFileSync(snapshotPath, "utf8")
        return JSON.parse(raw) as MemoryWorkerStatusSnapshot
      } catch {
        return null
      }
    },

    write(snapshot) {
      mkdirSync(dirname(snapshotPath), { recursive: true })
      writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), "utf8")
    },
  }
}
