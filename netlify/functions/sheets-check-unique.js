// netlify/functions/sheets-check-unique.js
import { getSheets } from "./_sheetsClient.js";

export async function handler(event) {
  try {
    const num = new URLSearchParams(event.rawQuery || event.queryStringParameters || {}).get("num") || "";
    if (!num) return { statusCode: 200, body: JSON.stringify({ duplicate: false }) };

    const SHEET_ID = process.env.SHEET_ID;
    const SHEET_TAB = process.env.SHEET_TAB || "Data";
    if (!SHEET_ID) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing SHEET_ID" }) };
    }

    const sheets = getSheets();
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!B:B` // kolom Nomor SP
    });

    const col = resp.data.values || [];
    const dup = col.some((row) => (row?.[0] || "").trim() === num.trim());
    return { statusCode: 200, body: JSON.stringify({ duplicate: dup }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e.message || e) }) };
  }
}
