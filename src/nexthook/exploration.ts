import {
  summarize,
  exportBrief,
  GOALS,
  type Dataset,
  type Goal,
  type Post,
} from "./analysis";
export type Question = "series" | "distribution" | "relationship";
export const QUESTIONS: Record<Question, { title: string; hint: string }> = {
  series: {
    title: "哪个系列值得继续？",
    hint: "比较典型表现，检查单条爆款的影响",
  },
  distribution: {
    title: "是整体表现好，还是一条爆款？",
    hint: "展开每条内容，看清系列内部的差别",
  },
  relationship: {
    title: "观看多，也会被收藏或关注吗？",
    hint: "查看两个指标的共同表现，不推断因果",
  },
};
export interface ExplorationSettings {
  question: Question;
  goal: Goal;
  series: string[];
  removeTop: boolean;
}
export function explore(data: Dataset, settings: ExplorationSettings) {
  const scope = data.posts.filter((p) => settings.series.includes(p.series));
  const groups = summarize(scope, settings.goal, settings.removeTop);
  const retained = new Set(groups.flatMap((g) => g.posts.map((p) => p.id)));
  const rows = scope.filter(
    (p) =>
      retained.has(p.id) &&
      (settings.question !== "relationship" || p.views !== null)
  );
  return { scope, groups, rows, omitted: scope.length - rows.length };
}
export function finding(
  data: Dataset,
  settings: ExplorationSettings,
  selected: Post | null
): string {
  const { groups, rows } = explore(data, settings);
  return [
    exportBrief(
      {
        ...data,
        posts: data.posts.filter((p) => settings.series.includes(p.series)),
      },
      settings.goal,
      groups,
      settings.removeTop
    ),
    `探索问题：${QUESTIONS[settings.question].title}`,
    `已选系列：${settings.series.join("、") || "无"}`,
    `图中有效内容：${rows.length} 条。${
      settings.question === "relationship"
        ? "关系图只显示观看和所选指标均非缺失的内容；系列中位数使用所选指标有效记录，两者样本可能不同。"
        : ""
    }`,
    selected
      ? `选中记录${
          rows.some((p) => p.id === selected.id)
            ? "（图中已纳入）"
            : "（未纳入当前图表）"
        }：${selected.title}；${GOALS[settings.goal].label}：${
          selected[settings.goal] ?? "缺失"
        }；观看：${selected.views ?? "缺失"}。`
      : "",
    "我的下一步尝试：\n检查时间：",
  ]
    .filter(Boolean)
    .join("\n");
}
