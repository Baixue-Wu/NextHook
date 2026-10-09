import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { NextHook } from "./nexthook/NextHook";
import { Exploration } from "./nexthook/Exploration";

document.documentElement.classList.add("nexthook-page");
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {new URLSearchParams(location.search).get("view") === "explore"
      ? <Exploration /> : <NextHook />}
  </React.StrictMode>
);
