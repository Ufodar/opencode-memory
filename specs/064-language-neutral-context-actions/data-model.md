# Data Model: Language-Neutral Context Actions

## Existing Policy Reused

本轮不新增新配置，直接复用：

- `OPENCODE_MEMORY_OUTPUT_LANGUAGE`

## Affected Output Slots

本轮只影响 deterministic fallback slots：

- latest snapshot `Next Steps`
- `RESUME GUIDE`
- compaction snapshot `Next Steps`

## Unchanged

- `SummaryRecord.nextStep`
- `ObservationRecord.content`
- `SummaryRecord.outcomeSummary`
- context section ordering
