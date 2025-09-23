// netlify/functions/sheets-history.js
import { getSheets } from "./_sheetsClient.js";

export async function handler() {
  try {
    const SHEET_ID = process.env.SHEET_ID;
    const SHEET_TAB = process.env.SHEET_TAB || "Data";
    if (!SHEET_ID) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing SHEET_ID" }) };
    }

    const sheets = getSheets();
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A:E`
    });

    const rows = (resp.data.values || [])
      .slice(1) // skip header kalau ada
      .map((r, idx) => ({
        idx,
        tanggal: r[0] || "",
        nomorSP: r[1] || "",
        jenis: r[2] || "",
        ringkasan: r[3] || "",
        json: r[4] || ""
      }));

    return { statusCode: 200, body: JSON.stringify({ rows }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e.message || e) }) };
  }
}
