import { describe, expect, test } from "bun:test"

import { createSessionCompactingHandler } from "../../src/runtime/handlers/session-compacting.js"
import { createSystemTransformHandler } from "../../src/runtime/handlers/system-transform.js"
import type { MemoryWorkerService } from "../../src/services/memory-worker-service.js"

describe("context injection handlers", () => {
  test("system transform prepends worker-built memory lines", async () => {
    const calls: Array<
      | "read"
      | {
          build: {
            sessionID?: string
            maxSummaries: number
            maxObservations: number
            maxChars: number
            priorAssistantMessage?: string
          }
        }
    > = []
    const output = { system: ["existing"], context: [] as string[] }

    const handler = createSystemTransformHandler({
      worker: {
        buildSystemContext(input) {
          calls.push({ build: input })
          return ["[MEMORY]", "Recent summaries:"]
        },
      } as Pick<MemoryWorkerService, "buildSystemContext">,
      async readPriorAssistantMessage(sessionID) {
        calls.push("read")
        expect(sessionID).toBe("ses_demo")
        return "已完成 brief.txt 检查，并准备进入 requirements.csv"
      },
      maxSummaries: 2,
      maxObservations: 3,
      maxChars: 1000,
    })

    await handler({ sessionID: "ses_demo" }, output)

    expect(calls).toEqual([
      "read",
      {
        build: {
          sessionID: "ses_demo",
          maxSummaries: 2,
          maxObservations: 3,
          maxChars: 1000,
          priorAssistantMessage: "已完成 brief.txt 检查，并准备进入 requirements.csv",
        },
      },
    ])
    expect(output.system).toEqual(["[MEMORY]", "Recent summaries:", "existing"])
  })

  test("session compacting appends worker-built memory context", async () => {
    const calls: string[] = []
    const output = { system: [] as string[], context: ["existing"] }

    const handler = createSessionCompactingHandler({
      worker: {
        buildCompactionContext() {
          calls.push("build")
          return ["[MEMORY CHECKPOINTS]", "Recent memory summaries:"]
        },
      } as Pick<MemoryWorkerService, "buildCompactionContext">,
      maxSummaries: 2,
      maxObservations: 3,
      maxChars: 1000,
    })

    await handler({ sessionID: "ses_demo" }, output)

    expect(calls).toEqual(["build"])
    expect(output.context).toEqual([
      "existing",
      "[MEMORY CHECKPOINTS]\nRecent memory summaries:",
    ])
  })
})
