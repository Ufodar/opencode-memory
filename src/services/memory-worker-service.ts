import type {
  MemoryDetailRecord,
  MemoryDetailsStore,
  MemoryIdleSummaryStore,
  MemoryInjectionStore,
  MemorySearchRecord,
  MemorySearchStore,
  MemoryTimelineResult,
  MemoryTimelineStore,
} from "../memory/contracts.js"
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

type MemoryCaptureStore = {
  saveRequestAnchor(record: RequestAnchorRecord): void
  saveObservation(record: ObservationRecord): void
}

type MemoryWorkerStore = MemoryCaptureStore &
  MemoryIdleSummaryStore &
  MemoryInjectionStore &
  MemorySearchStore &
  MemoryDetailsStore &
  MemoryTimelineStore

type IdleSummaryGuard = {
  run<T>(sessionID: string, task: () => Promise<T>): Promise<{ ran: boolean; result?: T }>
}

type InjectionSelection = ReturnType<typeof defaultSelectInjectionRecords>
type IdleSummaryResult = Awaited<ReturnType<typeof defaultRunIdleSummaryPipeline>> | { status: "busy" }

export interface MemoryWorkerService {
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
  searchMemoryRecords(input: {
    sessionID?: string
    query: string
    limit: number
    scope?: "session" | "project"
  }): {
    scope: "session" | "project"
    results: MemorySearchRecord[]
  }
  getMemoryTimeline(input: {
    sessionID?: string
    anchorID?: string
    query?: string
    depthBefore: number
    depthAfter: number
    scope?: "session" | "project"
  }): {
    scope: "session" | "project"
    timeline: MemoryTimelineResult
  } | null
  getMemoryDetails(ids: string[]): MemoryDetailRecord[]
}

export function createMemoryWorkerService(input: {
  projectPath: string
  store: MemoryWorkerStore
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
}): MemoryWorkerService {
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

    searchMemoryRecords(searchInput) {
      const limit = searchInput.limit

      let scopeUsed: "session" | "project" = "project"
      let results =
        searchInput.scope === "project"
          ? input.store.searchMemoryRecords({
              projectPath: input.projectPath,
              query: searchInput.query,
              limit,
            })
          : input.store.searchMemoryRecords({
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
        results = input.store.searchMemoryRecords({
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

    getMemoryTimeline(timelineInput) {
      let scopeUsed: "session" | "project" = "project"
      let timeline =
        timelineInput.scope === "project"
          ? input.store.getMemoryTimeline({
              projectPath: input.projectPath,
              anchorID: timelineInput.anchorID,
              query: timelineInput.query,
              depthBefore: timelineInput.depthBefore,
              depthAfter: timelineInput.depthAfter,
            })
          : input.store.getMemoryTimeline({
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
        timeline = input.store.getMemoryTimeline({
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

    getMemoryDetails(ids) {
      return input.store.getMemoryDetails(ids)
    },
  }
}
