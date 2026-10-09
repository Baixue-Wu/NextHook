export const publicDemo = typeof __PUBLIC_DEMO__ !== "undefined" && __PUBLIC_DEMO__;
export function reviewUrl() {
  return import.meta.env.BASE_URL;
}
export function explorationUrl(goal: string) {
  return publicDemo
    ? `${reviewUrl()}?view=explore&goal=${encodeURIComponent(goal)}`
    : `/explore?goal=${encodeURIComponent(goal)}`;
}
