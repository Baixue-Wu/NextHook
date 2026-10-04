import React, { useEffect, useRef, useState } from "react";
import embed from "vega-embed";
import { createDictTable, type FieldItem } from "../components/ComponentType";
import { resolveRecommendedChart } from "../app/chartRecommendation";
import { assembleVegaChart } from "../app/utils";
import type { RecordRow, VisualResult } from "./conversation";
export function GeneratedChart({
  result,
  onSelect,
}: {
  result: VisualResult;
  onSelect: (row: RecordRow) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const callback = useRef(onSelect);
  callback.current = onSelect;
  const [width, setWidth] = useState(550);
  const [error, setError] = useState("");
  useEffect(() => {
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.max(180, Math.floor(entries[0].contentRect.width) - 80))
    );
    observer.observe(host.current!);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let stopped = false;
    let finalize: (() => void) | undefined;
    setError("");
    const mount = document.createElement("div");
    host.current!.replaceChildren(mount);
    try {
      const table = createDictTable(result.tableName || result.id, result.rows);
      const fields: FieldItem[] = table.names.map((name) => ({
        id: name,
        name,
        source: "original",
        tableRef: table.id,
      }));
      const chart = resolveRecommendedChart(result.refinedGoal, fields, table);
      const spec: any = assembleVegaChart(
        chart.chartType,
        chart.encodingMap,
        fields,
        table.rows,
        table.metadata,
        width,
        330,
        true,
        chart.config,
        1,
        1
      );
      if (spec.mark || spec.layer) spec.width = width;
      spec.config = {
        ...spec.config,
        background: "transparent",
        font: "sans-serif",
      };
      void embed(mount, spec, { actions: false, renderer: "svg" })
        .then((render) => {
          if (stopped) {
            render.finalize();
            return;
          }
          render.view.addEventListener("click", (_event, item: any) => {
            const datum = item?.datum;
            if (
              datum &&
              table.names.some((name) =>
                Object.prototype.hasOwnProperty.call(datum, name)
              )
            ) {
              callback.current(
                Object.fromEntries(
                  table.names
                    .filter((name) =>
                      Object.prototype.hasOwnProperty.call(datum, name)
                    )
                    .map((name) => [name, datum[name]])
                )
              );
            }
          });
          finalize = () => render.finalize();
        })
        .catch((e) => {
          if (!stopped)
            setError(`图表无法渲染：${e.message}。下方仍可核对结果表。`);
        });
    } catch (e) {
      setError(
        `图表无法渲染：${
          e instanceof Error ? e.message : String(e)
        }。下方仍可核对结果表。`
      );
    }
    return () => {
      stopped = true;
      finalize?.();
    };
  }, [result, width]);
  return (
    <>
      <div className="nc-generated" ref={host} data-testid="generated-chart" />
      {error && <p role="alert">{error}</p>}
    </>
  );
}
