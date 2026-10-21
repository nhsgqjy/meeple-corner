import React from "react";
import { createRoot } from "react-dom/client";
import Home from "../app/page";
import "../app/globals.css";
window.__MEEPLE_CONFIG__ = { apiBase: import.meta.env.VITE_API_BASE || "https://meeple-corner-api.812097204.workers.dev", assetBase: import.meta.env.BASE_URL.replace(/\/$/, "") };
createRoot(document.getElementById("root")!).render(<React.StrictMode><Home/></React.StrictMode>);
