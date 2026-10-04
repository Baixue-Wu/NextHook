import { test, expect } from "@playwright/test";
import ExcelJS from "exceljs";
test("sample comparison, sensitivity, editable series and saved plan", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "体验影视创作者样例" }).click();
  await expect(
    page.getByRole("heading", { name: "把“周末片单”列入下一轮尝试" })
  ).toBeVisible();
  await page.getByLabel("这次更关注什么？").selectOption("saves");
  await expect(
    page.getByRole("heading", { name: "把“镜头拆解”列入下一轮尝试" })
  ).toBeVisible();
  await page.getByLabel("去掉每个系列的一个最高值").check();
  await expect(page.getByText("5 条有效 · 0 条缺失")).toHaveCount(3);
  await page.getByLabel("下一次创作计划").fill("下次只调整开场，7天后复盘");
  await page.reload();
  await expect(page.getByLabel("下一次创作计划")).toHaveValue(
    "下次只调整开场，7天后复盘"
  );
  const input = page.getByLabel("为什么这个镜头让人紧张的系列");
  await input.fill("新系列");
  await input.press("Enter");
  await expect(page.getByLabel("为什么这个镜头让人紧张的系列")).toHaveValue(
    "新系列"
  );
  await page.screenshot({ path: "/tmp/nexthook-desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("file mapping preserves data and reports unsafe comparison basis", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "creator.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("title,views,series\na,100,A\nb,200,A\nc,300,B"),
    });
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("账号标识").fill("测试账号");
  await page.getByLabel("观察窗口", { exact: true }).fill("截至2026-10-04");
  await page.getByLabel("每行是一条内容").check();
  await page.getByRole("button", { name: "开始复盘" }).click();
  await expect(
    page.getByRole("heading", { name: "先把观察窗口对齐，再判断创作方向" })
  ).toBeVisible();
  await expect(
    page.getByLabel("这次更关注什么？").locator("option[value=saves]")
  ).toBeDisabled();
});
test("guide and mobile layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "数据从哪里来？" }).click();
  await expect(page.getByRole("dialog")).toContainText("官方导出已确认");
  await page.getByRole("button", { name: "关闭数据指南" }).click();
  await page.getByRole("button", { name: "体验影视创作者样例" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  await page.screenshot({ path: "/tmp/nexthook-mobile.png", fullPage: true });
});
test("passes actual data into the upstream workbench", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "体验影视创作者样例" }).click();
  const response = page.waitForResponse(
    (r) =>
      r.url().includes("/api/") &&
      r.request().method() === "POST" &&
      r.url().includes("table")
  );
  await page.getByRole("button", { name: "带着数据自由追问" }).click();
  const imported = await response;
  expect(imported.ok()).toBe(true);
  expect((await imported.json()).status).toBe("success");
  await expect(page).toHaveURL(/\/app/);
  await expect(
    page.getByText("自由分析 · Data Formulator 工作台")
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "复制本次分析问题" })
  ).toBeVisible();
  await expect(page.getByText("正在加载自由分析工作台…")).toHaveCount(0);
  await expect(page.getByText("18 rows", { exact: true })).toBeVisible();
  await expect(page.locator("body")).toContainText("为什么这个镜头让人紧张");
  await page.reload();
  await expect(page.getByText("18 rows", { exact: true })).toBeVisible();
  await expect(page.locator("body")).toContainText("为什么这个镜头让人紧张");
  await page.screenshot({
    path: "/tmp/nexthook-workbench.png",
    fullPage: true,
  });
});

test("Excel import uses upstream parser and preserves missing cells", async ({
  page,
}) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("内容记录");
  sheet.addRow(["title", "views", "saves", "series"]);
  sheet.addRow(["Excel 内容", 120, null, "镜头拆解"]);
  sheet.addRow(["另一条内容", 0, 0, "周末片单"]);
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  await page.goto("/");
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "creator.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer,
    });
  await expect(page.getByRole("dialog")).toContainText("2 行");
  await page.getByLabel("账号标识").fill("Excel 测试");
  await page.getByLabel("观察窗口", { exact: true }).fill("发布后7天");
  await page.getByLabel("统计口径").selectOption("fixed_age");
  await page.getByLabel("每行是一条内容").check();
  await page.getByRole("button", { name: "开始复盘" }).click();
  await expect(
    page.getByRole("heading", { name: "先积累可比较的内容" })
  ).toBeVisible();
  await expect(
    page.getByRole("row").filter({ hasText: "Excel 内容" })
  ).toContainText("120");
  await expect(
    page.getByRole("row").filter({ hasText: "Excel 内容" })
  ).toContainText("—");
  await page.getByLabel("这次更关注什么？").selectOption("saves");
  await expect(page.getByText("0 条有效 · 1 条缺失")).toBeVisible();
});
