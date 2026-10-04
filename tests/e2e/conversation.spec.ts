import { test, expect, type Page } from "@playwright/test";
const model = {
  id: "test-model",
  endpoint: "openai",
  model: "test",
  is_global: true,
};
function chart(id: string, title: string, values: number[]) {
  return {
    type: "result",
    status: "success",
    content: {
      question: title,
      result: {
        status: "ok",
        chart_id: id,
        content: {
          rows: ["镜头拆解", "周末片单", "幕后故事"].map((series, i) => ({
            series,
            median_saves: values[i],
            sample_count: id === "chart-a" ? 6 : 5,
          })),
          virtual: {
            table_name: `result_${id.replace("-", "_")}`,
            row_count: 3,
          },
        },
        refined_goal: {
          title,
          subtitle: "模拟内容，发布后 7 天",
          chart: {
            chart_type: "bar",
            encodings: { x: "series", y: "median_saves", color: "series" },
          },
        },
        code: `# Test fixture: ${title}\nresult_df = creator_posts.groupby('series').agg(median_saves=('saves','median'))`,
      },
    },
  };
}
const complete = {
  type: "completion",
  status: "success",
  content: { summary: "这是模拟数据的比较，请结合原始记录核对。" },
};
const ndjson = (events: unknown[]) =>
  events.map((e) => JSON.stringify(e)).join("\n") + "\n";
async function openSample(page: Page) {
  await page.route("**/api/agent/list-global-models", (r) =>
    r.fulfill({ json: { status: "success", data: [model] } })
  );
  await page.goto("/explore");
  await page.getByRole("button", { name: "使用模拟样例" }).click();
  await expect(
    page.getByRole("heading", { name: "问一句，继续探索。" })
  ).toBeVisible();
}
async function ask(page: Page, text: string) {
  await page.getByLabel("描述你想比较、修改或继续追问的内容").fill(text);
  await page.getByRole("button", { name: /发送并探索|继续回答/ }).click();
}

test("real upload, streamed charts, contextual follow-up, comparison, plan and reload", async ({
  page,
}) => {
  const requests: any[] = [];
  const uploads: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().includes("create-table")) uploads.push(r.url());
  });
  await page.route("**/api/agent/analyst-streaming", (route) => {
    requests.push(route.request().postDataJSON());
    const n = requests.length;
    return route.fulfill({
      contentType: "application/x-ndjson",
      body: ndjson([
        { type: "action", action: "visualize" },
        chart(
          n === 1 ? "chart-a" : n === 2 ? "chart-b" : "chart-d",
          n === 1 ? "系列收藏比较" : "去掉最高值后的收藏比较",
          n === 1 ? [415, 295, 115] : [410, 290, 110]
        ),
        complete,
      ]),
    });
  });
  await openSample(page);
  await ask(page, "按系列比较收藏中位数，并画图");
  await expect(
    page.getByRole("heading", { name: "系列收藏比较", exact: true })
  ).toBeVisible();
  await expect(
    page.getByTestId("generated-chart").locator("svg")
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "发送并探索" })).toBeDisabled();
  expect(requests[0].input_tables[0]).toMatchObject({
    name: "creator_posts",
    row_count: 18,
  });
  await page
    .getByTestId("generated-chart")
    .locator(".mark-rect.role-mark path")
    .first()
    .click();
  await expect(page.getByText("选中的数据", { exact: true })).toBeVisible();
  await ask(page, "去掉每个系列收藏最高的一条，再画图");
  await expect(
    page.getByRole("heading", { name: "去掉最高值后的收藏比较", exact: true })
  ).toBeVisible();
  expect(requests[1].user_question).toContain("selected_row");
  expect(requests[1].user_question).toContain("chart-a");
  expect(requests[1].focused_thread[0]).toMatchObject({
    table_name: "result_chart_a",
    user_question: "按系列比较收藏中位数，并画图",
  });
  expect(requests[1].charts[0].chart_id).toBe("chart-a");
  await page.getByLabel("对照结果").selectOption("chart-a");
  await expect(page.getByTestId("generated-chart").locator("svg")).toHaveCount(
    2
  );
  await page.screenshot({
    path: "/tmp/nexthook-conversation-fixture.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "把这张图的发现加入计划" }).click();
  await page.locator(".nx-manual > summary").click();
  await expect(page.getByLabel("下一次创作计划")).toHaveValue(
    /去掉最高值后的收藏比较/
  );
  await expect(page.getByLabel("下一次创作计划")).toHaveValue(/实际|计算依据/);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "结果 1", exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "结果 2", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await ask(page, "换一个角度继续比较");
  await expect.poll(() => requests.length).toBe(3);
  expect(uploads).toHaveLength(1);
  expect(errors).toEqual([]);
});

test("analyst clarification resumes its trajectory and reports premature stream termination", async ({
  page,
}) => {
  const requests: any[] = [];
  await page.route("**/api/agent/analyst-streaming", (route) => {
    requests.push(route.request().postDataJSON());
    const events =
      requests.length === 1
        ? [
            {
              type: "interact",
              questions: [
                {
                  text: "以什么指标比较？",
                  options: [{ label: "收藏", value: "saves" }],
                },
              ],
              trajectory: [{ role: "user", content: "原始问题" }],
              completed_step_count: 1,
            },
          ]
        : requests.length === 2
        ? [chart("chart-c", "澄清后的比较", [415, 295, 115]), complete]
        : [{ type: "action", action: "visualize" }];
    return route.fulfill({
      contentType: "application/x-ndjson",
      body: ndjson(events),
    });
  });
  await openSample(page);
  await ask(page, "哪个系列更值得做？");
  await expect(page.getByText("继续前，需要你补充：")).toBeVisible();
  await page.getByRole("button", { name: "收藏", exact: true }).click();
  await page.getByRole("button", { name: "继续回答" }).click();
  await expect(
    page.getByRole("heading", { name: "澄清后的比较", exact: true })
  ).toBeVisible();
  expect(requests[1].trajectory).toEqual([
    { role: "user", content: "原始问题" },
  ]);
  expect(requests[1].completed_step_count).toBe(1);
  await ask(page, "再画一张");
  await expect(page.getByRole("alert")).toContainText("连接提前结束");
  await expect(
    page.getByRole("heading", { name: "澄清后的比较", exact: true })
  ).toBeVisible();
});

test("fatal agent errors do not invent a chart or a successful answer", async ({
  page,
}) => {
  await page.route("**/api/agent/analyst-streaming", (r) =>
    r.fulfill({
      contentType: "application/x-ndjson",
      body: ndjson([{ type: "error", error: { message: "测试模型不可用" } }]),
    })
  );
  await openSample(page);
  await ask(page, "比较内容系列");
  await expect(page.getByRole("alert")).toContainText("测试模型不可用");
  await expect(page.getByTestId("generated-chart")).toHaveCount(0);
});
