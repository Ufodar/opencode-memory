# Quickstart: Language-Neutral Context Actions

## Default English fallback

Run:

```bash
bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts
```

Expected:

- default fallback action text uses English
- no default `继续从...开始`
- no default `继续处理...`

## Explicit Chinese fallback

Run the same tests with fixtures that set:

```bash
OPENCODE_MEMORY_OUTPUT_LANGUAGE=zh
```

Expected:

- Chinese fallback strings are preserved
