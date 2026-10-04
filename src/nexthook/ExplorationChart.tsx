import React, { useEffect, useRef, useState } from "react";
import embed from "vega-embed";
import { assembleVegaChart } from "../app/utils";
import { Type } from "../data/types";
import type {
  Channel,
  EncodingItem,
  FieldItem,
} from "../components/ComponentType";
import { GOALS, type Goal, type Post, type SeriesSummary } from "./analysis";
import type { Question } from "./exploration";

export function ExplorationChart({
  question,
  goal,
  rows,
  groups,
  seriesDomain,
  onSelect,
}: {
  question: Question;
  goal: Goal;
  rows: Post[];
  groups: SeriesSummary[];
  seriesDomain: string[];
  onSelect: (id: string, series: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const handler = useRef(onSelect);
  handler.current = onSelect;
  const [width, setWidth] = useState(600);
  const [error, setError] = useState("");
  useEffect(() => {
    const node = host.current!;
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.max(180, Math.floor(entries[0].contentRect.width) - 70))
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    setError("");
    const data =
      question === "series"
        ? groups
            .filter((g) => g.median !== null)
            .map((g) => ({
              系列: g.name,
              指标值: g.median,
              有效条数: g.measured,
            }))
        : rows.map((p) => ({
            系列: p.series,
            指标值: p[goal],
            观看次数: p.views,
            内容: p.title,
            内容编号: p.id,
          }));
    const mount = document.createElement("div");
    host.current!.replaceChildren(mount);
    if (!data.length) return;
    const names = Object.keys(data[0]);
    const fields: FieldItem[] = names.map((name) => ({
      id: name,
      name,
      source: "original",
      tableRef: "creator",
    }));
    const metadata = Object.fromEntries(
      names.map((name) => [
        name,
        {
          type: ["指标值", "观看次数", "有效条数"].includes(name)
            ? Type.Number
            : Type.String,
          levels: [],
        },
      ])
    );
    const encoding: Partial<Record<Channel, EncodingItem>> =
      question === "series"
        ? {
            x: { fieldID: "系列", dtype: "nominal" },
            y: { fieldID: "指标值", dtype: "quantitative" },
          }
        : question === "distribution"
        ? {
            x: { fieldID: "指标值", dtype: "quantitative" },
            y: { fieldID: "系列", dtype: "nominal" },
          }
        : {
            x: { fieldID: "观看次数", dtype: "quantitative" },
            y: { fieldID: "指标值", dtype: "quantitative" },
          };
    encoding.color = { fieldID: "系列", dtype: "nominal" };
    try {
      const spec: any = assembleVegaChart(
        question === "series" ? "Bar Chart" : "Scatter Plot",
        encoding as Record<Channel, EncodingItem>,
        fields,
        data,
        metadata,
        width,
        300,
        true,
        undefined,
        1,
        1
      );
      if (spec.encoding?.color) {
        spec.encoding.color.scale = {
          domain: seriesDomain,
          range: ["#53826e", "#a5b78a", "#d68a5b", "#719bb0", "#a88bb1"],
        };
      }
      if (question !== "series" && typeof spec.mark === "object") {
        spec.mark = { ...spec.mark, size: 85, filled: true, opacity: 0.8 };
      }
      spec.width = width;
      spec.height = 300;
      spec.config = {
        ...spec.config,
        background: "transparent",
        font: "sans-serif",
        range: {
          category: ["#53826e", "#a5b78a", "#d68a5b", "#719bb0", "#a88bb1"],
        },
        view: { stroke: null },
      };
      if (spec.encoding?.y?.field === "指标值")
        spec.encoding.y.title =
          GOALS[goal].label + (question === "series" ? "（单篇中位数）" : "");
      if (spec.encoding?.x?.field === "指标值")
        spec.encoding.x.title = GOALS[goal].label;
      void embed(mount, spec, { actions: false, renderer: "svg" })
        .then((result) => {
          if (disposed) {
            result.finalize();
            return;
          }
          result.view.addEventListener("click", (_event, item: any) => {
            const d = item?.datum;
            if (d?.["系列"])
              handler.current(String(d["内容编号"] ?? ""), String(d["系列"]));
          });
          cleanup = () => result.finalize();
        })
        .catch((e) => {
          if (!disposed) setError(`图表生成失败：${e.message}`);
        });
    } catch (e) {
      setError(`图表生成失败：${e instanceof Error ? e.message : String(e)}`);
    }
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [question, goal, rows, groups, width, seriesDomain]);
  return (
    <>
      <div
        ref={host}
        className="nx-chart"
        data-testid="exploration-chart"
        aria-label="可交互内容图表"
      />
      {error && <p role="alert">{error}</p>}
      <p className="nh-small">
        点击柱形选择系列，点击散点查看内容。也可以使用下方记录按钮选择。
      </p>
    </>
  );
}
