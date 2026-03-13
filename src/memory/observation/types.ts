export interface ObservationRecord {
  id: string
  content: string
  sessionID: string
  projectPath: string
  promptId?: string
  createdAt: number
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
