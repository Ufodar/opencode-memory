import type {
  MemoryDetailRecord,
  MemoryDetailsStore,
  MemoryQueueFailedJob,
  MemoryQueueProcessingJob,
  MemoryQueueStore,
  MemoryIdleSummaryStore,
  MemoryInjectionStore,
  MemorySearchRecord,
  MemorySearchStore,
  MemoryTimelineResult,
  MemoryTimelineStore,
  MemoryWorkerStatusSnapshot,
} from "../memory/contracts.js"
import type { ObservationRecord } from "../memory/observation/types.js"
import type { RequestAnchorRecord } from "../memory/request/types.js"
import type { SummaryRecord } from "../memory/summary/types.js"
import { captureRequestAnchor as defaultCaptureRequestAnchor } from "../runtime/hooks/chat-message.js"
import { captureToolObservation as defaultCaptureToolObservation } from "../runtime/hooks/tool-after.js"
import { buildCompactionMemoryContext as defaultBuildCompactionMemoryContext } from "../runtime/injection/compaction-context.js"
import { buildSystemMemoryContext as defaultBuildSystemMemoryContext } from "../runtime/injection/system-context.js"
import { selectInjectionRecords as defaultSelectInjectionRecords } from "../runtime/injection/select-context.js"
import { runIdleSummaryPipeline as defaultRunIdleSummaryPipeline } from "../runtime/pipelines/idle-summary-pipeline.js"
import type { ModelObservationResult } from "./ai/model-observation.js"
import type { ModelSummaryResult } from "./ai/model-summary.js"
import type { IdleSummaryResponse, SessionCompleteResponse } from "../worker/protocol.js"

type CaptureRequestAnchor = typeof defaultCaptureRequestAnchor
type CaptureToolObservation = typeof defaultCaptureToolObservation
type SelectInjectionRecords = typeof defaultSelectInjectionRecords
type IdleSummaryPipeline = typeof defaultRunIdleSummaryPipeline
type BuildSystemMemoryContext = typeof defaultBuildSystemMemoryContext
type BuildCompactionMemoryContext = typeof defaultBuildCompactionMemoryContext

type MemoryCaptureStore = {
  saveRequestAnchor(record: RequestAnchorRecord): void
  saveObservation(record: ObservationRecord): void
}

type MemoryWorkerStore = MemoryCaptureStore &
  MemoryIdleSummaryStore &
  MemoryInjectionStore &
  MemoryQueueStore &
  MemorySearchStore &
  MemoryDetailsStore &
  MemoryTimelineStore

type IdleSummaryGuard = {
  run<T>(sessionID: string, task: () => Promise<T>): Promise<{ ran: boolean; result?: T }>
}

type InjectionSelection = ReturnType<typeof defaultSelectInjectionRecords>
export type Awaitable<T> = T | Promise<T>

