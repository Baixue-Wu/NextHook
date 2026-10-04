import store, { persistor } from "../app/store";
import { dfActions } from "../app/dfSlice";
import { loadTable } from "../app/tableThunks";
import { createTableFromFromObjectArray } from "../data/utils";
import { saveWorkspaceState } from "../app/workspaceService";
import { getSerializableState } from "../app/useAutoSave";
import { toAnalystTableRef } from "../app/tableResolution";
import type { Dataset } from "./analysis";
import type { AnalystSession } from "./conversation";
export async function createAnalystSession(
  data: Dataset
): Promise<AnalystSession> {
  if (store.getState().activeWorkspace)
    await saveWorkspaceState(getSerializableState(store.getState()));
  const workspaceId = `nexthook_${crypto.randomUUID()}`;
  store.dispatch(
    dfActions.resetForNewWorkspace({
      id: workspaceId,
      displayName: `NextHook · ${data.account}`,
    })
  );
  const rows = data.posts.map((p) => ({
    ...p,
    platform: data.platform,
    account: data.account,
    observation_basis: data.basis,
    observation_window: data.window,
    source_is_demo: data.demo,
  }));
  const table = createTableFromFromObjectArray("creator_posts", rows);
  const loaded = await store
    .dispatch(loadTable({ table, inferSemanticTypes: false }))
    .unwrap();
  const input = store
    .getState()
    .inputTables.find((t) => t.id === loaded.table.id);
  if (!input) throw new Error("内容表未能写入分析会话，请重试。");
  await saveWorkspaceState(getSerializableState(store.getState()));
  await persistor.flush();
  return { workspaceId, table: toAnalystTableRef(input) };
}
