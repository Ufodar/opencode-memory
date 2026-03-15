import type {
  ContinuityDetailRecord,
  ContinuityDetailsStore,
  ContinuityIdleSummaryStore,
  ContinuityInjectionStore,
  ContinuitySearchRecord,
  ContinuitySearchStore,
  ContinuityTimelineResult,
  ContinuityTimelineStore,
} from "../continuity/contracts.js"
import type { ObservationRecord } from "../memory/observation/types.js"
import type { RequestAnchorRecord } from "../memory/request/types.js"
import type { SummaryRecord } from "../memory/summary/types.js"
import { captureRequestAnchor as defaultCaptureRequestAnchor } from "../runtime/hooks/chat-message.js"
import { captureToolObservation as defaultCaptureToolObservation } from "../runtime/hooks/tool-after.js"
import { selectInjectionRecords as defaultSelectInjectionRecords } from "../runtime/injection/select-context.js"
import { runIdleSummaryPipeline as defaultRunIdleSummaryPipeline } from "../runtime/pipelines/idle-summary-pipeline.js"
import type { ModelSummaryResult } from "./ai/model-summary.js"

type CaptureRequestAnchor = typeof defaultCaptureRequestAnchor
type CaptureToolObservation = typeof defaultCaptureToolObservation
type SelectInjectionRecords = typeof defaultSelectInjectionRecords
type IdleSummaryPipeline = typeof defaultRunIdleSummaryPipeline

type ContinuityCaptureStore = {
  saveRequestAnchor(record: RequestAnchorRecord): void
  saveObservation(record: ObservationRecord): void
}

type ContinuityWorkerStore = ContinuityCaptureStore &
  ContinuityIdleSummaryStore &
  ContinuityInjectionStore &
  ContinuitySearchStore &
  ContinuityDetailsStore &
  ContinuityTimelineStore

type IdleSummaryGuard = {
  run<T>(sessionID: string, task: () => Promise<T>): Promise<{ ran: boolean; result?: T }>
}

type InjectionSelection = ReturnType<typeof defaultSelectInjectionRecords>
type IdleSummaryResult = Awaited<ReturnType<typeof defaultRunIdleSummaryPipeline>> | { status: "busy" }

export interface ContinuityWorkerService {
  captureRequestAnchorFromMessage(input: {
    sessionID: string
    messageID?: string
    text: string
  }): RequestAnchorRecord | null
  captureObservationFromToolCall(
    toolInput: {
      tool: string
      sessionID: string
      callID: string
      args: unknown
    },
    output: {
      title: string
      output: string
      metadata: Record<string, unknown>
    },
  ): ObservationRecord | null
  handleSessionIdle(sessionID: string): Promise<IdleSummaryResult>
  selectInjectionRecords(input: {
    sessionID?: string
    maxSummaries: number
    maxObservations: number
  }): InjectionSelection
  searchContinuityRecords(input: {
    sessionID?: string
    query: string
    limit: number
    scope?: "session" | "project"
  }): {
    scope: "session" | "project"
    results: ContinuitySearchRecord[]
  }
  getContinuityTimeline(input: {
    sessionID?: string
    anchorID?: string
    query?: string
    depthBefore: number
    depthAfter: number
    scope?: "session" | "project"
  }): {
    scope: "session" | "project"
    timeline: ContinuityTimelineResult
  } | null
  getContinuityDetails(ids: string[]): ContinuityDetailRecord[]
}

