import { describe, expect, test } from "bun:test"

import type { ContinuityIdleSummaryStore } from "../../src/continuity/contracts.js"
import { createSessionIdleEventHandler } from "../../src/runtime/handlers/session-idle-event.js"

describe("createSessionIdleEventHandler", () => {
  test("runs the idle summary pipeline through the session guard", async () => {
    const calls: string[] = []

    const handler = createSessionIdleEventHandler({
      projectPath: "/workspace/demo",
      store: {} as ContinuityIdleSummaryStore,
      generateModelSummary: async () => null,
      idleSummaryGuard: {
        async run(sessionID, task) {
          calls.push(`guard:${sessionID}`)
          await task()
          return { ran: true }
        },
      },
      runIdleSummaryPipeline: async (input) => {
        calls.push(`pipeline:${input.sessionID}`)
        return { status: "missing-request" }
      },
      log: (message) => {
        calls.push(`log:${message}`)
      },
    })

    await handler({
      event: {
        type: "session.idle",
        properties: { sessionID: "ses_demo" },
      },
    })

    expect(calls).toEqual([
      "guard:ses_demo",
      "pipeline:ses_demo",
      "log:session.idle without pending request anchor",
    ])
  })

  test("skips pipeline execution when the guard rejects a reentry", async () => {
    const calls: string[] = []

    const handler = createSessionIdleEventHandler({
      projectPath: "/workspace/demo",
      store: {} as ContinuityIdleSummaryStore,
      idleSummaryGuard: {
        async run(sessionID) {
          calls.push(`guard:${sessionID}`)
          return { ran: false }
        },
      },
      runIdleSummaryPipeline: async () => {
        calls.push("pipeline")
        return { status: "missing-request" }
      },
      log: (message) => {
        calls.push(`log:${message}`)
      },
    })

    await handler({
      event: {
        type: "session.idle",
        properties: { sessionID: "ses_demo" },
      },
    })

    expect(calls).toEqual([
      "guard:ses_demo",
      "log:session.idle skipped because summary is already in flight",
    ])
  })
})
