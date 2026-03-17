export type MemoryOutputLanguage = "en" | "zh"

const CHINESE_LANGUAGE_VALUES = new Set(["zh", "zh-cn", "zh-hans", "cn", "chinese"])

export function getMemoryOutputLanguage(
  env: NodeJS.ProcessEnv = process.env,
): MemoryOutputLanguage {
  const raw = env.OPENCODE_MEMORY_OUTPUT_LANGUAGE?.trim().toLowerCase()
  if (!raw) return "en"
  return CHINESE_LANGUAGE_VALUES.has(raw) ? "zh" : "en"
}

export function isChineseOutputLanguage(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return getMemoryOutputLanguage(env) === "zh"
}
