import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { Database } from "bun:sqlite"

import type { ObservationRecord } from "../../src/memory/observation/types.js"
import { SQLiteMemoryStore } from "../../src/storage/sqlite/memory-store.js"

describe("SQLiteMemoryStore", () => {
  let tempDir: string
  let store: SQLiteMemoryStore

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "opencode-memory-"))
    store = new SQLiteMemoryStore(join(tempDir, "memory.sqlite"))
  })

  afterEach(() => {
    store.close()
    rmSync(tempDir, { recursive: true, force: true })
  })

  test("persists and lists recent observations by project path", () => {
    const observation = buildObservation({
      id: "obs_1",
      projectPath: "/workspace/demo",
      content: "读取第3章资格条件并发现3条硬约束",
    })

    store.saveObservation(observation)

    const results = store.listRecentObservations({
      projectPath: "/workspace/demo",
      limit: 5,
    })

    expect(results).toHaveLength(1)
    expect(results[0]?.id).toBe("obs_1")
    expect(results[0]?.content).toContain("硬约束")
  })

  test("searches stored observations by content", () => {
    store.saveObservation(
      buildObservation({
        id: "obs_requirements",
        projectPath: "/workspace/demo",
        content: "在招标文件第3章发现资格条件和业绩要求",
      }),
    )
    store.saveObservation(
      buildObservation({
        id: "obs_write",
        projectPath: "/workspace/demo",
        content: "写入初版目录到投标文件草稿",
      }),
    )

    const results = store.searchObservations({
      projectPath: "/workspace/demo",
      query: "资格条件",
      limit: 10,
    })

    expect(results.map((item) => item.id)).toEqual(["obs_requirements"])
  })

  test("loads exact observations by ids", () => {
    store.saveObservation(
      buildObservation({
        id: "obs_a",
        projectPath: "/workspace/demo",
        content: "读取 requirements.csv 并发现缺少一列 evidence_source",
      }),
    )
    store.saveObservation(
      buildObservation({
        id: "obs_b",
        projectPath: "/workspace/demo",
        content: "完成 qc-report.md 初稿",
      }),
    )

    const results = store.getObservationsByIds(["obs_b", "obs_a"])

    expect(results).toHaveLength(2)
    expect(results.map((item) => item.id)).toEqual(["obs_a", "obs_b"])
  })

  test("persists observation phase", () => {
    store.saveObservation(
      buildObservation({
        id: "obs_verify",
        projectPath: "/workspace/demo",
        content: "运行 bun test，全部通过",
        phase: "verification",
      }),
    )

    const results = store.listRecentObservations({
      projectPath: "/workspace/demo",
      limit: 5,
    })

    expect(results[0]?.phase).toBe("verification")
  })

  test("persists enriched observation trace fields", () => {
    store.saveObservation(
      buildObservation({
        id: "obs_trace",
        projectPath: "/workspace/demo",
        content: "读取 requirements.md 并写入 questions.md",
        trace: {
          workingDirectory: "/workspace/demo",
          filePaths: ["/workspace/demo/requirements.md", "/workspace/demo/questions.md"],
          filesRead: ["/workspace/demo/requirements.md"],
          filesModified: ["/workspace/demo/questions.md"],
          command: "bun test",
        },
      }),
    )

    const [result] = store.listRecentObservations({
      projectPath: "/workspace/demo",
      limit: 5,
    })

    expect(result?.trace).toEqual({
      workingDirectory: "/workspace/demo",
      filePaths: ["/workspace/demo/requirements.md", "/workspace/demo/questions.md"],
      filesRead: ["/workspace/demo/requirements.md"],
      filesModified: ["/workspace/demo/questions.md"],
      command: "bun test",
    })
  })

  test("cleans legacy internal-tool rows and normalizes legacy read payloads on init", () => {
    const dbPath = join(tempDir, "memory.sqlite")
    store.close()

    const rawDb = new Database(dbPath)

    rawDb
      .prepare(`
        INSERT INTO observations (
          id, content, session_id, project_path, prompt_id, created_at,
          tool_name, call_id, tool_title, tool_status,
          input_summary, output_summary, importance, tags_json, trace_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        "obs_internal",
        "{\"success\":true,\"count\":0,\"scope\":\"session\",\"results\":[]}",
        "ses_demo",
        "/workspace/demo",
        null,
        100,
        "memory_search",
        "call_internal",
        "",
        "success",
        "{\"query\":\"README\"}",
        "{\"success\":true}",
        0.6,
        "[\"memory_search\",\"observation\"]",
        "{}",
      )

    rawDb
      .prepare(`
        INSERT INTO observations (
          id, content, session_id, project_path, prompt_id, created_at,
          tool_name, call_id, tool_title, tool_status,
          input_summary, output_summary, importance, tags_json, trace_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        "obs_legacy_read",
        "<path>/workspace/demo/README.md</path>\n<type>file</type>\n<content>1: # Demo\n2: body</content>",
        "ses_demo",
        "/workspace/demo",
        null,
        200,
        "read",
        "call_read",
        "workspace/demo/README.md",
        "success",
        "{\"filePath\":\"/workspace/demo/README.md\"}",
        "<path>/workspace/demo/README.md</path>\n<content>body</content>",
        0.6,
        "[\"read\",\"observation\"]",
        "{}",
      )

    rawDb.close()

    store = new SQLiteMemoryStore(dbPath)

    const observations = store.listRecentObservations({
      projectPath: "/workspace/demo",
      limit: 10,
    })

    expect(observations.map((item) => item.id)).toEqual(["obs_legacy_read"])
    expect(observations[0]?.content).toBe("read: workspace/demo/README.md")
    expect(observations[0]?.output.summary).toBe("read: workspace/demo/README.md")
  })
})

function buildObservation(input: {
  id: string
  projectPath: string
  content: string
  phase?: ObservationRecord["phase"]
  trace?: ObservationRecord["trace"]
}): ObservationRecord {
  return {
    id: input.id,
    content: input.content,
    sessionID: "ses_demo",
    projectPath: input.projectPath,
    createdAt: 1_700_000_000_000,
    phase: input.phase,
    tool: {
      name: "read",
      callID: `call_${input.id}`,
      title: "读取文件",
      status: "success",
    },
    input: {
      summary: "读取文件",
    },
    output: {
      summary: input.content,
    },
    retrieval: {
      importance: 0.8,
      tags: ["read", "observation"],
    },
    trace: input.trace ?? {
      filePaths: ["/workspace/demo/source.md"],
    },
  }
}
