import { afterEach, describe, expect, test } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { getMemoryOutputLanguage } from "../../../src/services/ai/output-language.js"

const TEMP_ROOT = "/tmp/opencode-memory-output-language-tests"

afterEach(() => {
  rmSync(TEMP_ROOT, { recursive: true, force: true })
})

describe("getMemoryOutputLanguage", () => {
  test("defaults to English when no env or config is present", () => {
    expect(getMemoryOutputLanguage({} as NodeJS.ProcessEnv)).toBe("en")
  })

  test("reads output language from opencode-memory.jsonc", () => {
    const configPath = join(TEMP_ROOT, "opencode-memory.jsonc")
    mkdirSync(TEMP_ROOT, { recursive: true })
    writeFileSync(
      configPath,
      JSON.stringify({
        outputLanguage: "zh",
      }),
    )

    expect(
      getMemoryOutputLanguage({
        OPENCODE_MEMORY_CONFIG_PATH: configPath,
      } as NodeJS.ProcessEnv),
    ).toBe("zh")
  })
})