export interface MemoryWorkerService {
  captureRequestAnchorFromMessage(input: {
    sessionID: string
    messageID?: string
    text: string
  }): Awaitable<RequestAnchorRecord | null>
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
  ): Awaitable<ObservationRecord | null>
  handleSessionIdle(sessionID: string): Awaitable<IdleSummaryResponse>
  completeSession(sessionID: string): Awaitable<SessionCompleteResponse>
  selectInjectionRecords(input: {
    sessionID?: string
    maxSummaries: number
    maxObservations: number
  }): Awaitable<InjectionSelection>
  buildSystemContext(input: {
    sessionID?: string
    maxSummaries: number
    maxObservations: number
    maxChars: number
    priorAssistantMessage?: string
  }): Awaitable<string[]>
  buildCompactionContext(input: {
    sessionID?: string
    maxSummaries: number
    maxObservations: number
    maxChars: number
  }): Awaitable<string[]>
  searchMemoryRecords(input: {
    sessionID?: string
    query: string
    limit: number
    scope?: "session" | "project"
  }): {
    scope: "session" | "project"
    results: MemorySearchRecord[]
  } | Promise<{
    scope: "session" | "project"
    results: MemorySearchRecord[]
  }>
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
  } | null | Promise<{
    scope: "session" | "project"
    timeline: MemoryTimelineResult
  } | null>
  getMemoryDetails(ids: string[]): Awaitable<MemoryDetailRecord[]>
  searchSemanticMemoryRecords?(input: {
    projectPath: string
    sessionID?: string
    query: string
    limit: number
  }): Promise<MemorySearchRecord[]>
  getQueueStatus(input: {
    limit: number
  }): Awaitable<{
    isProcessing: boolean
    queueDepth: number
    counts: {
      pending: number
      processing: number
      failed: number
    }
    workerStatus: MemoryWorkerStatusSnapshot | null
    processingJobs: MemoryQueueProcessingJob[]
    failedJobs: MemoryQueueFailedJob[]
  }>
  getLiveSnapshot(input: {
    sessionID?: string
    maxSummaries: number
    maxObservations: number
    queueLimit: number
  }): Awaitable<{
    scope: "session" | "project"
    summaries: SummaryRecord[]
    observations: ObservationRecord[]
    queue: {
      isProcessing: boolean
      queueDepth: number
      counts: {
        pending: number
        processing: number
        failed: number
      }
      workerStatus: MemoryWorkerStatusSnapshot | null
      processingJobs: MemoryQueueProcessingJob[]
      failedJobs: MemoryQueueFailedJob[]
    }
  }>
  retryQueueJob(jobID: number): Awaitable<{
    retried: boolean
    jobID: number
  }>
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
  generateModelObservation?: (input: {
    toolInput: {
      tool: string
      sessionID: string
      callID: string
      args: unknown
    }
    output: {
      title: string
      output: string
      metadata: Record<string, unknown>
    }
    observation: ObservationRecord
  }) => Promise<ModelObservationResult | null>
  captureRequestAnchor?: CaptureRequestAnchor
  captureToolObservation?: CaptureToolObservation
  runIdleSummaryPipeline?: IdleSummaryPipeline
  selectInjectionRecords?: SelectInjectionRecords
  buildSystemMemoryContext?: BuildSystemMemoryContext
  buildCompactionMemoryContext?: BuildCompactionMemoryContext
  readWorkerStatus?: () => MemoryWorkerStatusSnapshot | null
  onObservationCaptured?: (record: ObservationRecord) => Awaitable<void>
  onSummaryCaptured?: (input: {
    detail: Extract<MemoryDetailRecord, { kind: "summary" }>
    summary: SummaryRecord
  }) => Awaitable<void>
  searchSemanticMemoryRecords?: (input: {
    projectPath: string
    sessionID?: string
    query: string
    limit: number
  }) => Promise<MemorySearchRecord[]>
}): MemoryWorkerService {
  const captureRequestAnchor = input.captureRequestAnchor ?? defaultCaptureRequestAnchor
  const captureToolObservation = input.captureToolObservation ?? defaultCaptureToolObservation
  const runIdleSummaryPipeline = input.runIdleSummaryPipeline ?? defaultRunIdleSummaryPipeline
  const selectInjectionRecords = input.selectInjectionRecords ?? defaultSelectInjectionRecords
  const buildSystemMemoryContext = input.buildSystemMemoryContext ?? defaultBuildSystemMemoryContext
  const buildCompactionMemoryContext =
    input.buildCompactionMemoryContext ?? defaultBuildCompactionMemoryContext
  const saveRequestAnchor = input.saveRequestAnchor ?? ((record: RequestAnchorRecord) => input.store.saveRequestAnchor(record))
  const saveObservation = input.saveObservation ?? ((record: ObservationRecord) => input.store.saveObservation(record))

  const readCurrentWorkerStatus = () => {
    const snapshot = input.readWorkerStatus?.()
    if (snapshot) {
      return {
        ...snapshot,
        activeSessionIDs: snapshot.activeSessionIDs ?? [],
      }
    }

    const counts = input.store.getQueueStats()
    return {
      updatedAt: Date.now(),
      isProcessing: counts.pending > 0 || counts.processing > 0,
      queueDepth: counts.pending + counts.processing,
      counts,
      activeSessionIDs: [],
      lastEvent: {
        type: "worker-started" as const,
      },
    }
  }

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

    async captureObservationFromToolCall(toolInput, output) {
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

      const refinedObservation = await applyModelObservationRefinement(
        observation,
        input.generateModelObservation
          ? await input.generateModelObservation({
              toolInput,
              output,
              observation,
            })
          : null,
      )

      saveObservation(refinedObservation)
      await input.onObservationCaptured?.(refinedObservation)
      return refinedObservation
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

      const result = guardResult.result ?? { status: "missing-request" }

      if (result.status === "summarized") {
        const summaryDetail = input
          .store
          .getMemoryDetails([result.summaryID])
          .find((record): record is Extract<MemoryDetailRecord, { kind: "summary" }> => record.kind === "summary")

        const summaryRecord =
          "listRecentSummaries" in input.store
            ? input.store.listRecentSummaries({
                projectPath: input.projectPath,
                sessionID,
                limit: 1,
              })[0]
            : undefined

        if (summaryDetail && summaryRecord?.id === result.summaryID) {
          await input.onSummaryCaptured?.({
            detail: summaryDetail,
            summary: summaryRecord,
          })
        }
      }

      return result
    },

    async completeSession(sessionID) {
      const result = await this.handleSessionIdle(sessionID)

      if ("accepted" in result) {
        return {
          status: "completed",
          sessionID,
          summaryStatus: "queued",
        }
      }

      return {
        status: "completed",
        sessionID,
        summaryStatus: result.status,
        requestAnchorID: "requestAnchorID" in result ? result.requestAnchorID : undefined,
        summaryID: "summaryID" in result ? result.summaryID : undefined,
        checkpointObservationAt:
          "checkpointObservationAt" in result ? result.checkpointObservationAt : undefined,
      }
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

    buildSystemContext(contextInput) {
      const selected = selectInjectionRecords({
        store: input.store,
        projectPath: input.projectPath,
        sessionID: contextInput.sessionID,
        maxSummaries: contextInput.maxSummaries,
        maxObservations: contextInput.maxObservations,
      })
      const latestSummaryObservations = getLatestSummaryObservations(
        input.store,
        selected.summaries[0],
      )

      return buildSystemMemoryContext({
        scope: selected.scope,
        summaries: selected.summaries,
        observations: selected.observations,
        latestSummaryObservations,
        priorAssistantMessage: contextInput.priorAssistantMessage,
        maxSummaries: contextInput.maxSummaries,
        maxObservations: contextInput.maxObservations,
        maxChars: contextInput.maxChars,
      })
    },

    buildCompactionContext(contextInput) {
      const selected = selectInjectionRecords({
        store: input.store,
        projectPath: input.projectPath,
        sessionID: contextInput.sessionID,
        maxSummaries: contextInput.maxSummaries,
        maxObservations: contextInput.maxObservations,
      })
      const latestSummaryObservations = getLatestSummaryObservations(
        input.store,
        selected.summaries[0],
      )

      return buildCompactionMemoryContext({
        summaries: selected.summaries,
        observations: selected.observations,
        latestSummaryObservations,
        maxSummaries: contextInput.maxSummaries,
        maxObservations: contextInput.maxObservations,
        maxChars: contextInput.maxChars,
      })
    },

    searchMemoryRecords(searchInput) {
      if (input.searchSemanticMemoryRecords) {
        return (async () => {
          const limit = searchInput.limit

          const searchSessionSemantic = async () =>
            await input.searchSemanticMemoryRecords?.({
              projectPath: input.projectPath,
              sessionID: searchInput.sessionID,
              query: searchInput.query,
              limit,
            })

          const searchProjectSemantic = async () =>
            await input.searchSemanticMemoryRecords?.({
              projectPath: input.projectPath,
              query: searchInput.query,
              limit,
            })

          let sessionSemantic = searchInput.scope === "project" ? [] : await searchSessionSemantic()
          if (searchInput.scope !== "project" && sessionSemantic && sessionSemantic.length > 0) {
            return {
              scope: "session" as const,
              results: sessionSemantic,
            }
          }

          const sessionText =
            searchInput.scope === "project"
              ? []
              : input.store.searchMemoryRecords({
                  projectPath: input.projectPath,
                  sessionID: searchInput.sessionID,
                  query: searchInput.query,
                  limit,
                })

          if (searchInput.scope !== "project" && (sessionText.length > 0 || searchInput.scope === "session")) {
            return {
              scope: "session" as const,
              results: sessionText,
            }
          }

          const projectSemantic = await searchProjectSemantic()
          if (projectSemantic && projectSemantic.length > 0) {
            return {
              scope: "project" as const,
              results: projectSemantic,
            }
          }

          return {
            scope: "project" as const,
            results: input.store.searchMemoryRecords({
              projectPath: input.projectPath,
              query: searchInput.query,
              limit,
            }),
          }
        })()
      }

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

    getQueueStatus(queueInput) {
      const counts = input.store.getQueueStats()
      return {
        isProcessing: counts.pending > 0 || counts.processing > 0,
        queueDepth: counts.pending + counts.processing,
        counts,
        workerStatus: readCurrentWorkerStatus(),
        processingJobs: input.store.listProcessingJobs(queueInput.limit),
        failedJobs: input.store.listFailedJobs(queueInput.limit),
      }
    },

    async getLiveSnapshot(snapshotInput) {
      const selection = selectInjectionRecords({
        store: input.store,
        projectPath: input.projectPath,
        sessionID: snapshotInput.sessionID,
        maxSummaries: snapshotInput.maxSummaries,
        maxObservations: snapshotInput.maxObservations,
      })

      const queue = await Promise.resolve(
        this.getQueueStatus({
          limit: snapshotInput.queueLimit,
        }),
      )

      return {
        scope: selection.scope,
        summaries: selection.summaries,
        observations: selection.observations,
        queue,
      }
    },

    retryQueueJob(jobID) {
      return {
        retried: input.store.retryJob(jobID),
        jobID,
      }
    },
  }
}

function getLatestSummaryObservations(
  store: MemoryInjectionStore,
  latestSummary?: SummaryRecord,
): ObservationRecord[] {
  if (!latestSummary || latestSummary.observationIDs.length === 0) {
    return []
  }

  const observationsByID = new Map(
    store.getObservationsByIds(latestSummary.observationIDs).map((observation) => [observation.id, observation]),
  )

  return latestSummary.observationIDs
    .map((id) => observationsByID.get(id))
    .filter((observation): observation is ObservationRecord => Boolean(observation))
}

async function applyModelObservationRefinement(
  observation: ObservationRecord,
  refinement: ModelObservationResult | null,
): Promise<ObservationRecord> {
  if (!refinement) {
    return observation
  }

  const content = normalizeContent(refinement.content)
  if (!content) {
    return observation
  }

  const outputSummary = normalizeSummary(refinement.outputSummary) ?? observation.output.summary
  const tags = normalizeTags(refinement.tags) ?? observation.retrieval.tags
  const importance = clampImportance(refinement.importance) ?? observation.retrieval.importance

  return {
    ...observation,
    content,
    output: {
      ...observation.output,
      summary: outputSummary,
    },
    retrieval: {
      ...observation.retrieval,
      tags,
      importance,
    },
  }
}

function normalizeContent(value: string | undefined): string | null {
  if (!value) return null
  const normalized = collapseWhitespace(value)
  return normalized || null
}

function normalizeSummary(value?: string): string | undefined {
  if (!value) return undefined
  const normalized = collapseWhitespace(value)
  return normalized || undefined
}

function normalizeTags(value?: string[]): string[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined
  }

  const tags = Array.from(
    new Set(
      value
        .map((item) => collapseWhitespace(String(item)))
        .filter(Boolean),
    ),
  )

  return tags.length > 0 ? tags : undefined
}

function clampImportance(value?: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined
  }

  return Math.max(0, Math.min(1, value))
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}
