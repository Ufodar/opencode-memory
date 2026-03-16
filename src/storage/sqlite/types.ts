export interface ObservationRow {
  id: string
  content: string
  session_id: string
  project_path: string
  prompt_id: string | null
  created_at: number
  phase: string | null
  tool_name: string
  call_id: string
  tool_title: string | null
  tool_status: string
  input_summary: string
  output_summary: string
  importance: number
  tags_json: string
  trace_json: string
}

export interface RequestAnchorRow {
  id: string
  session_id: string
  project_path: string
  content: string
  created_at: number
  summarized_at: number | null
  last_checkpoint_observation_at: number | null
}

export interface SummaryRow {
  id: string
  session_id: string
  project_path: string
  request_anchor_id: string
  request_summary: string
  outcome_summary: string
  next_step: string | null
  observation_ids_json: string
  created_at: number
}

export const INTERNAL_CONTINUITY_TOOLS = [
  "memory_search",
  "memory_timeline",
  "memory_details",
  "memory_context_preview",
  "memory_queue_status",
  "memory_queue_retry",
] as const

export const INTERNAL_TOOL_SQL_LIST = INTERNAL_CONTINUITY_TOOLS.map((tool) => `'${tool}'`).join(", ")
