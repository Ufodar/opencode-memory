export type ObservationPhase =
  | "planning"
  | "research"
  | "execution"
  | "verification"
  | "decision"
  | "other"

export interface ObservationRecord {
  id: string
  content: string
  sessionID: string
  projectPath: string
  promptId?: string
  createdAt: number
  phase?: ObservationPhase
  tool: {
    name: string
    callID: string
    title?: string
    status: "success" | "error" | "unknown"
  }
  input: {
    summary: string
  }
  output: {
    summary: string
  }
  retrieval: {
    importance: number
    tags: string[]
  }
  trace: {
    relatedPromptId?: string
    filePaths?: string[]
  }
}

export interface ObservationCandidate {
  capture: boolean
  reason: string
}
