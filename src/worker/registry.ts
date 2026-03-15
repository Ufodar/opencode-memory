import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs"

export type MemoryWorkerRegistryRecord = {
  key: string
  projectPath: string
  databasePath: string
  port: number
  pid: number
  updatedAt: number
}

type MemoryWorkerRegistryFile = {
  version: 1
  records: Record<string, MemoryWorkerRegistryRecord>
}

export function buildWorkerKey(input: { projectPath: string; databasePath: string }) {
  return `${input.projectPath}::${input.databasePath}`
}

export function readWorkerRegistryRecord(input: {
  registryPath: string
  projectPath: string
  databasePath: string
}): MemoryWorkerRegistryRecord | undefined {
  const registry = readWorkerRegistryFile(input.registryPath)
  return registry.records[buildWorkerKey(input)]
}

export function listWorkerRegistryRecords(registryPath: string): MemoryWorkerRegistryRecord[] {
  const registry = readWorkerRegistryFile(registryPath)
  return Object.values(registry.records)
}

export function writeWorkerRegistryRecord(input: {
  registryPath: string
  projectPath: string
  databasePath: string
  port: number
  pid: number
}) {
  const registry = readWorkerRegistryFile(input.registryPath)
  const key = buildWorkerKey(input)

  registry.records[key] = {
    key,
    projectPath: input.projectPath,
    databasePath: input.databasePath,
    port: input.port,
    pid: input.pid,
    updatedAt: Date.now(),
  }

  writeWorkerRegistryFile(input.registryPath, registry)
}

export function removeWorkerRegistryRecord(input: {
  registryPath: string
  projectPath: string
  databasePath: string
}) {
  const registry = readWorkerRegistryFile(input.registryPath)
  const key = buildWorkerKey(input)

  if (!(key in registry.records)) {
    return
  }

  delete registry.records[key]
  writeWorkerRegistryFile(input.registryPath, registry)
}

export function removeWorkerRegistryRecordByKey(input: {
  registryPath: string
  key: string
}) {
  const registry = readWorkerRegistryFile(input.registryPath)

  if (!(input.key in registry.records)) {
    return
  }

  delete registry.records[input.key]
  writeWorkerRegistryFile(input.registryPath, registry)
}

function readWorkerRegistryFile(registryPath: string): MemoryWorkerRegistryFile {
  if (!existsSync(registryPath)) {
    return {
      version: 1,
      records: {},
    }
  }

  try {
    const raw = readFileSync(registryPath, "utf8")
    const parsed = JSON.parse(raw) as MemoryWorkerRegistryFile
    if (parsed.version !== 1 || typeof parsed.records !== "object" || !parsed.records) {
      throw new Error("Invalid worker registry payload")
    }
    return parsed
  } catch {
    return {
      version: 1,
      records: {},
    }
  }
}

function writeWorkerRegistryFile(registryPath: string, registry: MemoryWorkerRegistryFile) {
  const tempPath = `${registryPath}.tmp`

  writeFileSync(tempPath, JSON.stringify(registry, null, 2), "utf8")
  try {
    renameSync(tempPath, registryPath)
  } catch (error) {
    rmSync(tempPath, { force: true })
    throw error
  }
}
