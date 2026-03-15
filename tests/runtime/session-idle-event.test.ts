import { describe, expect, test } from "bun:test"

import { createSessionIdleEventHandler } from "../../src/runtime/handlers/session-idle-event.js"
import type { ContinuityWorkerService } from "../../src/services/continuity-worker-service.js"

describe("createSessionIdleEventHandler", () => {
  test("delegates session.idle handling to the continuity worker", async () => {
    const calls: string[] = []

    const handler = createSessionIdleEventHandler({
      worker: {
        async handleSessionIdle(sessionID) {
          calls.push(`idle:${sessionID}`)
          return { status: "missing-request" }
        },
      } as Pick<ContinuityWorkerService, "handleSessionIdle">,
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
      "idle:ses_demo",
      "log:session.idle without pending request anchor",
    ])
  })

  test("logs busy when the continuity worker rejects a reentry", async () => {
    const calls: string[] = []

    const handler = createSessionIdleEventHandler({
      worker: {
        async handleSessionIdle(sessionID) {
          calls.push(`idle:${sessionID}`)
          return { status: "busy" }
        },
      } as Pick<ContinuityWorkerService, "handleSessionIdle">,
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
      "idle:ses_demo",
      "log:session.idle skipped because summary is already in flight",
    ])
  })
})
