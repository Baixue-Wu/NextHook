import React, { Suspense, lazy, useMemo, useState } from "react";
import {
  BASIS_LABELS,
  GOALS,
  guidance,
  type Goal,
  type Post,
} from "./analysis";
import { DATA_KEY, PLAN_KEY, restore } from "./storage";
import { demoDataset } from "./demo";
import {
  QUESTIONS,
  explore,
  finding,
  type Question,
  type ExplorationSettings,
} from "./exploration";
import { ExplorationChart } from "./ExplorationChart";
import "./nexthook.css";
import "./exploration.css";
const CreatorQuestion = lazy(() =>
  import("./CreatorQuestion").then((m) => ({ default: m.CreatorQuestion }))
);
const fmt = (n: number | null) =>
  n === null
    ? "未提供"
    : new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(n);
function readPlan() {
  try {
    return localStorage.getItem(PLAN_KEY) || "";
  } catch {
    return "";
  }
}
export function Exploration() {
  const [data, setData] = useState(restore);
  const [goal, setGoal] = useState<Goal>(() => {
    const q = new URLSearchParams(location.search).get("goal");
    return q === "saves" || q === "followers" ? q : "views";
  });
  const [question, setQuestion] = useState<Question>("series");
  const allSeries = useMemo(
    () => [...new Set(data?.posts.map((p) => p.series) || [])],
    [data]
  );
  const [excludedSeries, setExcludedSeries] = useState<string[]>([]);
  const [removeTop, setRemoveTop] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [inspectSeries, setInspectSeries] = useState("");
  const [page, setPage] = useState(0);
  const [showAi, setShowAi] = useState(false);
  const [plan, setPlan] = useState(readPlan);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const settings = useMemo<ExplorationSettings>(
    () => ({
      question,
      goal,
      series: allSeries.filter((s) => !excludedSeries.includes(s)),
      removeTop,
    }),
    [question, goal, allSeries, excludedSeries, removeTop]
  );
  const result = useMemo(
    () => (data ? explore(data, settings) : null),
    [data, settings]
  );
  const selected = result?.scope.find((p) => p.id === selectedId) || null;
  const evidence =
    result?.scope.filter((p) => !inspectSeries || p.series === inspectSeries) ||
    [];
  const shown = evidence.slice(page * 10, page * 10 + 10);
  const advice = data && result ? guidance(data, result.groups) : null;
  const included = new Set(result?.rows.map((p) => p.id));
  const context = useMemo(
    () =>
      data && result
        ? {
            source: data.name,
            account: data.account,
            platform: data.platform,
            synthetic: data.demo,
            observation_basis: BASIS_LABELS[data.basis],
            observation_window: data.window,
            question: QUESTIONS[question].title,
            metric: GOALS[goal].label,
            remove_one_maximum_per_series: removeTop,
            series: settings.series,
            total_scope: result.scope.length,
            plotted_posts: result.rows.length,
            omitted_posts: result.omitted,
            series_summary: result.groups.map(
              ({ name, measured, missing, median, mean }) => ({
                name,
                measured,
                missing,
                median,
                mean,
              })
            ),
            rows_preview: result.rows.slice(0, 50),
            preview_limit: 50,
            selected_content: selected,
            caveat:
              "系列汇总按当前指标的有效记录计算；关系图还要求观看次数非缺失。各系列样本数不同；比较不证明因果。",
          }
        : null,
    [data, result, question, goal, removeTop, settings, selected]
  );
  function clearSelection() {
    setSelectedId("");
    setInspectSeries("");
    setPage(0);
  }
  function chooseQuestion(next: Question) {
    setQuestion(next);
    clearSelection();
    if (next === "relationship" && goal === "views")
      setGoal(
        data?.posts.some((p) => p.saves !== null) ? "saves" : "followers"
      );
  }
  function savePlan(next: string) {
    try {
      localStorage.setItem(PLAN_KEY, next);
      setPlan(next);
      setError("");
      return true;
    } catch {
      setError("浏览器存储失败，请下载计划或复制文本后保存。");
      setPlan(next);
      return false;
    }
  }
  function pinFinding() {
    if (!data || !result?.rows.length) return;
    const next = [plan, finding(data, settings, selected)]
      .filter(Boolean)
      .join("\n\n---\n\n");
    if (savePlan(next)) setNotice("已将当前发现及其数据依据加入计划。");
  }
  function downloadPlan() {
    const url = URL.createObjectURL(
      new Blob([plan], { type: "text/markdown;charset=utf-8" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "nexthook-creation-plan.md";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="nh nx">
      <header className="nh-nav">
        <a href="/" className="nh-brand">
          <span className="nh-mark">
            n<span>↗</span>
          </span>
          NextHook
        </a>
        <nav>
          <a href="/">← 创作复盘</a>
          <span className="nh-alpha">内容探索</span>
        </nav>
      </header>
      {!data ? (
        <main className="nx-empty">
          <p className="nh-eyebrow">START WITH YOUR CONTENT</p>
          <h1>先带一份内容记录来。</h1>
          <p>从复盘页导入表格，或直接探索影视创作者的模拟样例。</p>
          <a className="nh-secondary" href="/">
            去导入表格
          </a>
          <button
            className="nh-primary"
            onClick={() => {
              const d = demoDataset();
              setData(d);
              try {
                localStorage.setItem(DATA_KEY, JSON.stringify(d));
              } catch {
                setError("样例可用，但浏览器未能保存它。");
              }
            }}
          >
            使用模拟样例
          </button>
        </main>
      ) : (
        <main className="nx-main">
          <section className="nx-heading">
            <div>
              <p className="nh-eyebrow">FOLLOW THE EVIDENCE</p>
              <h1>从一个问题，找到下一步。</h1>
              <p>
                {data.account}{" "}
                <span className="nh-badge">
                  {data.demo ? "模拟数据" : data.platform}
                </span>{" "}
                · {data.posts.length} 条内容
              </p>
            </div>
            <div className="nx-window">
              <strong>{BASIS_LABELS[data.basis]}</strong>
              <span>{data.window}</span>
            </div>
          </section>
          <div className="nx-layout">
            <aside className="nx-questions">
              <p className="nh-eyebrow">你想弄清什么？</p>
              {(
                Object.entries(QUESTIONS) as [
                  Question,
                  (typeof QUESTIONS)[Question]
                ][]
              ).map(([key, q], i) => (
                <button
                  key={key}
                  className={`nx-question ${question === key ? "active" : ""}`}
                  aria-pressed={question === key}
                  disabled={
                    key === "relationship" &&
                    !data.posts.some(
                      (p) => p.saves !== null || p.followers !== null
                    )
                  }
                  onClick={() => chooseQuestion(key)}
                >
                  <span>0{i + 1}</span>
                  <strong>{q.title}</strong>
                  <small>{q.hint}</small>
                </button>
              ))}
              {!data.posts.some(
                (p) => p.saves !== null || p.followers !== null
              ) && (
                <p className="nh-small">
                  补充收藏或内容新增关注后，即可探索它们与观看的关系。
                </p>
              )}
              <div className="nx-series">
                <h3>纳入哪些系列？</h3>
                <button
                  className="nh-text-btn"
                  onClick={() => {
                    setExcludedSeries([]);
                    clearSelection();
                  }}
                >
                  选择全部
                </button>
                {allSeries.map((s) => (
                  <label key={s}>
                    <input
                      type="checkbox"
                      checked={!excludedSeries.includes(s)}
                      onChange={() => {
                        setExcludedSeries((prev) =>
                          prev.includes(s)
                            ? prev.filter((v) => v !== s)
                            : [...prev, s]
                        );
                        clearSelection();
                      }}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </aside>
            <div className="nx-center">
              <section className="nh-panel nx-visual">
                <div className="nh-panel-heading">
                  <div>
                    <p className="nh-eyebrow">01 / 探索表现</p>
                    <h2>{QUESTIONS[question].title}</h2>
                  </div>
                  <span className="nh-tag">
                    {question === "series" ? "系列中位数" : "每个点是一条内容"}
                  </span>
                </div>
                <div className="nx-controls">
                  <label>
                    比较指标
                    <select
                      aria-label="探索指标"
                      value={goal}
                      onChange={(e) => {
                        setGoal(e.target.value as Goal);
                        clearSelection();
                      }}
                    >
                      {(
                        Object.entries(GOALS) as [Goal, (typeof GOALS)[Goal]][]
                      ).map(([key, g]) => (
                        <option
                          key={key}
                          value={key}
                          disabled={
                            (question === "relationship" && key === "views") ||
                            !data.posts.some((p) => p[key] !== null)
                          }
                        >
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={removeTop}
                      onChange={(e) => {
                        setRemoveTop(e.target.checked);
                        clearSelection();
                      }}
                    />
                    去掉每个系列的一个最高值
                  </label>
                </div>
                <p className="nh-small">
                  按{GOALS[goal].label}排除最高值。{result!.rows.length}{" "}
                  条内容进入图表，{result!.omitted}{" "}
                  条因缺失或排除未进入；原始记录保留在下方。
                </p>
                {data.basis !== "fixed_age" && (
                  <p className="nh-caution">
                    当前积累时长可能不同，图表仅描述这份记录，不据此推荐领先系列。
                  </p>
                )}
                {result!.rows.length ? (
                  <ExplorationChart
                    question={question}
                    goal={goal}
                    rows={result!.rows}
                    groups={result!.groups}
                    seriesDomain={allSeries}
                    onSelect={(id, series) => {
                      setSelectedId(id);
                      setInspectSeries(series);
                      setPage(0);
                    }}
                  />
                ) : (
                  <div className="nx-no-data">
                    当前没有可绘制的记录。请选中系列、补充指标，或取消最高值排除。
                  </div>
                )}
                {question === "relationship" && (
                  <p className="nh-small">
                    纵轴是次数，不是转化率。系列中位数使用该指标的全部有效记录，散点要求两个指标均有效；共同变化不能证明因果。
                  </p>
                )}
              </section>
              <section className="nh-panel nx-evidence">
                <div className="nh-panel-heading">
                  <div>
                    <p className="nh-eyebrow">02 / 核对内容</p>
                    <h2>
                      {inspectSeries
                        ? `${inspectSeries}的记录`
                        : "图表背后的每条内容"}
                    </h2>
                  </div>
                  {inspectSeries && (
                    <button className="nh-text-btn" onClick={clearSelection}>
                      查看全部记录
                    </button>
                  )}
                </div>
                <div className="nh-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>内容</th>
                        <th>系列</th>
                        <th>{GOALS[goal].label}</th>
                        <th>图中状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((p) => (
                        <tr
                          key={p.id}
                          className={selectedId === p.id ? "nx-selected" : ""}
                        >
                          <td>
                            <button
                              className="nx-record"
                              aria-pressed={selectedId === p.id}
                              onClick={() => setSelectedId(p.id)}
                            >
                              {p.title}
                            </button>
                          </td>
                          <td>{p.series}</td>
                          <td>{fmt(p[goal])}</td>
                          <td>
                            {included.has(p.id)
                              ? "已纳入"
                              : p[goal] === null ||
                                (question === "relationship" &&
                                  p.views === null)
                              ? "指标缺失"
                              : "本轮排除"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!evidence.length && <p>尚未选择系列。</p>}
                <div className="nx-pagination">
                  <span>
                    共 {evidence.length} 条 · 第 {page + 1} /{" "}
                    {Math.max(1, Math.ceil(evidence.length / 10))} 页
                  </span>
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    上一页
                  </button>
                  <button
                    disabled={(page + 1) * 10 >= evidence.length}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    下一页
                  </button>
                </div>
              </section>
              <section className="nh-panel">
                <div className="nh-panel-heading">
                  <div>
                    <p className="nh-eyebrow">继续探究</p>
                    <h2>还有想问的？</h2>
                  </div>
                  <button
                    className="nh-secondary"
                    onClick={() => setShowAi((s) => !s)}
                  >
                    {showAi ? "收起追问" : "打开 AI 追问"}
                  </button>
                </div>
                <p className="nh-muted">
                  围绕当前比较和内容记录，讨论可能的解释与验证方式。
                </p>
                {showAi && context && (
                  <Suspense fallback={<p>正在准备追问…</p>}>
                    <CreatorQuestion
                      key={JSON.stringify(context)}
                      context={context}
                    />
                  </Suspense>
                )}
              </section>
            </div>
            <aside className="nx-notebook">
              <section className="nh-panel nx-selection">
                <p className="nh-eyebrow">03 / 把发现带走</p>
                <h2>{selected ? "这条内容的依据" : "当前比较告诉了什么"}</h2>
                {selected ? (
                  <>
                    <h3>{selected.title}</h3>
                    <p>
                      {selected.series} ·{" "}
                      {selected.published || "发布时间未提供"}
                    </p>
                    <dl>
                      {(
                        Object.entries(GOALS) as [Goal, (typeof GOALS)[Goal]][]
                      ).map(([key, g]) => (
                        <React.Fragment key={key}>
                          <dt>{g.label}</dt>
                          <dd>{fmt(selected[key])}</dd>
                        </React.Fragment>
                      ))}
                    </dl>
                    <p className="nh-small">
                      {included.has(selected.id)
                        ? "当前图表已纳入这条内容。"
                        : "这条原始记录未纳入当前图表，保存时会注明。"}
                    </p>
                    <button
                      className="nh-text-btn"
                      onClick={() => setSelectedId("")}
                    >
                      回到比较概览
                    </button>
                  </>
                ) : (
                  <>
                    <h3>{advice!.title}</h3>
                    <p>{advice!.evidence}</p>
                    <p className="nh-small">{advice!.caveat}</p>
                  </>
                )}
                <button
                  className="nh-primary"
                  disabled={!result!.rows.length}
                  onClick={pinFinding}
                >
                  把当前发现加入计划 ↓
                </button>
                <p className="nh-small">
                  一起保存指标、系列、排除条件、窗口与记录。已有计划会保留。
                </p>
              </section>
              <section className="nh-panel nx-plan">
                <label htmlFor="exploration-plan">
                  <h3>下一次创作计划</h3>
                </label>
                <textarea
                  id="exploration-plan"
                  value={plan}
                  onChange={(e) => savePlan(e.target.value)}
                  placeholder="写下要尝试的变化，以及何时回来验证。"
                />
                <p className="nh-small">保存在当前浏览器，与复盘页共用。</p>
                <button
                  className="nh-secondary"
                  disabled={!plan}
                  onClick={downloadPlan}
                >
                  下载计划
                </button>
              </section>
            </aside>
          </div>
          {notice && (
            <p role="status" className="nh-message">
              {notice}
            </p>
          )}
          {error && (
            <p role="alert" className="nh-alert">
              {error}
            </p>
          )}
        </main>
      )}
      <footer>
        <strong>NextHook</strong>
        <span>为下一次创作，找到依据。</span>
        <a
          href="https://github.com/microsoft/data-formulator"
          target="_blank"
          rel="noreferrer"
        >
          开源致谢 ↗
        </a>
      </footer>
    </div>
  );
}
