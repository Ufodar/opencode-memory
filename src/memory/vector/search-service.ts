import { Index, MetricKind } from "usearch"

import type {
  MemoryDetailRecord,
  MemorySearchRecord,
} from "../contracts.js"
import type { ObservationRecord } from "../observation/types.js"
import {
  createStoredObservationVectorRecord,
  createStoredSummaryVectorRecord,
  type SQLiteMemoryVectorRepository,
  type StoredVectorMemoryRecord,
} from "../../storage/sqlite/vector-repository.js"

export interface VectorIndexRecord {
  id: string
  projectPath: string
  sessionID?: string
  vector: Float32Array
}

export interface VectorIndexSearchInput {
  projectPath: string
  sessionID?: string
  queryVector: Float32Array
  limit: number
}

export interface VectorIndex {
  upsert(record: VectorIndexRecord): Promise<void>
  search(input: VectorIndexSearchInput): Promise<string[]>
}

export interface SemanticMemorySearch {
  search(input: {
    projectPath: string
    sessionID?: string
    query: string
    limit: number
  }): Promise<{
    mode: "semantic" | "fallback"
    ids: string[]
  }>
}

export interface StoredSemanticMemorySearch {
  indexObservation(record: ObservationRecord): Promise<void>
  indexSummary(input: {
    detail: Extract<MemoryDetailRecord, { kind: "summary" }>
    projectPath: string
    sessionID: string
    requestSummary: string
  }): Promise<void>
  search(input: {
    projectPath: string
    sessionID?: string
    query: string
    limit: number
    kinds?: Array<MemorySearchRecord["kind"]>
  }): Promise<{
    mode: "semantic" | "fallback"
    results: MemorySearchRecord[]
  }>
}

export function createExactScanVectorIndex(): VectorIndex {
  const records = new Map<string, VectorIndexRecord>()

  return {
    async upsert(record) {
      records.set(record.id, record)
    },
    async search(input) {
      return Array.from(records.values())
        .filter((record) => {
          if (record.projectPath !== input.projectPath) {
            return false
          }
          if (input.sessionID && record.sessionID !== input.sessionID) {
            return false
          }
          return true
        })
        .map((record) => ({
          id: record.id,
          similarity: cosineSimilarity(record.vector, input.queryVector),
        }))
        .filter((row) => row.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, input.limit)
        .map((row) => row.id)
    },
  }
}

export function createSemanticMemorySearch(input: {
  index: VectorIndex
  embedQuery: (query: string) => Promise<Float32Array>
  fallbackSearch: (query: string, limit: number) => string[]
}): SemanticMemorySearch {
  return {
    async search(searchInput) {
      try {
        const queryVector = await input.embedQuery(searchInput.query)
        const ids = await input.index.search({
          projectPath: searchInput.projectPath,
          sessionID: searchInput.sessionID,
          queryVector,
          limit: searchInput.limit,
        })

        if (ids.length > 0) {
          return {
            mode: "semantic",
            ids,
          }
        }
      } catch {
        // Fall through to the current text-search path.
      }

      return {
        mode: "fallback",
        ids: input.fallbackSearch(searchInput.query, searchInput.limit),
      }
    },
  }
}

