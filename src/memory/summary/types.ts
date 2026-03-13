export interface SummaryRecord {
  id: string
  sessionID: string
  projectPath: string
  requestAnchorID: string
  requestSummary: string
  outcomeSummary: string
  nextStep?: string
  observationIDs: string[]
  createdAt: number
}
