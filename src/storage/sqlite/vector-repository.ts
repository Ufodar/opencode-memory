import type { Database } from "bun:sqlite"
import type {
  MemoryDetailRecord,
  MemorySearchRecord,
} from "../../memory/contracts.js"
import type { ObservationRecord } from "../../memory/observation/types.js"

export type StoredVectorMemoryRecord = {
  id: string
  kind: "summary" | "observation"
  projectPath: string
  sessionID: string
  createdAt: number
  searchRecord: MemorySearchRecord
  coveredObservationIDs: string[]
  vector: Float32Array
}

type VectorRow = {
  id: string
  kind: "summary" | "observation"
  project_path: string
  session_id: string
  created_at: number
  search_record_json: string
  covered_observation_ids_json: string
  vector_blob: Uint8Array | ArrayBuffer
}

export class SQLiteMemoryVectorRepository {
  constructor(private readonly db: Database) {}

  upsert(record: StoredVectorMemoryRecord) {
    this.db
      .prepare(`
        INSERT OR REPLACE INTO memory_vectors (
          id,
          kind,
          project_path,
          session_id,
          created_at,
          search_record_json,
          covered_observation_ids_json,
          vector_blob
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        record.id,
        record.kind,
        record.projectPath,
        record.sessionID,
        record.createdAt,
        JSON.stringify(record.searchRecord),
        JSON.stringify(record.coveredObservationIDs ?? []),
        encodeVector(record.vector),
      )
  }

  getByIds(ids: string[]): StoredVectorMemoryRecord[] {
    if (ids.length === 0) {
      return []
    }

    const rows = this.db
      .prepare(`
        SELECT * FROM memory_vectors
        WHERE id IN (${ids.map(() => "?").join(", ")})
      `)
      .all(...ids) as VectorRow[]

    return rows.map(mapVectorRow)
  }

  listForProject(projectPath: string): StoredVectorMemoryRecord[] {
    const rows = this.db
      .prepare(`
        SELECT * FROM memory_vectors
        WHERE project_path = ?
        ORDER BY created_at DESC
      `)
      .all(projectPath) as VectorRow[]

    return rows.map(mapVectorRow)
  }

  listForSession(projectPath: string, sessionID: string): StoredVectorMemoryRecord[] {
    const rows = this.db
      .prepare(`
        SELECT * FROM memory_vectors
        WHERE project_path = ? AND session_id = ?
        ORDER BY created_at DESC
      `)
      .all(projectPath, sessionID) as VectorRow[]

    return rows.map(mapVectorRow)
  }
}

export function createStoredObservationVectorRecord(
  observation: ObservationRecord,
  vector: Float32Array,
): StoredVectorMemoryRecord {
  return {
    id: observation.id,
    kind: "observation",
    projectPath: observation.projectPath,
    sessionID: observation.sessionID,
    createdAt: observation.createdAt,
    searchRecord: {
      kind: "observation",
      id: observation.id,
      content: observation.content,
      createdAt: observation.createdAt,
      phase: observation.phase,
      tool: observation.tool.name,
      importance: observation.retrieval.importance,
      tags: observation.retrieval.tags,
    },
    coveredObservationIDs: [],
    vector,
  }
}

export function createStoredSummaryVectorRecord(
  summary: Extract<MemoryDetailRecord, { kind: "summary" }>,
  projectPath: string,
  sessionID: string,
  vector: Float32Array,
): StoredVectorMemoryRecord {
  return {
    id: summary.id,
    kind: "summary",
    projectPath,
    sessionID,
    createdAt: summary.createdAt,
    searchRecord: {
      kind: "summary",
      id: summary.id,
      content: summary.content,
      createdAt: summary.createdAt,
      nextStep: summary.nextStep,
    },
    coveredObservationIDs: summary.observationIDs,
    vector,
  }
}

function mapVectorRow(row: VectorRow): StoredVectorMemoryRecord {
  return {
    id: row.id,
    kind: row.kind,
    projectPath: row.project_path,
    sessionID: row.session_id,
    createdAt: row.created_at,
    searchRecord: JSON.parse(row.search_record_json) as MemorySearchRecord,
    coveredObservationIDs: parseStringArray(row.covered_observation_ids_json),
    vector: decodeVector(row.vector_blob),
  }
}

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : []
  } catch {
    return []
  }
}

function encodeVector(vector: Float32Array): Uint8Array {
  return new Uint8Array(
    vector.buffer.slice(vector.byteOffset, vector.byteOffset + vector.byteLength),
  )
}

function decodeVector(value: Uint8Array | ArrayBuffer): Float32Array {
  if (value instanceof Uint8Array) {
    return new Float32Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength))
  }

  return new Float32Array(value)
}
