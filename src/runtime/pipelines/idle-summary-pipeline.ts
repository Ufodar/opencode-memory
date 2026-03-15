import type { MemoryIdleSummaryStore } from "../../memory/contracts.js"
import type { ObservationRecord } from "../../memory/observation/types.js"
import type { RequestAnchorRecord } from "../../memory/request/types.js"
import { buildSummaryRecord, selectCheckpointObservations } from "../../memory/summary/aggregate.js"
import type { ModelSummaryResult } from "../../services/ai/model-summary.js"

export async function runIdleSummaryPipeline(input: {
  projectPath: string
  sessionID: string
  store: MemoryIdleSummaryStore
  generateModelSummary?: (input: {
    request: RequestAnchorRecord
    observations: ObservationRecord[]
  }) => Promise<ModelSummaryResult | null>
}): Promise<
  | { status: "missing-request" }
  | { status: "no-op"; requestAnchorID?: string }
  | {
      status: "summarized"
      requestAnchorID: string
      summaryID: string
      checkpointObservationAt: number
    }
> {
  const requestAnchor = input.store.getLatestRequestAnchor({
    projectPath: input.projectPath,
    sessionID: input.sessionID,
  })

  if (!requestAnchor) {
    return { status: "missing-request" }
  }

  const observations = input.store.listObservationsForRequestWindow({
    projectPath: input.projectPath,
    sessionID: input.sessionID,
    afterCreatedAtExclusive:
      requestAnchor.lastCheckpointObservationAt ?? requestAnchor.createdAt - 1,
  })

  const checkpointObservations = selectCheckpointObservations({ observations })
  if (checkpointObservations.length === 0) {
    return { status: "no-op", requestAnchorID: requestAnchor.id }
  }

  const summary = await buildSummaryRecord({
    request: requestAnchor,
    observations: checkpointObservations,
    generateModelSummary: input.generateModelSummary,
  })

  const lastCheckpointObservationAt = Math.max(
    ...checkpointObservations.map((item) => item.createdAt),
  )

  input.store.saveSummary(summary)
  input.store.updateRequestAnchorCheckpoint({
    id: requestAnchor.id,
    summarizedAt: Date.now(),
    lastCheckpointObservationAt,
  })

  return {
    status: "summarized",
    requestAnchorID: requestAnchor.id,
    summaryID: summary.id,
    checkpointObservationAt: lastCheckpointObservationAt,
  }
}
