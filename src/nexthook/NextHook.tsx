import React, { useMemo, useRef, useState } from "react";
import {
  BASIS_LABELS,
  GOALS,
  summarize,
  guidance,
  exportBrief,
  type Dataset,
  type Goal,
  type Basis,
} from "./analysis";
import {
  FIELDS,
  suggestMapping,
  normalize,
  readUpload,
  type RawTable,
  type Mapping,
  type Field,
} from "./import";
import { demoDataset } from "./demo";
import { platformGuides } from "./platforms";
import "./nexthook.css";
const fmt = (n: number | null) =>
  n === null
    ? "—"
    : new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(n);
import { DATA_KEY, PLAN_KEY, restore } from "./storage";
function download(
  text: string,
  name: string,
  type = "text/markdown;charset=utf-8"
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function NextHook() {
  const [data, setData] = useState<Dataset | null>(restore);
  const [goal, setGoal] = useState<Goal>("views");
  const [removeTop, setRemoveTop] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [tables, setTables] = useState<RawTable[]>([]);
  const [sheet, setSheet] = useState(0);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [platform, setPlatform] = useState("小红书");
  const [account, setAccount] = useState("");
  const [basis, setBasis] = useState<Basis>("snapshot");
  const [windowText, setWindowText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [plan, setPlan] = useState(() => {
    try {
      return localStorage.getItem(PLAN_KEY) || "";
    } catch {
      return "";
    }
  });
  const [newSeries, setNewSeries] = useState<Record<string, string>>({});
  const file = useRef<HTMLInputElement>(null);
  const groups = useMemo(
    () => (data ? summarize(data.posts, goal, removeTop) : []),
    [data, goal, removeTop]
  );
  const advice = data ? guidance(data, groups) : null;
  const max = Math.max(...groups.map((g) => g.median ?? 0), 1);
  const visible =
    data?.posts.filter((p) => !selected || p.series === selected) || [];
  function persist(next: Dataset) {
    setData(next);
    setSelected(null);
    setRemoveTop(false);
    setNewSeries({});
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(next));
    } catch {
      setMessage(
        "当前数据可用，但浏览器空间不足，未保存。请导出复盘后再关闭。"
      );
    }
  }
  function loadDemo() {
    persist(demoDataset());
    setGoal("views");
    setMessage(
      "已载入 18 条模拟内容。所有结果来自这份样例，不是真实账号表现。"
    );
    setError("");
  }
  async function upload(f: File) {
    setBusy(true);
    setError("");
    setConfirmed(false);
    try {
      const loaded = await readUpload(f);
      setTables(loaded);
      setSheet(0);
      setMapping(suggestMapping(loaded[0].headers));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  function finishImport() {
    try {
      if (!mapping || !confirmed)
        throw new Error("请确认每行对应一条内容，且数据来自同一账号。");
      const next = normalize(tables[sheet], mapping, {
        platform,
        account,
        basis,
        window: windowText,
      });
      persist(next);
      setTables([]);
      setMapping(null);
      setGoal("views");
      setError("");
      setMessage("表格已导入。你可以在下方逐条调整内容系列。");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }
  function advanced() {
    if (!data) return;
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
      window.location.assign(`/explore?goal=${goal}`);
    } catch {
      setError("浏览器未能保存当前数据，请释放存储空间后再进入探索。");
    }
  }
  return (
    <div className="nh">
      <header className="nh-nav">
        <a className="nh-brand" href="/">
          <span className="nh-mark">
            n<span>↗</span>
          </span>
          NextHook<span className="nh-alpha">PREVIEW</span>
        </a>
        <nav>
          <button className="nh-text-btn" onClick={() => setShowGuide(true)}>
            数据从哪里来？
          </button>
          <a
            href="https://github.com/Baixue-Wu/NextHook"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
        </nav>
      </header>
      <main>
        <section className="nh-hero">
          <div>
            <p className="nh-eyebrow">FROM YOUR LAST POST TO YOUR NEXT MOVE</p>
            <h1>
              读懂过去，
              <br />
              找到下一次创作的方向<span>。</span>
            </h1>
            <p className="nh-intro">
              把零散的表现，变成有依据的选择。
              <br />
              比较内容系列，看清数据背后的差别，再决定下一步尝试。
            </p>
            <div className="nh-actions">
              <button
                className="nh-primary"
                disabled={busy}
                onClick={() => file.current?.click()}
              >
                导入我的数据 <span>↗</span>
              </button>
              <button className="nh-secondary" onClick={loadDemo}>
                体验影视创作者样例
              </button>
            </div>
            <p className="nh-small">
              CSV / TSV / Excel · 无需连接社交账号 · 样例无需模型密钥
            </p>
            <input
              hidden
              ref={file}
              type="file"
              accept=".csv,.tsv,.xlsx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
                e.target.value = "";
              }}
            />
          </div>
          <aside className="nh-hero-card">
            <div className="nh-card-top">
              <span>一个更好的问题</span>
              <span className="nh-spark">✳</span>
            </div>
            <h2>
              “去掉那条爆款，
              <br />
              这个系列还值得做吗？”
            </h2>
            <div className="nh-mini-bars" aria-hidden="true">
              {[32, 51, 45, 61, 44, 94, 50, 56].map((h, i) => (
                <span
                  key={i}
                  style={{ height: `${h}%` }}
                  className={i === 5 ? "peak" : ""}
                />
              ))}
            </div>
            <p>比较整体表现，而不只看最高的一次。</p>
          </aside>
        </section>
        {error && (
          <div role="alert" className="nh-alert">
            {error}
            <button onClick={() => setError("")}>关闭</button>
          </div>
        )}
        {message && (
          <div role="status" className="nh-message">
            {message}
          </div>
        )}
        {!data && (
          <section className="nh-empty">
            <span>01 导入记录</span>
            <span>02 比较系列</span>
            <span>03 选择下一步尝试</span>
            <p>先从一个账号、一份表格开始。不预测爆款，不把相关性当成原因。</p>
          </section>
        )}
        {data && (
          <>
            <section className="nh-workspace-head">
              <div>
                <p className="nh-eyebrow">YOUR CREATIVE REVIEW</p>
                <h2>
                  {data.account}
                  <span className="nh-badge">
                    {data.demo ? "模拟样例" : data.platform}
                  </span>
                </h2>
                <p>
                  {data.name} · {data.posts.length} 条内容 ·{" "}
                  {BASIS_LABELS[data.basis]}：{data.window}
                </p>
              </div>
              <div className="nh-actions">
                <button
                  className="nh-secondary"
                  onClick={() =>
                    download(
                      exportBrief(data, goal, groups, removeTop),
                      "nexthook-review.md"
                    )
                  }
                >
                  导出复盘 ↓
                </button>
                <button
                  className="nh-secondary"
                  disabled={busy}
                  onClick={advanced}
                >
                  {busy ? "正在准备…" : "进入可视化探索 ↗"}
                </button>
              </div>
            </section>
            <div className="nh-controls">
              <div>
                <label htmlFor="goal">这次更关注什么？</label>
                <select
                  id="goal"
                  value={goal}
                  onChange={(e) => {
                    setGoal(e.target.value as Goal);
                    setSelected(null);
                  }}
                >
                  {Object.entries(GOALS).map(([k, v]) => (
                    <option
                      key={k}
                      value={k}
                      disabled={!data.posts.some((p) => p[k as Goal] !== null)}
                    >
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="nh-switch">
                <input
                  type="checkbox"
                  checked={removeTop}
                  onChange={(e) => setRemoveTop(e.target.checked)}
                />
                <span>去掉每个系列的一个最高值</span>
              </label>
            </div>
            {data.basis !== "fixed_age" && (
              <p className="nh-caution">
                不同发布时间可能带来不同积累时长。当前仅展示描述性比较，暂不给出领先系列建议。
              </p>
            )}
            <section className="nh-grid">
              <article className="nh-panel">
                <div className="nh-panel-heading">
                  <div>
                    <p className="nh-eyebrow">01 / 看清表现</p>
                    <h2>{GOALS[goal].question}</h2>
                  </div>
                  <span className="nh-tag">单篇中位数</span>
                </div>
                <p className="nh-muted">
                  中位数取排序后的中间值，减少单条极高值的影响。点击系列查看原始记录。
                </p>
                <div className="nh-bars">
                  {groups.map((g, i) => (
                    <button
                      key={g.name}
                      className={`nh-bar-row ${
                        selected === g.name ? "selected" : ""
                      }`}
                      onClick={() =>
                        setSelected(selected === g.name ? null : g.name)
                      }
                      aria-pressed={selected === g.name}
                    >
                      <span className="nh-series-name">
                        {g.name}
                        <small>
                          {g.measured} 条有效 · {g.missing} 条缺失
                        </small>
                      </span>
                      <span className="nh-bar-track">
                        <span
                          className={`nh-bar-fill bar-${i % 3}`}
                          style={{
                            width: `${
                              g.median === null
                                ? 0
                                : Math.max(1, (g.median / max) * 100)
                            }%`,
                          }}
                        />
                      </span>
                      <strong>{fmt(g.median)}</strong>
                    </button>
                  ))}
                </div>
                <div className="nh-chart-foot">
                  <span>单位：{GOALS[goal].unit} / 条内容</span>
                  <span>
                    {removeTop ? "已逐组剔除一个最高值" : "保留全部有效记录"}
                  </span>
                </div>
              </article>
              <article className="nh-panel nh-advice">
                <p className="nh-eyebrow">02 / 决定下一步</p>
                <span className="nh-tag">基于规则的尝试建议</span>
                <h2>{advice!.title}</h2>
                <p>{advice!.evidence}</p>
                <div className="nh-next">
                  <strong>可以尝试</strong>
                  <p>{advice!.next}</p>
                </div>
                <p className="nh-small">{advice!.caveat}</p>
              </article>
            </section>
            <section className="nh-panel nh-records">
              <div className="nh-panel-heading">
                <div>
                  <p className="nh-eyebrow">03 / 回到依据</p>
                  <h2>
                    {selected ? `${selected}的内容` : "每条内容，都有迹可循"}
                  </h2>
                </div>
                {selected && (
                  <button
                    className="nh-text-btn"
                    onClick={() => setSelected(null)}
                  >
                    查看所有系列
                  </button>
                )}
              </div>
              <p className="nh-muted">
                系列由你定义。修改分类后，比较结果立即更新。原始记录始终保留，包括对照中去掉的最高值。
              </p>
              <div className="nh-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>内容</th>
                      <th>发布时间</th>
                      <th>系列（可编辑）</th>
                      <th>观看</th>
                      <th>收藏</th>
                      <th>新增关注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.slice(0, 100).map((p) => (
                      <tr key={p.id}>
                        <td>{p.title}</td>
                        <td>{p.published || "未提供"}</td>
                        <td>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const value = (
                                newSeries[p.id] ?? p.series
                              ).trim();
                              if (!value) return;
                              persist({
                                ...data,
                                posts: data.posts.map((q) =>
                                  q.id === p.id ? { ...q, series: value } : q
                                ),
                              });
                            }}
                          >
                            <input
                              aria-label={`${p.title}的系列`}
                              value={newSeries[p.id] ?? p.series}
                              onChange={(e) =>
                                setNewSeries({
                                  ...newSeries,
                                  [p.id]: e.target.value,
                                })
                              }
                            />
                            {newSeries[p.id] !== undefined &&
                              newSeries[p.id] !== p.series && (
                                <button type="submit">保存</button>
                              )}
                          </form>
                        </td>
                        <td>{fmt(p.views)}</td>
                        <td>{fmt(p.saves)}</td>
                        <td>{fmt(p.followers)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {visible.length > 100 && (
                <p>预览前 100 条；计算使用全部 {visible.length} 条记录。</p>
              )}
            </section>
            <section className="nh-plan">
              <div>
                <p className="nh-eyebrow">MAKE THE NEXT MOVE YOURS</p>
                <h2>把这次发现，留给下一次创作。</h2>
                <p>记下你想改变什么，以及何时回来查看结果。</p>
              </div>
              <div>
                <textarea
                  aria-label="下一次创作计划"
                  placeholder="例如：继续做镜头拆解，这次只调整开场方式；发布 7 天后记录观看与收藏。"
                  value={plan}
                  onChange={(e) => {
                    setPlan(e.target.value);
                    try {
                      localStorage.setItem(PLAN_KEY, e.target.value);
                    } catch {
                      setError("计划未能保存到浏览器，请复制后自行保存。");
                    }
                  }}
                />
                <span className="nh-small">保存在当前浏览器</span>
                <button
                  className="nh-text-btn"
                  onClick={() =>
                    download(
                      plan,
                      "nexthook-next-experiment.txt",
                      "text/plain;charset=utf-8"
                    )
                  }
                >
                  下载计划 ↓
                </button>
              </div>
            </section>
            <button
              className="nh-text-btn nh-clear"
              onClick={() => {
                localStorage.removeItem(DATA_KEY);
                localStorage.removeItem(PLAN_KEY);
                setData(null);
                setPlan("");
                setMessage(
                  "当前浏览器中的创作者复盘和计划已清除；对话记录可在探索页单独清除，服务器会话不受影响。"
                );
              }}
            >
              清除本地复盘数据
            </button>
          </>
        )}
      </main>
      <footer>
        <strong>NextHook</strong>
        <span>Learn from past content. Shape what’s next.</span>
        <a
          href="https://github.com/microsoft/data-formulator"
          target="_blank"
          rel="noreferrer"
        >
          Built on Data Formulator ↗
        </a>
      </footer>
      {showGuide && (
        <div className="nh-overlay" onClick={() => setShowGuide(false)}>
          <section
            className="nh-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="nh-close"
              aria-label="关闭数据指南"
              onClick={() => setShowGuide(false)}
            >
              ×
            </button>
            <p className="nh-eyebrow">DATA, WITH CONTEXT</p>
            <h2 id="guide-title">先拿到自己的内容记录</h2>
            <p>
              首版一次分析一个账号、一种统计口径。支持文件导入，不自动登录或抓取平台。
            </p>
            {platformGuides.map((p) => (
              <article className="nh-platform" key={p.name}>
                <h3>
                  {p.name}
                  <span className={`nh-badge ${p.tone}`}>{p.state}</span>
                </h3>
                <p>{p.detail}</p>
                <a href={p.url} target="_blank" rel="noreferrer">
                  官方入口 ↗
                </a>
              </article>
            ))}
            <p className="nh-small">
              核查日期：2026-10-04。已确认下载渠道不等于已验证所有导出格式；导入时请核对字段。YouTube
              本身也支持分组比较。
            </p>
          </section>
        </div>
      )}
      {mapping && tables.length > 0 && (
        <div className="nh-overlay">
          <section
            className="nh-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-title"
          >
            <button
              className="nh-close"
              aria-label="取消导入"
              onClick={() => {
                setMapping(null);
                setTables([]);
                setError("");
              }}
            >
              ×
            </button>
            <p className="nh-eyebrow">BEFORE THE NUMBERS</p>
            <h2 id="import-title">确认这份数据在说什么</h2>
            <p>
              {tables[sheet].name} · {tables[sheet].rows.length}{" "}
              行。原始文件只在浏览器读取。只有发送 AI
              追问时，当前比较及记录预览才会发送到分析服务器和所选模型。
            </p>
            {error && (
              <div role="alert" className="nh-alert">
                {error}
              </div>
            )}
            {tables.length > 1 && (
              <label>
                工作表
                <select
                  value={sheet}
                  onChange={(e) => {
                    const i = Number(e.target.value);
                    setSheet(i);
                    setMapping(suggestMapping(tables[i].headers));
                    setConfirmed(false);
                  }}
                >
                  {tables.map((t, i) => (
                    <option key={i} value={i}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="nh-form-grid">
              {Object.entries(FIELDS).map(([key, field]) => (
                <label key={key}>
                  {field.label}
                  {field.required ? " *" : ""}
                  <select
                    value={mapping[key as Field]}
                    onChange={(e) =>
                      setMapping({ ...mapping, [key]: e.target.value })
                    }
                  >
                    <option value="">
                      {field.required ? "请选择对应列" : "没有此字段"}
                    </option>
                    {tables[sheet].headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <label>
                平台
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  {["小红书", "抖音", "YouTube", "Instagram", "其他"].map(
                    (p) => (
                      <option key={p}>{p}</option>
                    )
                  )}
                </select>
              </label>
              <label>
                账号标识
                <input
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="自定义昵称，无需账号密码"
                />
              </label>
              <label>
                统计口径
                <select
                  value={basis}
                  onChange={(e) => setBasis(e.target.value as Basis)}
                >
                  {Object.entries(BASIS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                观察窗口
                <input
                  value={windowText}
                  onChange={(e) => setWindowText(e.target.value)}
                  placeholder={
                    basis === "fixed_age"
                      ? "例如：每条发布后 7 天"
                      : "例如：9 月 1 日至 30 日／截至 10 月 4 日"
                  }
                />
              </label>
            </div>
            <p className="nh-small">
              “新增关注”必须是该条内容带来的关注数，不是账号粉丝总量。缺少系列时先记为“未分类”，导入后可逐条修改。请删除合计行。
            </p>
            <label className="nh-switch">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              每行是一条内容，来自同一账号；我已核对指标和观察窗口。
            </label>
            <button
              className="nh-primary"
              disabled={!confirmed}
              onClick={finishImport}
            >
              开始复盘 →
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
