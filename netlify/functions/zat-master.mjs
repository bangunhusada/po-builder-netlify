// Netlify Function (ESM) untuk tarik master Prekursor/OOT dari Google Sheets
// GET /.netlify/functions/zat-master?action=pull&type=pre|oot
import { getSheets } from "./_sheetsClient.mjs";

const TAB_PRE = "Zat_Pre";
const TAB_OOT = "Zat_OOT";

function headerMap(name = "") {
  const n = String(name).trim().toLowerCase();
  if (["nama", "nama obat", "nama_obat"].includes(n)) return "nama_obat";
  if (["zat", "zat aktif", "zat_aktif"].includes(n)) return "zat_aktif";
  if (["bentuk", "bentuk & kekuatan", "bentuk dan kekuatan", "bentuk_kekuatan"].includes(n)) return "bentuk_kekuatan";
  if (["satuan"].includes(n)) return "satuan";
  return null;
}

function parseRows(values = []) {
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
    if (obj.nama_obat || obj.zat_aktif) items.push(obj);
  }
  return items;
}

export default async function handler(request) {
  try {
    const url = new URL(request.url);
    const action = (url.searchParams.get("action") || "pull").toLowerCase();
    const type = (url.searchParams.get("type") || "").toLowerCase(); // pre | oot

    if (request.method !== "GET")
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });

    if (action !== "pull")
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });

    if (!["pre", "oot"].includes(type))
      return new Response(JSON.stringify({ error: "Param 'type' harus 'pre' atau 'oot'" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });

    const sheetId = process.env.SHEET_ID;
    if (!sheetId)
      return new Response(JSON.stringify({ error: "SHEET_ID env belum diset" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });

    const sheets = await getSheets();
    const range = (type === "pre" ? TAB_PRE : TAB_OOT) + "!A:Z";
    const resp = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
    const values = resp?.data?.values || [];
    const items = parseRows(values);

    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  } catch (err) {
    console.error("zat-master error:", err);
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
