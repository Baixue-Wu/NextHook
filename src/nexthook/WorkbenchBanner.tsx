import React, { useState } from "react";
export function WorkbenchBanner() {
  const [copied, setCopied] = useState(false);
  let context: { prompt?: string } = {};
  try {
    context = JSON.parse(
      sessionStorage.getItem("nexthook-workbench-context") || "{}"
    );
  } catch {
    /* Context is optional; tables live in the upstream workspace. */
  }
  return (
    <div
      style={{
        padding: "10px 20px",
        background: "#163e35",
        color: "white",
        fontFamily: "sans-serif",
        fontSize: 13,
        display: "flex",
        gap: 18,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <a href="/" style={{ color: "white", fontWeight: 700 }}>
        ← NextHook 创作复盘
      </a>
      <span>自由分析 · Data Formulator 工作台 · 配置模型后可连续追问</span>
      {context.prompt && (
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(context.prompt!);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "问题已复制" : "复制本次分析问题"}
        </button>
      )}
      {context.prompt && (
        <details>
          <summary>查看问题</summary>
          <p style={{ maxWidth: 800 }}>{context.prompt}</p>
        </details>
      )}
    </div>
  );
}
