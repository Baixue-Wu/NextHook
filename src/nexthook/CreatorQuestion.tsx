import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import store from "../app/store";
import { dfActions, dfSelectors, fetchGlobalModelList } from "../app/dfSlice";
import { apiRequest } from "../app/apiClient";
import { ModelSelectionButton } from "../views/ModelSelectionDialog";
import i18n from "../i18n";
export function CreatorQuestion({
  context,
}: {
  context: Record<string, unknown>;
}) {
  const model = useSelector(dfSelectors.getActiveModel);
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    void (async () => {
      await i18n.changeLanguage("zh");
      const { data: config } = await apiRequest<any>("/api/app-config");
      if (!live) return;
      store.dispatch(dfActions.setServerConfig(config));
      if (config.IDENTITY)
        store.dispatch(dfActions.setIdentity(config.IDENTITY));
      await store.dispatch(fetchGlobalModelList()).unwrap();
      if (live) setReady(true);
    })().catch((e) => {
      if (live) setError(`分析服务连接失败：${e.message}`);
    });
    return () => {
      live = false;
    };
  }, []);
  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!model || !question.trim() || busy) return;
    setBusy(true);
    setError("");
    const q = question.trim();
    try {
      const { data } = await apiRequest<{ answer: string }>(
        "/api/nexthook/question",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            question: q,
            context,
            history: history.slice(-6),
          }),
          signal: AbortSignal.timeout(90000),
        }
      );
      setHistory((h) => [
        ...h,
        { role: "user", content: q },
        { role: "assistant", content: data.answer },
      ]);
      setQuestion("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="nx-ai">
      <div className="nh-panel-heading">
        <h3>追问这份比较</h3>
        <ModelSelectionButton appearance="inline" />
      </div>
      <p className="nh-small">
        {model
          ? "发送后，当前比较、最多 50 条图中记录、选中内容及最近三轮对话会交给所选模型。"
          : "配置模型后可以追问。图表和创作计划无需模型。"}
        切换比较条件后会开始新对话。
      </p>
      {history.map((m, i) => (
        <div className={`nx-chat ${m.role}`} key={i}>
          <strong>{m.role === "user" ? "你" : "AI 解读 · 请核对依据"}</strong>
          <p>{m.content}</p>
        </div>
      ))}
      {error && (
        <p role="alert" className="nh-alert">
          {error}
        </p>
      )}
      <form onSubmit={ask}>
        <label htmlFor="creator-question">围绕当前证据，继续问一个问题</label>
        <textarea
          id="creator-question"
          maxLength={2000}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例如：这个差别可能有哪些解释？下次该控制什么条件来验证？"
        />
        <button
          className="nh-primary"
          disabled={!ready || !model || !question.trim() || busy}
        >
          {busy ? "正在分析…" : "发送追问"}
        </button>
      </form>
    </section>
  );
}