export function createStoredSemanticMemorySearch(input: {
  repository: SQLiteMemoryVectorRepository
  dimensions: number
  backend: "usearch" | "exact-scan"
  embedQuery: (query: string) => Promise<Float32Array>
  logFailure?: (message: string, metadata?: Record<string, unknown>) => void
}): StoredSemanticMemorySearch {
  const index =
    input.backend === "usearch"
      ? createStoredUSearchVectorIndex(input.repository, input.dimensions)
      : createStoredExactScanVectorIndex(input.repository)

  return {
    async indexObservation(record) {
      try {
        const text = buildObservationEmbeddingText(record)
        const vector = await input.embedQuery(text)
        ensureDimensions(vector, input.dimensions)
        const stored = createStoredObservationVectorRecord(record, vector)
        input.repository.upsert(stored)
        await index.upsert(stored)
      } catch (error) {
        input.logFailure?.("semantic observation indexing failed", {
          id: record.id,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    },

    async indexSummary(summaryInput) {
      try {
        const text = buildSummaryEmbeddingText(summaryInput)
        const vector = await input.embedQuery(text)
        ensureDimensions(vector, input.dimensions)
        const stored = createStoredSummaryVectorRecord(
          summaryInput.detail,
          summaryInput.projectPath,
          summaryInput.sessionID,
          vector,
        )
        input.repository.upsert(stored)
        await index.upsert(stored)
      } catch (error) {
        input.logFailure?.("semantic summary indexing failed", {
          id: summaryInput.detail.id,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    },

    async search(searchInput) {
      try {
        const queryVector = await input.embedQuery(searchInput.query)
        ensureDimensions(queryVector, input.dimensions)
        const candidateIDs = await index.search({
          projectPath: searchInput.projectPath,
          sessionID: searchInput.sessionID,
          queryVector,
          limit: Math.max(searchInput.limit * 4, searchInput.limit),
        })
        const hydrated = hydrateStoredSearchResults(
          input.repository,
          candidateIDs,
          searchInput.limit,
          searchInput.kinds,
        )

        if (hydrated.length > 0) {
          return {
            mode: "semantic" as const,
            results: hydrated,
          }
        }
      } catch (error) {
        input.logFailure?.("semantic memory search failed", {
          query: searchInput.query,
          error: error instanceof Error ? error.message : String(error),
        })
      }

      return {
        mode: "fallback" as const,
        results: [],
      }
    },
  }
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    return 0
  }

  let dot = 0
  let magA = 0
  let magB = 0

  for (let i = 0; i < a.length; i += 1) {
    const av = a[i] ?? 0
    const bv = b[i] ?? 0
    dot += av * bv
    magA += av * av
    magB += bv * bv
  }

  if (magA === 0 || magB === 0) {
    return 0
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

function ensureDimensions(vector: Float32Array, dimensions: number) {
  if (vector.length !== dimensions) {
    throw new Error(`Vector dimensions mismatch: expected ${dimensions}, got ${vector.length}`)
  }
}

function buildObservationEmbeddingText(record: ObservationRecord): string {
  return [
    record.content,
    record.input.summary,
    record.output.summary,
    record.retrieval.tags.join(" "),
  ]
    .filter(Boolean)
    .join("\n")
}

function buildSummaryEmbeddingText(input: {
  detail: Extract<MemoryDetailRecord, { kind: "summary" }>
  requestSummary: string
}): string {
  return [
    input.requestSummary,
    input.detail.content,
    input.detail.nextStep,
  ]
    .filter(Boolean)
    .join("\n")
}

type StoredVectorIndex = {
  upsert(record: StoredVectorMemoryRecord): Promise<void>
  search(input: VectorIndexSearchInput): Promise<string[]>
}

function createStoredExactScanVectorIndex(
  repository: SQLiteMemoryVectorRepository,
): StoredVectorIndex {
  return {
    async upsert() {},
    async search(input) {
      const records = input.sessionID
        ? repository.listForSession(input.projectPath, input.sessionID)
        : repository.listForProject(input.projectPath)

      return records
        .map((record) => ({
          id: record.id,
          similarity: cosineSimilarity(record.vector, input.queryVector),
        }))
        .filter((row) => row.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, input.limit)
        .map((row) => row.id)
    },
  }
}

function createStoredUSearchVectorIndex(
  repository: SQLiteMemoryVectorRepository,
  dimensions: number,
): StoredVectorIndex {
  type Cache = {
    index: InstanceType<typeof Index>
    idToKey: Map<string, bigint>
    keyToId: Map<bigint, string>
    nextKey: bigint
  }

  const caches = new Map<string, Cache>()

  const ensureCache = (scopeKey: string, records: StoredVectorMemoryRecord[]): Cache => {
    const existing = caches.get(scopeKey)
    if (existing) {
      return existing
    }

    const cache: Cache = {
      index: new Index(dimensions, MetricKind.Cos),
      idToKey: new Map(),
      keyToId: new Map(),
      nextKey: 1n,
    }

    for (const record of records) {
      const key = cache.nextKey
      cache.nextKey += 1n
      cache.idToKey.set(record.id, key)
      cache.keyToId.set(key, record.id)
      cache.index.add(key, record.vector)
    }

    caches.set(scopeKey, cache)
    return cache
  }

  const upsertIntoCache = (cache: Cache | undefined, record: StoredVectorMemoryRecord) => {
    if (!cache) {
      return
    }

    const existingKey = cache.idToKey.get(record.id)
    if (existingKey !== undefined) {
      cache.index.remove(existingKey)
    }

    const key = existingKey ?? cache.nextKey
    if (existingKey === undefined) {
      cache.nextKey += 1n
      cache.idToKey.set(record.id, key)
      cache.keyToId.set(key, record.id)
    }

    cache.index.add(key, record.vector)
  }

  return {
    async upsert(record) {
      upsertIntoCache(caches.get(projectScopeKey(record.projectPath)), record)
      upsertIntoCache(caches.get(sessionScopeKey(record.projectPath, record.sessionID)), record)
    },
    async search(input) {
      const scopeKey = input.sessionID
        ? sessionScopeKey(input.projectPath, input.sessionID)
        : projectScopeKey(input.projectPath)
      const records = input.sessionID
        ? repository.listForSession(input.projectPath, input.sessionID)
        : repository.listForProject(input.projectPath)
      const cache = ensureCache(scopeKey, records)
      const matches = cache.index.search(input.queryVector, input.limit, 0)

      return Array.from(matches.keys as Iterable<bigint>, (key) => cache.keyToId.get(key))
        .filter((value): value is string => Boolean(value))
    },
  }
}

function hydrateStoredSearchResults(
  repository: SQLiteMemoryVectorRepository,
  ids: string[],
  limit: number,
  kinds?: Array<MemorySearchRecord["kind"]>,
): MemorySearchRecord[] {
  if (ids.length === 0) {
    return []
  }

  const order = new Map(ids.map((id, index) => [id, index]))
  const rows = repository
    .getByIds(ids)
    .sort((a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER))

  const summaries = rows.filter((row) => row.kind === "summary")
  const coveredObservationIDs = new Set(
    summaries.flatMap((row) => row.coveredObservationIDs),
  )

  const observations = rows.filter(
    (row) => row.kind === "observation" && !coveredObservationIDs.has(row.id),
  )

  return [
    ...summaries.map((row) => row.searchRecord),
    ...observations.map((row) => row.searchRecord),
  ]
    .filter((record) => !kinds || kinds.includes(record.kind))
    .slice(0, limit)
}

function projectScopeKey(projectPath: string): string {
  return `project:${projectPath}`
}

function sessionScopeKey(projectPath: string, sessionID: string): string {
  return `session:${projectPath}:${sessionID}`
}
