// Netlify Function: tarik master Prekursor & OOT dari Google Sheets
// GET /.netlify/functions/zat-master?action=pull&type=pre|oot
// Response: { items: [{ nama_obat, zat_aktif, bentuk_kekuatan?, satuan? }, ...] }

import { getSheets } from "./_sheetsClient.mjs";

// Konfigurasi nama tab
const TAB_PRE = "Zat_Pre";
const TAB_OOT = "Zat_OOT";

// Normalisasi nama kolom header -> key yang dipakai app
function headerMap(name = "") {
  const n = String(name).trim().toLowerCase();
  if (["nama", "nama obat", "nama_obat"].includes(n)) return "nama_obat";
  if (["zat", "zat aktif", "zat_aktif"].includes(n)) return "zat_aktif";
  if (
    ["bentuk", "bentuk & kekuatan", "bentuk dan kekuatan", "bentuk_kekuatan"].includes(
      n
    )
  )
    return "bentuk_kekuatan";
  if (["satuan"].includes(n)) return "satuan";
  return null; // kolom tak dikenal -> di-skip
}

function parseRows(values = []) {
  // values: array of array dari sheets API
  if (!Array.isArray(values) || values.length === 0) return [];
  const headerRow = values[0] || [];
  const idxToKey = headerRow.map((h) => headerMap(h));

  const items = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r] || [];
    const obj = { nama_obat: "", zat_aktif: "", bentuk_kekuatan: "", satuan: "" };

    for (let c = 0; c < row.length; c++) {
      const key = idxToKey[c];
      if (!key) continue;
      obj[key] = String(row[c] ?? "").trim();
    }

    // Minimal: harus ada nama atau zat
    if (obj.nama_obat || obj.zat_aktif) {
      items.push(obj);
    }
  }
  return items;
}

export default async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const action = url.searchParams.get("action") || "pull";
    const type = (url.searchParams.get("type") || "").toLowerCase(); // pre | oot

    if (req.method !== "GET") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }
    if (action !== "pull") {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Unknown action" }));
      return;
    }
    if (!["pre", "oot"].includes(type)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Param 'type' harus 'pre' atau 'oot'" }));
      return;
    }

    // Ambil data dari Sheets
    const sheets = await getSheets();
    const sheetId = process.env.SHEET_ID;
    if (!sheetId) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "SHEET_ID env belum diset" }));
      return;
    }

    const range = (type === "pre" ? TAB_PRE : TAB_OOT) + "!A:Z";
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const values = resp?.data?.values || [];
    const items = parseRows(values);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ items }));
  } catch (err) {
    console.error("zat-master error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: err?.message || String(err) }));
  }
};
