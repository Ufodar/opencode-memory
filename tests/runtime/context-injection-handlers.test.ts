import { describe, expect, test } from "bun:test"

import { createSessionCompactingHandler } from "../../src/runtime/handlers/session-compacting.js"
import { createSystemTransformHandler } from "../../src/runtime/handlers/system-transform.js"
import type { MemoryWorkerService } from "../../src/services/memory-worker-service.js"

describe("context injection handlers", () => {
  test("system transform prepends built memory lines", async () => {
    const calls: string[] = []
    const output = { system: ["existing"], context: [] as string[] }

    const handler = createSystemTransformHandler({
      worker: {
        selectInjectionRecords() {
          calls.push("select")
          return {
            scope: "session",
            summaries: [],
            observations: [],
          }
        },
      } as Pick<MemoryWorkerService, "selectInjectionRecords">,
      maxSummaries: 2,
      maxObservations: 3,
      maxChars: 1000,
      buildSystemMemoryContext() {
        calls.push("build")
        return ["[CONTINUITY]", "Recent summaries:"]
      },
    })

    await handler({ sessionID: "ses_demo" }, output)

    expect(calls).toEqual(["select", "build"])
    expect(output.system).toEqual(["[CONTINUITY]", "Recent summaries:", "existing"])
  })

  test("session compacting appends joined memory context", async () => {
    const calls: string[] = []
    const output = { system: [] as string[], context: ["existing"] }

    const handler = createSessionCompactingHandler({
      worker: {
        selectInjectionRecords() {
          calls.push("select")
          return {
            scope: "project",
            summaries: [],
            observations: [],
          }
        },
      } as Pick<MemoryWorkerService, "selectInjectionRecords">,
      maxSummaries: 2,
      maxObservations: 3,
      maxChars: 1000,
      buildCompactionMemoryContext() {
        calls.push("build")
        return ["[CONTINUITY CHECKPOINTS]", "Recent memory summaries:"]
      },
    })

    await handler({ sessionID: "ses_demo" }, output)

    expect(calls).toEqual(["select", "build"])
    expect(output.context).toEqual([
      "existing",
      "[CONTINUITY CHECKPOINTS]\nRecent memory summaries:",
    ])
  })
})
