import { afterEach, describe, expect, mock, test } from "bun:test"

import { isDebugLoggingEnabled, log } from "../../src/services/logger.js"

describe("memory logger", () => {
  const originalConsoleLog = console.log

  afterEach(() => {
    console.log = originalConsoleLog
  })

  test("stays silent by default", () => {
    const calls: string[] = []
    console.log = mock((message: string) => {
      calls.push(message)
    }) as typeof console.log

    log("memory worker exited", { code: 0 })

    expect(calls).toEqual([])
  })

  test("logs when OPENCODE_MEMORY_DEBUG_LOGS is enabled", () => {
    const calls: string[] = []
    console.log = mock((message: string) => {
      calls.push(message)
    }) as typeof console.log

    const original = process.env.OPENCODE_MEMORY_DEBUG_LOGS
    process.env.OPENCODE_MEMORY_DEBUG_LOGS = "true"

    try {
      log("memory worker exited", { code: 0 })
    } finally {
      if (original === undefined) {
        delete process.env.OPENCODE_MEMORY_DEBUG_LOGS
      } else {
        process.env.OPENCODE_MEMORY_DEBUG_LOGS = original
      }
    }

    expect(calls).toEqual([
      `[opencode-memory] memory worker exited {"code":0}`,
    ])
  })

  test("reports debug logging disabled by default", () => {
    expect(isDebugLoggingEnabled({})).toBe(false)
  })

  test("accepts common enabled values", () => {
    expect(isDebugLoggingEnabled({ OPENCODE_MEMORY_DEBUG_LOGS: "1" })).toBe(true)
    expect(isDebugLoggingEnabled({ OPENCODE_MEMORY_DEBUG_LOGS: "true" })).toBe(true)
    expect(isDebugLoggingEnabled({ OPENCODE_MEMORY_DEBUG_LOGS: "debug" })).toBe(true)
  })
})
