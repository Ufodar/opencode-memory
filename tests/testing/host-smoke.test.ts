import { describe, expect, test } from "bun:test"

import {
  buildMinimalHostConfig,
  buildSmokeReport,
  evaluateRetrievalChain,
  evaluateWriteChain,
  extractFirstSearchResultId,
  extractSessionId,
  parseRunOutput,
  renderSmokeSummary,
} from "../../src/testing/host-smoke.js"

describe("host smoke helpers", () => {
  test("parses mixed jsonl output and extracts session id", () => {
    const runOutput = [
      '{"type":"step_start","sessionID":"ses_demo_1"}',
      '[opencode-memory] captured observation {"id":"obs_1","tool":"read"}',
      '{"type":"tool_use","sessionID":"ses_demo_1","part":{"tool":"read","state":{"status":"completed"}}}',
      '[opencode-memory] captured summary {"id":"sum_1","sessionID":"ses_demo_1"}',
    ].join("\n")

    const parsed = parseRunOutput(runOutput)

    expect(parsed.jsonEvents).toHaveLength(2)
    expect(parsed.pluginLogs).toHaveLength(2)
    expect(extractSessionId(parsed)).toBe("ses_demo_1")
  })

  test("evaluates write chain from tool uses and plugin capture logs", () => {
    const runOutput = [
      '{"type":"step_start","sessionID":"ses_demo_write"}',
      '[opencode-memory] captured observation {"id":"obs_1","tool":"read"}',
      '{"type":"tool_use","sessionID":"ses_demo_write","part":{"tool":"read","state":{"status":"completed"}}}',
      '[opencode-memory] captured observation {"id":"obs_2","tool":"read"}',
      '{"type":"tool_use","sessionID":"ses_demo_write","part":{"tool":"read","state":{"status":"completed"}}}',
    ].join("\n")

    const result = evaluateWriteChain(parseRunOutput(runOutput))

    expect(result.readCalls).toBe(2)
    expect(result.observationCaptures).toBe(2)
    expect(result.summaryLogSignals).toBe(0)
    expect(result.passed).toBe(true)
  })

  test("treats read calls as the write-chain trigger even when async capture logs are absent", () => {
    const runOutput = [
      '{"type":"step_start","sessionID":"ses_demo_async"}',
      '{"type":"tool_use","sessionID":"ses_demo_async","part":{"tool":"read","state":{"status":"completed"}}}',
    ].join("\n")

    const result = evaluateWriteChain(parseRunOutput(runOutput))

    expect(result.readCalls).toBe(1)
    expect(result.observationCaptures).toBe(0)
    expect(result.passed).toBe(true)
  })

  test("evaluates retrieval chain from memory tool usage", () => {
    const runOutput = [
      '{"type":"step_start","sessionID":"ses_demo_retrieval"}',
      '{"type":"tool_use","sessionID":"ses_demo_retrieval","part":{"tool":"memory_search","state":{"status":"completed"}}}',
      '{"type":"tool_use","sessionID":"ses_demo_retrieval","part":{"tool":"memory_timeline","state":{"status":"completed"}}}',
      '{"type":"tool_use","sessionID":"ses_demo_retrieval","part":{"tool":"memory_details","state":{"status":"completed"}}}',
    ].join("\n")

    const result = evaluateRetrievalChain(parseRunOutput(runOutput))

    expect(result.searchCalls).toBe(1)
    expect(result.timelineCalls).toBe(1)
    expect(result.detailsCalls).toBe(1)
    expect(result.passed).toBe(true)
  })

  test("extracts first summary id from memory_search tool output", () => {
    const runOutput = [
      '{"type":"tool_use","sessionID":"ses_demo_retrieval","part":{"tool":"memory_search","state":{"status":"completed","output":"{\\"success\\":true,\\"results\\":[{\\"kind\\":\\"summary\\",\\"id\\":\\"sum_123\\"}]}"}}}',
    ].join("\n")

    const result = extractFirstSearchResultId(parseRunOutput(runOutput))

    expect(result).toBe("sum_123")
  })

  test("builds minimal host config without mcp or unrelated plugins", () => {
    const config = {
      $schema: "https://opencode.ai/config.json",
      agent: {
        plan: { temperature: 0 },
      },
      provider: {
        "my-company": {
          options: { baseURL: "http://example.test/v1", apiKey: "secret" },
          models: {
            "Kimi-K2.5": { name: "Kimi-K2.5" },
          },
        },
        other: {
          options: { baseURL: "http://other.test/v1", apiKey: "other" },
          models: {},
        },
      },
      model: "old",
      plugin: ["file:///tmp/other-plugin.js"],
      mcp: {
        memory: { type: "local" },
      },
    }

    const result = buildMinimalHostConfig(config, {
      provider: "my-company",
      model: "Kimi-K2.5",
    })

    expect(result).toEqual({
      $schema: "https://opencode.ai/config.json",
      agent: {
        plan: { temperature: 0 },
      },
      provider: {
        "my-company": {
          options: { baseURL: "http://example.test/v1", apiKey: "secret" },
          models: {
            "Kimi-K2.5": { name: "Kimi-K2.5" },
          },
        },
      },
      model: "Kimi-K2.5",
    })
  })

  test("builds a passing control smoke report from chain evaluations and sqlite counts", () => {
    const report = buildSmokeReport({
      mode: "control",
      sessionId: "ses_report_1",
      writeChain: {
        readCalls: 2,
        observationCaptures: 2,
        summaryLogSignals: 0,
        passed: true,
      },
      retrievalChain: {
        searchCalls: 1,
        timelineCalls: 1,
        detailsCalls: 1,
        passed: true,
      },
      sqliteCounts: {
        requestAnchors: 1,
        observations: 2,
        summaries: 1,
      },
    })

    expect(report.mode).toBe("control")
    expect(report.passed).toBe(true)
    expect(report.failures).toEqual([])
    expect(report.sqliteCounts.summaries).toBe(1)
  })

  test("renders a human-readable markdown summary from smoke results", () => {
    const controlReport = buildSmokeReport({
      mode: "control",
      sessionId: "ses_report_1",
      writeChain: {
        readCalls: 2,
        observationCaptures: 2,
        summaryLogSignals: 0,
        passed: true,
      },
      retrievalChain: {
        searchCalls: 1,
        timelineCalls: 1,
        detailsCalls: 1,
        passed: true,
      },
      sqliteCounts: {
        requestAnchors: 1,
        observations: 2,
        summaries: 1,
      },
    })

    const markdown = renderSmokeSummary({
      workspace: "/tmp/workspace",
      localPluginConfigPath: "/tmp/workspace/.opencode/opencode.json",
      results: [
        {
          ...controlReport,
          outputFiles: {
            run1: "/tmp/workspace/control-run1.jsonl",
            run2: "/tmp/workspace/control-run2.jsonl",
            run3: "/tmp/workspace/control-run3.jsonl",
            run4: "/tmp/workspace/control-run4.jsonl",
            sqlite: "/tmp/workspace/memory.sqlite",
            tempConfig: "/tmp/workspace/.tmp-opencode.json",
          },
        },
      ],
    })

    expect(markdown).toContain("# Host Smoke 测试摘要")
    expect(markdown).toContain("## 控制变量测试")
    expect(markdown).toContain("总结论：")
    expect(markdown).toContain("写入链：通过")
    expect(markdown).toContain("数据库计数：request=1, observation=2, summary=1")
    expect(markdown).toContain("回查链：通过")
    expect(markdown).toContain("sqlite: /tmp/workspace/memory.sqlite")
  })
})
