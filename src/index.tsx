// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from "react";
import "./index.css";

import "./i18n";

import store, { persistor } from "./app/store";
import { Provider } from "react-redux";

import { Suspense, lazy } from "react";
import { NextHook } from "./nexthook/NextHook";
const Exploration = lazy(() =>
  import("./nexthook/Exploration").then((m) => ({ default: m.Exploration }))
);
const showExplorer = ["/explore", "/app"].includes(window.location.pathname);

import { PersistGate } from "redux-persist/integration/react";
import { createRoot } from "react-dom/client";

document.documentElement.classList.add("nexthook-page");

const domNode = document.getElementById("root") as HTMLElement;
const root = createRoot(domNode);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {showExplorer ? (
          <Suspense fallback={<p>正在加载 NextHook 探索页…</p>}>
            <Exploration />
          </Suspense>
        ) : (
          <NextHook />
        )}
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
