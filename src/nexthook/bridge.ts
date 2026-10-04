import store, { persistor } from "../app/store";
import { dfActions } from "../app/dfSlice";
import { apiRequest } from "../app/apiClient";
import { saveWorkspaceState } from "../app/workspaceService";
import { getSerializableState } from "../app/useAutoSave";
import { generateUUID } from "../app/identity";
import { loadTable } from "../app/tableThunks";
import { createTableFromFromObjectArray } from "../data/utils";
import { BASIS_LABELS, type Dataset, type Goal, GOALS } from "./analysis";
export async function openWorkbench(data: Dataset, goal: Goal): Promise<void> {
  const { data: config } = await apiRequest<any>("/api/app-config");
  store.dispatch(dfActions.setServerConfig(config));
  if (config.IDENTITY) store.dispatch(dfActions.setIdentity(config.IDENTITY));
  if (store.getState().activeWorkspace)
    await saveWorkspaceState(getSerializableState(store.getState()));
  store.dispatch(
    dfActions.resetForNewWorkspace({
      id: `nexthook_${generateUUID()}`,
      displayName: `NextHook · ${data.account}`,
    })
  );
  const rows = data.posts.map((p) => ({
    ...p,
    platform: data.platform,
    account: data.account,
    observation_basis: BASIS_LABELS[data.basis],
    observation_window: data.window,
    source_is_demo: data.demo,
  }));
  const table = createTableFromFromObjectArray(`NextHook_${Date.now()}`, rows);
  const loaded = await store.dispatch(loadTable({ table })).unwrap();
  // Persist the actual upstream table before opening its analysis workspace.
  await saveWorkspaceState(getSerializableState(store.getState()));
  await persistor.flush();
  sessionStorage.setItem(
    "nexthook-workbench-context",
    JSON.stringify({
      tableId: loaded.table.id,
      prompt: `分析表 ${loaded.table.id}。${
        GOALS[goal].question
      } 按 series 分组，使用 ${goal} 的中位数，显示有效样本量和缺失数，再检查去掉各系列最高值后的结果。数据口径是${
        BASIS_LABELS[data.basis]
      }：${data.window}。${
        data.demo ? "这是模拟数据，只用于演示。" : ""
      }不要推断因果或承诺未来效果。请用中文解释依据和局限。`,
    })
  );
  window.location.assign("/app");
}