export function createContinuityWorkerService(input: {
  projectPath: string
  store: ContinuityWorkerStore
  idleSummaryGuard: IdleSummaryGuard
  saveRequestAnchor?: (record: RequestAnchorRecord) => void
  saveObservation?: (record: ObservationRecord) => void
  generateModelSummary?: (input: {
    request: RequestAnchorRecord
    observations: ObservationRecord[]
  }) => Promise<ModelSummaryResult | null>
  captureRequestAnchor?: CaptureRequestAnchor
  captureToolObservation?: CaptureToolObservation
  runIdleSummaryPipeline?: IdleSummaryPipeline
  selectInjectionRecords?: SelectInjectionRecords
}): ContinuityWorkerService {
  const captureRequestAnchor = input.captureRequestAnchor ?? defaultCaptureRequestAnchor
  const captureToolObservation = input.captureToolObservation ?? defaultCaptureToolObservation
  const runIdleSummaryPipeline = input.runIdleSummaryPipeline ?? defaultRunIdleSummaryPipeline
  const selectInjectionRecords = input.selectInjectionRecords ?? defaultSelectInjectionRecords
  const saveRequestAnchor = input.saveRequestAnchor ?? ((record: RequestAnchorRecord) => input.store.saveRequestAnchor(record))
  const saveObservation = input.saveObservation ?? ((record: ObservationRecord) => input.store.saveObservation(record))

  return {
    captureRequestAnchorFromMessage(message) {
      const requestAnchor = captureRequestAnchor({
        sessionID: message.sessionID,
        messageID: message.messageID,
        projectPath: input.projectPath,
        text: message.text,
      })

      if (!requestAnchor) {
        return null
      }

      saveRequestAnchor(requestAnchor)
      return requestAnchor
    },

    captureObservationFromToolCall(toolInput, output) {
      const observation = captureToolObservation(
        {
          ...toolInput,
          projectPath: input.projectPath,
        },
        output,
      )

      if (!observation) {
        return null
      }

      saveObservation(observation)
      return observation
    },

    async handleSessionIdle(sessionID) {
      const guardResult = await input.idleSummaryGuard.run(sessionID, async () => {
        return runIdleSummaryPipeline({
          projectPath: input.projectPath,
          sessionID,
          store: input.store,
          generateModelSummary: input.generateModelSummary,
        })
      })

      if (!guardResult.ran) {
        return { status: "busy" }
      }

      return guardResult.result ?? { status: "missing-request" }
    },

    selectInjectionRecords(selectionInput) {
      return selectInjectionRecords({
        store: input.store,
        projectPath: input.projectPath,
        sessionID: selectionInput.sessionID,
        maxSummaries: selectionInput.maxSummaries,
        maxObservations: selectionInput.maxObservations,
      })
    },

    searchContinuityRecords(searchInput) {
      const limit = searchInput.limit

      let scopeUsed: "session" | "project" = "project"
      let results =
        searchInput.scope === "project"
          ? input.store.searchContinuityRecords({
              projectPath: input.projectPath,
              query: searchInput.query,
              limit,
            })
          : input.store.searchContinuityRecords({
              projectPath: input.projectPath,
              sessionID: searchInput.sessionID,
              query: searchInput.query,
              limit,
            })

      if (searchInput.scope === "project") {
        scopeUsed = "project"
      } else if (results.length > 0 || searchInput.scope === "session") {
        scopeUsed = "session"
      } else {
        results = input.store.searchContinuityRecords({
          projectPath: input.projectPath,
          query: searchInput.query,
          limit,
        })
        scopeUsed = "project"
      }

      return {
        scope: scopeUsed,
        results,
      }
    },

    getContinuityTimeline(timelineInput) {
      let scopeUsed: "session" | "project" = "project"
      let timeline =
        timelineInput.scope === "project"
          ? input.store.getContinuityTimeline({
              projectPath: input.projectPath,
              anchorID: timelineInput.anchorID,
              query: timelineInput.query,
              depthBefore: timelineInput.depthBefore,
              depthAfter: timelineInput.depthAfter,
            })
          : input.store.getContinuityTimeline({
              projectPath: input.projectPath,
              sessionID: timelineInput.sessionID,
              anchorID: timelineInput.anchorID,
              query: timelineInput.query,
              depthBefore: timelineInput.depthBefore,
              depthAfter: timelineInput.depthAfter,
            })

      if (timelineInput.scope === "project") {
        scopeUsed = "project"
      } else if (timeline || timelineInput.scope === "session") {
        scopeUsed = "session"
      } else {
        timeline = input.store.getContinuityTimeline({
          projectPath: input.projectPath,
          anchorID: timelineInput.anchorID,
          query: timelineInput.query,
          depthBefore: timelineInput.depthBefore,
          depthAfter: timelineInput.depthAfter,
        })
        scopeUsed = "project"
      }

      if (!timeline) {
        return null
      }

      return {
        scope: scopeUsed,
        timeline,
      }
    },

    getContinuityDetails(ids) {
      return input.store.getContinuityDetails(ids)
    },
  }
}
