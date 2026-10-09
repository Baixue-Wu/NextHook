import { describe, it, expect } from "vitest";
import { demoDataset } from "../../src/nexthook/demo";
import {
  explore,
  finding,
  type ExplorationSettings,
} from "../../src/nexthook/exploration";
const settings: ExplorationSettings = {
  question: "series",
  goal: "views",
  series: ["镜头拆解", "周末片单", "幕后故事"],
  removeTop: false,
};
describe("creator exploration evidence", () => {
  it("filters before excluding exactly one top record per selected series without mutating originals", () => {
    const data = demoDataset();
    const before = structuredClone(data);
    const result = explore(data, {
      ...settings,
      series: ["幕后故事"],
      removeTop: true,
    });
    expect(result.scope).toHaveLength(6);
    expect(result.rows).toHaveLength(5);
    expect(result.rows.some((p) => p.views === 62000)).toBe(false);
    expect(data).toEqual(before);
  });
  it("keeps missing values out of paired scatter data while retaining zero", () => {
    const data = demoDataset();
    data.posts = data.posts.slice(0, 3);
    data.posts[0].views = null;
    data.posts[1].saves = null;
    data.posts[2].saves = 0;
    const result = explore(data, {
      ...settings,
      question: "relationship",
      goal: "saves",
    });
    expect(result.rows.map((p) => p.id)).toEqual([data.posts[2].id]);
    expect(result.omitted).toBe(2);
    expect(result.groups[0].measured).toBe(2);
  });
  it("exports scope, simulated provenance, exclusion and excluded selected evidence", () => {
    const data = demoDataset();
    const selected = data.posts.find((p) => p.views === 62000)!;
    const text = finding(
      data,
      { ...settings, series: ["幕后故事"], removeTop: true },
      selected
    );
    expect(text).toContain("模拟数据");
    expect(text).toContain("已选系列：幕后故事");
    expect(text).toContain("未纳入当前图表");
    expect(text).toContain("发布后 7 天");
    expect(text).toContain("62000");
  });
  it("empty selection cannot silently revert to all series", () => {
    expect(explore(demoDataset(), { ...settings, series: [] }).rows).toEqual(
      []
    );
  });
});
