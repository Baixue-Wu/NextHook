import { describe, it, expect } from "vitest";
import {
  visualResult,
  threadContext,
  resultNote,
  type ConversationTurn,
} from "../../src/nexthook/conversation";
import { demoDataset } from "../../src/nexthook/demo";
const event = () => ({
  type: "result",
  status: "success",
  content: {
    question: "比较收藏",
    result: {
      status: "ok",
      chart_id: "chart-a",
      content: {
        rows: [{ series: "A", median_saves: 20 }],
        virtual: { table_name: "result_a", row_count: 80 },
      },
      refined_goal: {
        title: "收藏比较",
        chart: {
          chart_type: "bar",
          encodings: { x: "series", y: "median_saves" },
        },
      },
      code: "result_df = posts",
    },
  },
});
describe("upstream analyst visual contract", () => {
  it("retains real returned rows, backend table reference and partial result count", () => {
    const result = visualResult(event())!;
    expect(result.id).toBe("chart-a");
    expect(result.totalRows).toBe(80);
    expect(result.rows).toHaveLength(1);
    expect(result.tableName).toBe("result_a");
  });
  it("rejects incompatible visual results instead of inventing a chart", () => {
    const bad = event();
    bad.content.result.refined_goal.chart.encodings.y = "missing";
    expect(() => visualResult(bad)).toThrow("不存在");
    expect(visualResult({ type: "completion" })).toBeNull();
  });
  it("preserves previous comparison and carries selected context into exported evidence", () => {
    const result = visualResult(event())!;
    const turn: ConversationTurn = {
      id: "t1",
      question: "比较收藏",
      answer: "观察结果",
      status: "complete",
      results: [result],
      context: { window: "发布后7天" },
      selectedRow: { series: "A" },
    };
    const thread = threadContext([turn]);
    expect(thread[0]).toMatchObject({
      table_name: "result_a",
      row_count: 80,
      user_question: "比较收藏",
    });
    const note = resultNote(demoDataset(), turn, result);
    expect(note).toContain("模拟数据");
    expect(note).toContain("图中载入 1 行");
    expect(note).toContain("result_df = posts");
    expect(note).toContain("提问时选中的记录");
  });
});
