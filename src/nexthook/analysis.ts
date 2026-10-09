export type Goal = "views" | "saves" | "followers";
export type Basis = "fixed_age" | "calendar" | "snapshot";
export interface Post {
  id: string;
  title: string;
  series: string;
  published: string;
  views: number | null;
  saves: number | null;
  followers: number | null;
}
export interface Dataset {
  name: string;
  platform: string;
  account: string;
  basis: Basis;
  window: string;
  demo: boolean;
  posts: Post[];
}
export interface SeriesSummary {
  name: string;
  count: number;
  measured: number;
  missing: number;
  median: number | null;
  mean: number | null;
  total: number;
  withoutTop: number | null;
  posts: Post[];
}
export const GOALS: Record<
  Goal,
  { label: string; question: string; unit: string }
> = {
  views: {
    label: "观看表现",
    question: "哪个系列的单篇观看表现更高？",
    unit: "次观看",
  },
  saves: {
    label: "收藏表现",
    question: "哪个系列的单篇收藏更多？",
    unit: "次收藏",
  },
  followers: {
    label: "内容带来的关注",
    question: "哪个系列带来的新增关注更多？",
    unit: "个关注",
  },
};
export const BASIS_LABELS: Record<Basis, string> = {
  fixed_age: "每条发布后相同天数",
  calendar: "同一日历统计区间",
  snapshot: "截至导出时的累计值",
};
export const MIN_COMPARISON_POSTS = 3;
export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}
export function summarize(
  posts: Post[],
  goal: Goal,
  removeTop: boolean
): SeriesSummary[] {
  const groups = new Map<string, Post[]>();
  for (const post of posts)
    groups.set(post.series, [...(groups.get(post.series) ?? []), post]);
  return [...groups]
    .map(([name, members]) => {
      const valid = members
        .filter((p) => p[goal] !== null)
        .sort((a, b) => b[goal]! - a[goal]! || a.id.localeCompare(b.id));
      const retained = removeTop ? valid.slice(1) : valid;
      const values = retained.map((p) => p[goal]!);
      const total = values.reduce((a, b) => a + b, 0);
      return {
        name,
        count: members.length,
        measured: values.length,
        missing: members.length - valid.length,
        median: median(values),
        mean: values.length ? total / values.length : null,
        total,
        withoutTop: median(valid.slice(1).map((p) => p[goal]!)),
        posts: retained,
      };
    })
    .sort(
      (a, b) =>
        (b.median ?? -1) - (a.median ?? -1) || a.name.localeCompare(b.name)
    );
}
export function guidance(
  data: Dataset,
  groups: SeriesSummary[]
): { title: string; evidence: string; next: string; caveat: string } {
  const eligible = groups.filter(
    (g) => g.measured >= MIN_COMPARISON_POSTS && g.median !== null
  );
  const top = eligible[0];
  if (data.basis !== "fixed_age")
    return {
      title: "先把观察窗口对齐，再判断创作方向",
      evidence: `当前是“${
        BASIS_LABELS[data.basis]
      }”。较早发布的内容可能有更多积累机会。`,
      next: "记录每条发布后相同天数的表现，或先选出发布时间接近的内容，再比较系列。",
      caveat: "下面的图表描述这份数据，不代表各系列在同等条件下的表现。",
    };
  if (eligible.length < 2 || !top)
    return {
      title: "先积累可比较的内容",
      evidence: `至少需要两个系列各有 ${MIN_COMPARISON_POSTS} 条有效记录，才给出方向提示。`,
      next: "继续记录同一观察窗口的内容表现；目前可以检查单条记录，暂不推荐系列。",
      caveat: "这是避免极少样本排序的产品规则，不是统计显著性标准。",
    };
  if (top.median === eligible[1].median)
    return {
      title: "目前没有明确领先的系列",
      evidence: "前两个系列的单篇中位数相同。",
      next: "结合创作成本与兴趣选择下一次尝试，并继续收集同口径记录。",
      caveat: "不把并列数据强行写成优胜结论。",
    };
  const sensitive =
    [...eligible].sort((a, b) => (b.withoutTop ?? -1) - (a.withoutTop ?? -1))[0]
      ?.name !== top.name;
  return {
    title: `把“${top.name}”列入下一轮尝试`,
    evidence: `在有足够记录的系列中，它的单篇中位数较高；依据 ${top.measured} 条有效记录。`,
    next: `延续这个系列做一次新尝试，记录具体改动，并在 ${
      data.window || "相同观察窗口"
    } 后回来检查表现。`,
    caveat: sensitive
      ? "去掉各组最高值后排序可能变化，请先查看敏感性比较。"
      : "这是历史观察支持的尝试方向，不是效果保证，也没有证明系列本身造成了差异。",
  };
}
export function exportBrief(
  data: Dataset,
  goal: Goal,
  groups: SeriesSummary[],
  removeTop: boolean
): string {
  const g = guidance(data, groups);
  return [
    `# NextHook 创作复盘`,
    ``,
    `来源：${data.name}${data.demo ? "（模拟数据）" : ""}`,
    `平台与账号：${data.platform} / ${data.account}`,
    `口径：${BASIS_LABELS[data.basis]}，${data.window}`,
    `目标：${GOALS[goal].label}。${
      removeTop ? "各系列已去掉一个最高值。" : "保留全部有效记录。"
    }`,
    "",
    ...groups.map(
      (s) =>
        `- ${s.name}：${s.measured} 条有效记录；中位数 ${
          s.median ?? "缺失"
        }；缺失 ${s.missing} 条。`
    ),
    "",
    `## 下一步`,
    g.title,
    g.evidence,
    g.next,
    g.caveat,
    "",
    "指标由确定性计算得到；方向提示为规则生成，不是模型预测。",
  ].join("\n");
}
