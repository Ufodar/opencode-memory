import { basename, relative } from "node:path"

import type { ObservationRecord } from "../../memory/observation/types.js"

export function buildObservationEvidenceHint(
  trace: ObservationRecord["trace"],
): string | undefined {
  const fileHint = formatFileHint(trace)
  if (fileHint) return fileHint

  const command = trace.command?.trim()
  if (command) {
    return `cmd: ${command}`
  }

  return undefined
}

export function buildObservationPrimaryFileLabel(
  trace: ObservationRecord["trace"],
): string | undefined {
  return collectNormalizedFileHints(trace)[0]
}

export function buildExpandedObservationEvidenceText(
  trace: ObservationRecord["trace"],
  currentFileLabel?: string,
): string | undefined {
  const command = trace.command?.trim()
  if (command) {
    return `cmd: ${command}`
  }

  const fileHint = formatFileHint(trace)
  if (!fileHint) return undefined

  if (currentFileLabel && fileHint === `files: ${currentFileLabel}`) {
    return undefined
  }

  return fileHint
}

function formatFileHint(trace: ObservationRecord["trace"]): string | undefined {
  const normalized = collectNormalizedFileHints(trace)
  if (normalized.length === 0) return undefined

  const preview = normalized.slice(0, 2).join(", ")
  const suffix = normalized.length > 2 ? ", ..." : ""
  return `files: ${preview}${suffix}`
}

function collectNormalizedFileHints(trace: ObservationRecord["trace"]): string[] {
  const workingDirectory = trace.workingDirectory?.trim()
  const fileCandidates = trace.filesModified?.length
    ? trace.filesModified
    : trace.filesRead?.length
      ? trace.filesRead
      : []

  if (fileCandidates.length === 0) return []

  return fileCandidates
    .map((value) => formatPathForHint(value, workingDirectory))
    .filter((value): value is string => Boolean(value))
}

function formatPathForHint(value: string, workingDirectory?: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  if (workingDirectory && trimmed.startsWith(workingDirectory)) {
    const relativePath = relative(workingDirectory, trimmed)
    return relativePath || basename(trimmed)
  }

  return basename(trimmed) || trimmed
}
