import type { Dataset } from "./analysis";
export const DATA_KEY = "nexthook-dataset-v1";
export const PLAN_KEY = "nexthook-plan-v1";
export function restore(): Dataset | null {
  try {
    const d = JSON.parse(localStorage.getItem(DATA_KEY) || "null");
    return d &&
      Array.isArray(d.posts) &&
      d.posts.length &&
      d.posts.every(
        (p: any) =>
          typeof p.title === "string" &&
          typeof p.series === "string" &&
          ["views", "saves", "followers"].every(
            (k) =>
              p[k] === null ||
              (typeof p[k] === "number" && Number.isFinite(p[k]) && p[k] >= 0)
          )
      ) &&
      ["fixed_age", "calendar", "snapshot"].includes(d.basis)
      ? d
      : null;
  } catch {
    return null;
  }
}
