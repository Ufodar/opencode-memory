import { describe, expect, test } from "bun:test"

import { createSessionReentryGuard } from "../../src/runtime/hooks/idle-summary-guard.js"

describe("createSessionReentryGuard", () => {
  test("allows only one in-flight task per session", async () => {
    const guard = createSessionReentryGuard()
    let runs = 0

    const first = guard.run("ses_demo", async () => {
      runs += 1
      await new Promise((resolve) => setTimeout(resolve, 20))
      return "first"
    })

    const second = guard.run("ses_demo", async () => {
      runs += 1
      return "second"
    })

    await expect(first).resolves.toEqual({ ran: true, result: "first" })
    await expect(second).resolves.toEqual({ ran: false })
    expect(runs).toBe(1)
  })

  test("does not block different sessions", async () => {
    const guard = createSessionReentryGuard()

    const [first, second] = await Promise.all([
      guard.run("ses_a", async () => "A"),
      guard.run("ses_b", async () => "B"),
    ])

    expect(first).toEqual({ ran: true, result: "A" })
    expect(second).toEqual({ ran: true, result: "B" })
  })
})
