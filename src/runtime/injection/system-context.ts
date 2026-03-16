import type { ObservationRecord } from "../../memory/observation/types.js"
import type { SummaryRecord } from "../../memory/summary/types.js"
import { buildCompiledMemoryContext } from "./compiled-context.js"

export function buildSystemMemoryContext(input: {
  summaries: SummaryRecord[]
  observations: ObservationRecord[]
  latestSummaryObservations?: ObservationRecord[]
  priorAssistantMessage?: string
  scope?: "session" | "project"
  maxSummaries?: number
  maxObservations?: number
  maxChars?: number
}): string[] {
  const coveredObservationIDs = new Set(input.summaries.flatMap((summary) => summary.observationIDs))
  const summaries = input.summaries.slice(0, input.maxSummaries ?? input.summaries.length)
  const latestSummary = summaries[0]
  const latestSummaryObservations =
    input.latestSummaryObservations ??
    (latestSummary
      ? latestSummary.observationIDs
          .map((id) => input.observations.find((observation) => observation.id === id))
          .filter((observation): observation is ObservationRecord => Boolean(observation))
      : [])
  const unsummarizedObservations =
    summaries.length > 0
      ? input.observations.filter((observation) => !coveredObservationIDs.has(observation.id))
      : input.observations
  const observations = unsummarizedObservations.slice(
    0,
    input.maxObservations ?? unsummarizedObservations.length,
  )

  return buildCompiledMemoryContext({
    summaries,
    observations,
    latestSummaryObservations,
    priorAssistantMessage: input.priorAssistantMessage,
    scope: input.scope,
    maxChars: input.maxChars,
  })
}
