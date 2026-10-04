import { test, expect, type Page } from "@playwright/test";
async function openSample(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "体验影视创作者样例" }).click();
  await page.getByRole("button", { name: "进入可视化探索" }).click();
  await expect(page).toHaveURL(/\/explore/);
  await expect(
    page.getByTestId("exploration-chart").locator("svg")
  ).toBeVisible();
}
test("creator chart clicks link to evidence and plans persist across review", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await openSample(page);
  await expect(
    page.getByRole("heading", { name: "从一个问题，找到下一步。" })
  ).toBeVisible();
  await expect(page.getByText("Data Formulator", { exact: true })).toHaveCount(
    0
  );
  await page
    .getByTestId("exploration-chart")
    .locator(".mark-rect.role-mark path")
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "查看全部记录" })
  ).toBeVisible();
  await page.getByRole("button", { name: "查看全部记录" }).click();
  await page
    .getByRole("button", { name: "为什么这个镜头让人紧张", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "这条内容的依据" })
  ).toBeVisible();
  await page.getByLabel("下一次创作计划").fill("先保留我的想法");
  await page.getByRole("button", { name: "把当前发现加入计划" }).click();
  await expect(page.getByLabel("下一次创作计划")).toContainText(
    "先保留我的想法"
  );
  await expect(page.getByLabel("下一次创作计划")).toContainText(
    "为什么这个镜头让人紧张"
  );
  await page.reload();
  await expect(page.getByLabel("下一次创作计划")).toHaveValue(/发布后 7 天/);
  await page.getByRole("link", { name: "← 创作复盘" }).click();
  await expect(page.getByLabel("下一次创作计划")).toContainText(
    "先保留我的想法"
  );
  expect(errors).toEqual([]);
});
test("scatter selection, filters, exclusions and optional model configuration", async ({
  page,
}) => {
  await openSample(page);
  await page
    .getByRole("button", { name: /观看多，也会被收藏或关注吗/ })
    .click();
  await expect(page.getByLabel("探索指标")).toHaveValue("saves");
  const marks = page
    .getByTestId("exploration-chart")
    .locator(".mark-symbol.role-mark path");
  await expect(marks).toHaveCount(18);
  await marks.first().click();
  await expect(
    page.getByRole("heading", { name: "这条内容的依据" })
  ).toBeVisible();
  await page.getByLabel("去掉每个系列的一个最高值").check();
  await expect(marks).toHaveCount(15);
  await page.getByLabel("幕后故事", { exact: true }).uncheck();
  await expect(marks).toHaveCount(10);
  await page.getByRole("button", { name: "打开 AI 追问" }).click();
  await expect(page.getByRole("button", { name: "发送追问" })).toBeDisabled();
  await expect(
    page.getByText("配置模型后可以追问。", { exact: false })
  ).toBeVisible();
  await page.getByLabel("镜头拆解", { exact: true }).uncheck();
  await page.getByLabel("周末片单", { exact: true }).uncheck();
  await expect(
    page.getByText("当前没有可绘制的记录。", { exact: false })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "把当前发现加入计划" })
  ).toBeDisabled();
});
test("direct legacy entry and mobile exploration stay in NextHook", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app");
  await page.getByRole("button", { name: "使用模拟样例" }).click();
  await expect(
    page.getByTestId("exploration-chart").locator("svg")
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
  await page.getByRole("button", { name: /是整体表现好/ }).click();
  await expect(
    page.getByTestId("exploration-chart").locator(".mark-symbol.role-mark path")
  ).toHaveCount(18);
  await page.screenshot({
    path: "/tmp/nexthook-exploration-mobile.png",
    fullPage: true,
  });
});

test("scoped AI UI sends current evidence and follow-up history without leaving exploration", async ({
  page,
}) => {
  await page.route("**/api/agent/list-global-models", (route) =>
    route.fulfill({
      json: {
        status: "success",
        data: [
          {
            id: "test-model",
            endpoint: "openai",
            model: "test",
            is_global: true,
          },
        ],
      },
    })
  );
  const requests: any[] = [];
  await page.route("**/api/nexthook/question", (route) => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({
      json: {
        status: "success",
        data: { answer: "测试响应：请围绕同一观察窗口继续验证。" },
      },
    });
  });
  await openSample(page);
  await page.getByLabel("幕后故事", { exact: true }).uncheck();
  await page.getByLabel("周末片单", { exact: true }).uncheck();
  await page.getByLabel("去掉每个系列的一个最高值").check();
  await page.getByRole("button", { name: "打开 AI 追问" }).click();
  await page
    .getByLabel("围绕当前证据，继续问一个问题")
    .fill("下一次怎么验证？");
  await page.getByRole("button", { name: "发送追问" }).click();
  await expect(
    page.getByText("测试响应：请围绕同一观察窗口继续验证。")
  ).toBeVisible();
  expect(requests[0].context.rows_preview).toHaveLength(5);
  expect(requests[0].context.series).toEqual(["镜头拆解"]);
  expect(requests[0].context.synthetic).toBe(true);
  await page
    .getByLabel("围绕当前证据，继续问一个问题")
    .fill("应该记录哪些指标？");
  await page.getByRole("button", { name: "发送追问" }).click();
  await expect(
    page.getByText("测试响应：请围绕同一观察窗口继续验证。")
  ).toHaveCount(2);
  expect(requests[1].history).toHaveLength(2);
  await page.getByLabel("探索指标").selectOption("saves");
  await expect(
    page.getByText("测试响应：请围绕同一观察窗口继续验证。")
  ).toHaveCount(0);
  await expect(page).toHaveURL(/\/explore/);
});
