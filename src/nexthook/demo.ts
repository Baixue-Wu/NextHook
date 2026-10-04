import type { Dataset } from "./analysis";
export function demoDataset(): Dataset {
  const groups = [
    {
      name: "镜头拆解",
      titles: [
        "为什么这个镜头让人紧张",
        "一个长镜头的三次转场",
        "用光影讲一个秘密",
        "电影中的留白",
        "一场戏的视线关系",
        "从远景走进人物",
      ],
      views: [4200, 5100, 4800, 6200, 5300, 5600],
      saves: [330, 420, 380, 460, 410, 440],
      followers: [30, 39, 35, 46, 40, 42],
    },
    {
      name: "周末片单",
      titles: [
        "周末给自己一部电影",
        "适合雨天看的三部片",
        "那些关于重逢的故事",
        "一个人的电影夜",
        "短途旅行前的片单",
        "秋天的五种电影颜色",
      ],
      views: [6000, 7500, 8200, 9100, 8500, 7800],
      saves: [220, 300, 310, 340, 290, 270],
      followers: [21, 27, 29, 31, 28, 25],
    },
    {
      name: "幕后故事",
      titles: [
        "这场戏拍了多少次",
        "一件道具的来历",
        "电影海报背后的故事",
        "摄影师的第一部作品",
        "配乐响起之前",
        "意外留下的经典镜头",
      ],
      views: [3200, 4100, 3800, 3600, 4400, 62000],
      saves: [90, 110, 100, 120, 130, 1600],
      followers: [12, 15, 13, 14, 16, 290],
    },
  ];
  return {
    name: "影视创作者 · 18 条模拟内容",
    platform: "小红书",
    account: "演示账号",
    basis: "fixed_age",
    window: "发布后 7 天",
    demo: true,
    posts: groups.flatMap((g, gi) =>
      g.titles.map((title, i) => ({
        id: `${gi}-${i}`,
        title,
        series: g.name,
        published: `2026-09-${String(i * 3 + gi + 1).padStart(2, "0")}`,
        views: g.views[i],
        saves: g.saves[i],
        followers: g.followers[i],
      }))
    ),
  };
}
