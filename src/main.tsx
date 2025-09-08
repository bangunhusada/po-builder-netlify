import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
// Jika kamu tidak punya CSS, kamu boleh hapus baris ini
// atau buat file kosong src/index.css
// import "./index.css";

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
