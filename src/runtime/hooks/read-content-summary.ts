export function buildReadSemanticSummary(input: {
  filePath?: string
  output: string
  max?: number
}): string | undefined {
  const content = extractTaggedContent(input.output, "content")
  if (!content) return undefined

  const fragments = extractFragments(content)
  if (fragments.length === 0) return undefined

  const label = input.filePath ? fileLabel(input.filePath) : undefined
  const value = label ? `${label}：${fragments.join("；")}` : fragments.join("；")

  return truncate(value, input.max ?? 220)
}

function extractTaggedContent(output: string, tag: string): string | undefined {
  const pattern = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "u")
  return pattern.exec(output)?.[1]?.trim()
}

function extractFragments(content: string): string[] {
  const rawLines = content
    .split(/\r?\n/u)
    .map((line) => stripLineNumber(line).trim())
    .filter((line) => line && !looksLikeFileFooter(line))

  const fragments: string[] = []

  for (let index = 0; index < rawLines.length; index += 1) {
    const line = rawLines[index]!

    if (endsWithHeadingPunctuation(line)) {
      const bulletItems: string[] = []
      let cursor = index + 1
      while (cursor < rawLines.length && looksLikeListItem(rawLines[cursor]!)) {
        const cleaned = normalizeFragmentText(stripListMarker(rawLines[cursor]!))
        if (cleaned) bulletItems.push(cleaned)
        cursor += 1
      }

      if (bulletItems.length > 0) {
        fragments.push(normalizeFragmentText(`${stripTrailingHeadingPunctuation(line)}：${bulletItems.slice(0, 2).join("；")}`))
        index = cursor - 1
        continue
      }
    }

    const normalized = normalizeFragmentText(stripListMarker(stripMarkdownHeading(line)))
    if (normalized) fragments.push(normalized)
  }

  return dedupeFragments(fragments).slice(0, 3)
}

function stripLineNumber(value: string): string {
  return value.replace(/^\s*\d+:\s*/u, "")
}

function looksLikeFileFooter(value: string): boolean {
  return /^\(End of file/i.test(value)
}

function looksLikeListItem(value: string): boolean {
  return /^(\d+\.\s+|[-*]\s+|- \[[ xX]\]\s+)/u.test(value)
}

function stripListMarker(value: string): string {
  return value
    .replace(/^\d+\.\s+/u, "")
    .replace(/^- \[[ xX]\]\s+/u, "")
    .replace(/^[-*]\s+/u, "")
}

function stripMarkdownHeading(value: string): string {
  return value.replace(/^#+\s*/u, "")
}

function endsWithHeadingPunctuation(value: string): boolean {
  return /[：:]$/u.test(value)
}

function stripTrailingHeadingPunctuation(value: string): string {
  return value.replace(/[：:]$/u, "").trim()
}

function normalizeFragmentText(value: string): string {
  return value.replace(/\s+/gu, " ").trim()
}

function dedupeFragments(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    if (!value || seen.has(value)) continue
    seen.add(value)
    result.push(value)
  }

  return result
}

function fileLabel(value: string): string {
  const normalized = value.trim()
  const segments = normalized.split("/").filter(Boolean)
  return segments[segments.length - 1] ?? normalized
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 3)}...`
}
