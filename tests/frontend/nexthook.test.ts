import { describe, it, expect } from "vitest";
import { summarize, guidance, exportBrief } from "../../src/nexthook/analysis";
import { demoDataset } from "../../src/nexthook/demo";
import {
  normalize,
  parseText,
  suggestMapping,
} from "../../src/nexthook/import";
const meta = {
  platform: "YouTube",
  account: "test",
  basis: "fixed_age" as const,
  window: "first 7 days",
};
describe("creator comparisons", () => {
  it("does not let the one viral post determine the series winner", () => {
    const data = demoDataset();
    const groups = summarize(data.posts, "views", false);
    expect(groups[0].name).toBe("周末片单");
    expect(groups.find((g) => g.name === "幕后故事")!.mean).toBeGreaterThan(
      groups[0].mean!
    );
    expect(summarize(data.posts, "saves", false)[0].name).toBe("镜头拆解");
  });
  it("removes exactly one maximum per group without mutating evidence", () => {
    const data = demoDataset();
    const groups = summarize(data.posts, "views", true);
    expect(groups.every((g) => g.measured === 5)).toBe(true);
    expect(data.posts).toHaveLength(18);
    expect(groups.find((g) => g.name === "幕后故事")!.median).toBe(3800);
  });
  it("distinguishes missing values and real zeros", () => {
    const data = demoDataset();
    data.posts = data.posts
      .slice(0, 3)
      .map((p, i) => ({ ...p, saves: i === 0 ? null : i === 1 ? 0 : 10 }));
    const g = summarize(data.posts, "saves", false)[0];
    expect(g.median).toBe(5);
    expect(g.missing).toBe(1);
    expect(g.measured).toBe(2);
  });
  it("withholds recommendations for unequal exposure windows", () => {
    const d = { ...demoDataset(), basis: "snapshot" as const };
    expect(guidance(d, summarize(d.posts, "views", false)).title).toContain(
      "窗口"
    );
  });
  it("does not recommend a winner with insufficient samples or ties", () => {
    const d = demoDataset();
    d.posts = d.posts.filter((_, i) => i % 6 < 2);
    expect(guidance(d, summarize(d.posts, "views", false)).title).toContain(
      "积累"
    );
    d.posts = demoDataset().posts.map((p) => ({ ...p, views: 100 }));
    expect(guidance(d, summarize(d.posts, "views", false)).title).toContain(
      "没有明确"
    );
  });
  it("exports demo provenance and observation basis", () => {
    const d = demoDataset();
    const text = exportBrief(
      d,
      "views",
      summarize(d.posts, "views", false),
      false
    );
    expect(text).toContain("模拟数据");
    expect(text).toContain("发布后 7 天");
    expect(text).toContain("不是模型预测");
  });
});
describe("creator import", () => {
  it("parses quoted titles and preserves numeric grouping", () => {
    const raw = parseText(
      "file.csv",
      'title,views,series\n"A, B","1,200",Film\nC,0,Film'
    );
    const d = normalize(raw, suggestMapping(raw.headers), meta);
    expect(d.posts[0].title).toBe("A, B");
    expect(d.posts[0].views).toBe(1200);
    expect(d.posts[1].views).toBe(0);
  });
  it("does not confuse impressions or audience size with views and new follows", () => {
    const m = suggestMapping(["title", "Impressions", "Reach", "粉丝总数"]);
    expect(m.views).toBe("");
    expect(m.followers).toBe("");
  });
  it("rejects duplicate headers, shifted rows, totals and invalid counts", () => {
    expect(() => parseText("x.csv", "title,title\na,b")).toThrow("列名");
    expect(() => parseText("x.csv", "title,views\na,1,2")).toThrow("列数");
    for (const value of ["-10", "1.2万", "40%", "1,2", "NaN"]) {
      const raw = parseText("x.csv", `title,views\na,"${value}"`);
      expect(() => normalize(raw, suggestMapping(raw.headers), meta)).toThrow(
        "非负数"
      );
    }
    const raw = parseText("x.csv", "title,views\nTotal,200\na,100");
    expect(() => normalize(raw, suggestMapping(raw.headers), meta)).toThrow(
      "汇总"
    );
  });
  it("rejects mixed accounts instead of pooling unrelated data", () => {
    const raw = parseText("x.csv", "title,views,account\na,20,A\nb,30,B");
    expect(() => normalize(raw, suggestMapping(raw.headers), meta)).toThrow(
      "一个账号"
    );
  });
  it("requires a meaningful mapping and measurement context", () => {
    const raw = parseText("x.csv", "title,views\na,20");
    const m = suggestMapping(raw.headers);
    expect(() => normalize(raw, { ...m, saves: "views" }, meta)).toThrow(
      "不能重复"
    );
    expect(() => normalize(raw, m, { ...meta, window: "" })).toThrow(
      "观察窗口"
    );
    expect(normalize(raw, m, meta).posts[0].series).toBe("未分类");
  });
});
