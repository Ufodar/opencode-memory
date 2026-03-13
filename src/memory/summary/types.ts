export interface SummaryRecord {
  id: string
  sessionID: string
  requestSummary: string
  outcomeSummary: string
  nextStep?: string
  observationIDs: string[]
  createdAt: number
}
