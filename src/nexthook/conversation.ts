import type { Dataset } from "./analysis";
import type { AnalystTableRef } from "../app/tableResolution";
export type RecordRow = Record<string, unknown>;
export interface VisualResult {
  id: string;
  title: string;
  subtitle: string;
  tableName: string;
  rows: RecordRow[];
  totalRows: number;
  refinedGoal: Record<string, any>;
  code: string;
  question: string;
}
export interface ConversationTurn {
  id: string;
  question: string;
  answer: string;
  status: "running" | "complete" | "error" | "paused";
  error?: string;
  results: VisualResult[];
  context: Record<string, unknown>;
  selectedResultId?: string;
  selectedRow?: RecordRow | null;
}
export interface AnalystSession {
  workspaceId: string;
  table: AnalystTableRef;
}
export interface PendingAnswer {
  trajectory: any[];
  completedSteps: number;
  questions: { text: string; options?: { label: string; value?: string }[] }[];
}
export interface ConversationState {
  version: 1;
  session: AnalystSession | null;
  turns: ConversationTurn[];
  activeResultId: string;
  pending: PendingAnswer | null;
}
export const emptyConversation = (): ConversationState => ({
  version: 1,
  session: null,
  turns: [],
  activeResultId: "",
  pending: null,
});
export async function conversationKey(data: Dataset): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return (
    "nexthook-conversation-" +
    Array.from(new Uint8Array(digest), (v) =>
      v.toString(16).padStart(2, "0")
    ).join("")
  );
}
export function visualResult(event: any): VisualResult | null {
  if (event.type !== "result" || event.status !== "success") return null;
  const result = event.content?.result;
  if (result?.status !== "ok")
    throw new Error("分析服务未返回有效的可视化结果。");
  const data = result.content;
  const goal = result.refined_goal;
  if (!Array.isArray(data?.rows) || !data.rows.length)
    throw new Error("本轮结果没有可绘制的记录，请修改筛选条件。");
  if (
    !goal?.chart?.chart_type ||
    !goal.chart.encodings ||
    typeof goal.chart.encodings !== "object"
  )
    throw new Error("本轮结果缺少图表配置。");
  if (
    data.rows.some((r: any) => !r || typeof r !== "object" || Array.isArray(r))
  )
    throw new Error("图表数据格式不正确。");
  const available = new Set(Object.keys(data.rows[0]));
  if (
    Object.values(goal.chart.encodings).some(
      (f) => typeof f !== "string" || !available.has(f)
    )
  )
    throw new Error("图表使用了结果表中不存在的字段。");
  const total = data.virtual?.row_count ?? data.rows.length;
  return {
    id: result.chart_id || crypto.randomUUID(),
    title: goal.title || event.content.question || "新的比较",
    subtitle: goal.subtitle || "",
    tableName: data.virtual?.table_name || "",
    rows: data.rows,
    totalRows: typeof total === "number" ? total : data.rows.length,
    refinedGoal: goal,
    code: result.code || "",
    question: event.content.question || "",
  };
}
export function threadContext(turns: ConversationTurn[]) {
  return turns.flatMap((turn) => {
    const base = {
      user_question: turn.question,
      agent_summary: [turn.answer, turn.error].filter(Boolean).join("\n"),
    };
    return turn.results.length
      ? turn.results.map((result) => ({
          ...base,
          display_instruction: result.title,
          table_name: result.tableName,
          columns: Object.keys(result.rows[0]),
          row_count: result.totalRows,
          chart_type: result.refinedGoal.chart.chart_type,
          encodings: result.refinedGoal.chart.encodings,
        }))
      : [base];
  });
}
export function resultNote(
  data: Dataset,
  turn: ConversationTurn,
  result: VisualResult
): string {
  return [
    "# NextHook 对话探索发现",
    `来源：${data.name}${data.demo ? "（模拟数据）" : ""}`,
    `账号与平台：${data.account} / ${data.platform}`,
    `观察窗口：${data.window}`,
    `用户问题：${turn.question}`,
    `图表：${result.title}`,
    `说明：${result.subtitle}`,
    `结果表：${result.tableName || "未提供表名"}；共 ${
      result.totalRows
    } 行，图中载入 ${result.rows.length} 行。`,
    `绘图配置：${JSON.stringify(result.refinedGoal.chart)}`,
    `提问时上下文：${JSON.stringify(turn.context)}`,
    turn.selectedRow
      ? `提问时选中的记录：${JSON.stringify(turn.selectedRow)}`
      : "",
    `模型解读（需核对）：${turn.answer || "本轮没有文字解读"}`,
    turn.error ? `本轮状态：${turn.error}` : "",
    "## 计算依据",
    "```python",
    result.code || "# 未提供转换代码",
    "```",
    "## 下一次尝试\n我的改动：\n验证时间：",
  ]
    .filter(Boolean)
    .join("\n\n");
}
