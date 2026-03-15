import { readFileSync } from "node:fs"

let cachedVersion: string | undefined

export function getOpencodeMemoryVersion(): string {
  if (cachedVersion) {
    return cachedVersion
  }

  const packageJsonPath = new URL("../package.json", import.meta.url)
  const raw = readFileSync(packageJsonPath, "utf8")
  const parsed = JSON.parse(raw) as { version?: string }

  if (!parsed.version) {
    throw new Error("Failed to read opencode-memory version from package.json")
  }

  cachedVersion = parsed.version
  return cachedVersion
}
