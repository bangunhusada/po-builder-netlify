// netlify/functions/sheets-append.js
import { getSheets } from "./_sheetsClient.js";

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { payload } = JSON.parse(event.body || "{}");
    if (!payload) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing payload" }) };
    }

    const SHEET_ID = process.env.SHEET_ID;
    const SHEET_TAB = process.env.SHEET_TAB || "Data";
    if (!SHEET_ID) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing SHEET_ID" }) };
    }

    const sheets = getSheets();

    // Simpan ringkasan + JSON utuh
    const now = new Date();
    const tanggal = now.toLocaleString("id-ID");
    const nomorSP = payload?.header?.nomorSP || "";
    const jenis = payload?.poType || "";
    const ringkasan = (payload?.items || [])
      .map((it) => it?.nama)
      .filter(Boolean)
      .slice(0, 3)
      .join(", ");

    const values = [[
      tanggal,
      nomorSP,
      jenis,
      ringkasan,
      JSON.stringify(payload)
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A:E`,
      valueInputOption: "RAW",
      requestBody: { values }
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e.message || e) }) };
  }
}
