import { describe, expect, test } from "bun:test"

import { createSessionJobScheduler } from "../../src/worker/session-job-scheduler.js"

describe("createSessionJobScheduler", () => {
  test("runs jobs for the same session in order", async () => {
    const scheduler = createSessionJobScheduler()
    const events: string[] = []

    const first = scheduler.run("ses_demo", async () => {
      events.push("first:start")
      await new Promise((resolve) => setTimeout(resolve, 20))
      events.push("first:end")
      return "first"
    })

    const second = scheduler.run("ses_demo", async () => {
      events.push("second:start")
      events.push("second:end")
      return "second"
    })

    await expect(first).resolves.toBe("first")
    await expect(second).resolves.toBe("second")
    expect(events).toEqual(["first:start", "first:end", "second:start", "second:end"])
  })

  test("allows different sessions to run concurrently", async () => {
    const scheduler = createSessionJobScheduler()
    const events: string[] = []

    const first = scheduler.run("ses_a", async () => {
      events.push("a:start")
      await new Promise((resolve) => setTimeout(resolve, 20))
      events.push("a:end")
      return "a"
    })

    const second = scheduler.run("ses_b", async () => {
      events.push("b:start")
      events.push("b:end")
      return "b"
    })

    await Promise.all([first, second])
    expect(events[0]).toBe("a:start")
    expect(events).toContain("b:start")
    expect(events.indexOf("b:start")).toBeLessThan(events.indexOf("a:end"))
  })

  test("continues with the next job after a failure", async () => {
    const scheduler = createSessionJobScheduler()
    const events: string[] = []

    const first = scheduler.run("ses_demo", async () => {
      events.push("first:start")
      throw new Error("boom")
    })

    const second = scheduler.run("ses_demo", async () => {
      events.push("second:start")
      return "ok"
    })

    await expect(first).rejects.toThrow("boom")
    await expect(second).resolves.toBe("ok")
    expect(events).toEqual(["first:start", "second:start"])
  })
})
