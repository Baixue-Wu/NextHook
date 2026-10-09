import { csvParseRows, tsvParseRows } from "d3";
import { loadBinaryDataWrapper } from "../data/utils";
import type { Basis, Dataset, Post } from "./analysis";
export type Field =
  | "title"
  | "series"
  | "published"
  | "views"
  | "saves"
  | "followers";
export const FIELDS: Record<
  Field,
  { label: string; aliases: string[]; required?: boolean }
> = {
  title: {
    label: "内容标题",
    required: true,
    aliases: [
      "title",
      "标题",
      "笔记标题",
      "作品名称",
      "作品标题",
      "视频标题",
      "Video title",
      "Description",
    ],
  },
  series: {
    label: "内容系列",
    aliases: ["series", "系列", "内容分类", "主题", "内容系列"],
  },
  published: {
    label: "发布时间",
    aliases: [
      "published",
      "发布时间",
      "发布日期",
      "Video publish time",
      "Publish time",
      "Date published",
    ],
  },
  views: {
    label: "观看次数（不是曝光或触达）",
    required: true,
    aliases: [
      "views",
      "观看量",
      "播放量",
      "观看次数",
      "阅读量",
      "Views",
      "Video views",
    ],
  },
  saves: {
    label: "收藏次数",
    aliases: ["saves", "收藏", "收藏数", "收藏量", "Saves"],
  },
  followers: {
    label: "该条内容新增关注",
    aliases: [
      "followers",
      "涨粉量",
      "新增关注",
      "涨粉",
      "Subscribers gained",
      "Follows",
    ],
  },
};
export interface RawTable {
  name: string;
  headers: string[];
  rows: Record<string, unknown>[];
}
export type Mapping = Record<Field, string>;
export const MAX_ROWS = 10000;
export const MAX_BYTES = 10 * 1024 * 1024;
export function suggestMapping(headers: string[]): Mapping {
  return Object.fromEntries(
    Object.entries(FIELDS).map(([field, config]) => [
      field,
      headers.find((h) =>
        config.aliases.some((a) => a.toLowerCase() === h.trim().toLowerCase())
      ) ?? "",
    ])
  ) as Mapping;
}
export function parseText(name: string, text: string): RawTable {
  const clean = text.replace(/^\uFEFF/, "").trim();
  if (clean.startsWith("sep="))
    throw new Error(
      "文件带有导出说明行，请在表格软件中删除说明行，使第一行为列名，再另存为 UTF-8 CSV。"
    );
  const parsed = name.toLowerCase().endsWith(".tsv")
    ? tsvParseRows(clean)
    : csvParseRows(clean);
  const headers = (parsed.shift() ?? []).map((h) => h.trim());
  if (
    headers.length < 2 ||
    headers.some((h) => !h) ||
    new Set(headers).size !== headers.length
  )
    throw new Error(
      "第一行必须是至少两列不重复、非空的列名。请检查分隔符和文件表头。"
    );
  const rows = parsed.filter((r) => r.some((cell) => cell.trim()));
  if (!rows.length || rows.length > MAX_ROWS)
    throw new Error(`请提供 1 到 ${MAX_ROWS} 条内容记录。`);
  if (rows.some((r) => r.length !== headers.length))
    throw new Error(
      "部分行的列数与表头不一致，请检查逗号、引号或缺少的单元格。"
    );
  return {
    name,
    headers,
    rows: rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]]))),
  };
}
export async function readUpload(file: File): Promise<RawTable[]> {
  if (file.size > MAX_BYTES)
    throw new Error("首版支持 10 MB 以内的表格，请拆分后再导入。");
  if (/\.xlsx$/i.test(file.name)) {
    const tables = await loadBinaryDataWrapper(
      file.name,
      await file.arrayBuffer()
    );
    if (!tables.length) throw new Error("Excel 中没有可读取的工作表。");
    return tables.map((t) => ({
      name: t.displayId || t.id,
      headers: t.names,
      rows: t.rows,
    }));
  }
  if (!/\.(csv|tsv)$/i.test(file.name))
    throw new Error("请选择 CSV、TSV 或 XLSX 文件。");
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const encoding =
    bytes[0] === 0xff && bytes[1] === 0xfe
      ? "utf-16le"
      : bytes[0] === 0xfe && bytes[1] === 0xff
      ? "utf-16be"
      : "utf-8";
  let text: string;
  try {
    text = new TextDecoder(encoding, { fatal: true }).decode(buffer);
  } catch {
    text = new TextDecoder("gbk", { fatal: true }).decode(buffer);
  }
  return [parseText(file.name, text)];
}
function numeric(value: unknown, row: number, field: string): number | null {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === "" ||
    ["--", "—", "N/A", "null"].includes(String(value).trim())
  )
    return null;
  const raw = String(value).trim();
  if (
    !/^\d+(?:\.\d+)?$/.test(raw) &&
    !/^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(raw)
  )
    throw new Error(
      `第 ${row} 行的${field}“${raw}”不是非负数。请转换为完整数值，不使用“万”或百分比。`
    );
  const result = Number(raw.replaceAll(",", ""));
  if (!Number.isFinite(result))
    throw new Error(`第 ${row} 行的${field}数值无效。`);
  return result;
}
export function normalize(
  raw: RawTable,
  mapping: Mapping,
  meta: { platform: string; account: string; basis: Basis; window: string }
): Dataset {
  if (!mapping.title || !mapping.views)
    throw new Error("请确认标题和观看次数对应的列。");
  const mapped = Object.values(mapping).filter(Boolean);
  if (
    new Set(mapped).size !== mapped.length ||
    mapped.some((h) => !raw.headers.includes(h))
  )
    throw new Error("字段映射不能重复，且必须来自当前表格。");
  if (!raw.rows.length || raw.rows.length > MAX_ROWS)
    throw new Error(`请提供 1 到 ${MAX_ROWS} 条内容记录。`);
  if (!meta.account.trim() || !meta.window.trim())
    throw new Error("请填写账号标识和观察窗口，保留比较依据。");
  for (const dimension of ["platform", "平台", "account", "账号"]) {
    if (raw.headers.includes(dimension)) {
      const distinct = new Set(
        raw.rows.map((r) => String(r[dimension] ?? "").trim()).filter(Boolean)
      );
      if (distinct.size > 1)
        throw new Error(
          "首版一次只比较一个账号、一个平台的数据，请先拆分文件。"
        );
    }
  }
  const posts = raw.rows.map((r, i): Post => {
    const title = String(r[mapping.title] ?? "").trim();
    if (!title || /^(total|totals|合计|总计)$/i.test(title))
      throw new Error(
        `第 ${i + 2} 行标题为空或为汇总行，请删除汇总行，只保留逐条内容。`
      );
    return {
      id: String(i + 1),
      title,
      series: String(r[mapping.series] ?? "").trim() || "未分类",
      published: mapping.published ? String(r[mapping.published] ?? "") : "",
      views: numeric(r[mapping.views], i + 2, "观看次数"),
      saves: mapping.saves
        ? numeric(r[mapping.saves], i + 2, "收藏次数")
        : null,
      followers: mapping.followers
        ? numeric(r[mapping.followers], i + 2, "新增关注")
        : null,
    };
  });
  if (posts.every((p) => p.views === null))
    throw new Error("观看次数列没有有效数值，请重新选择字段。");
  return { ...meta, name: raw.name, demo: false, posts };
}
