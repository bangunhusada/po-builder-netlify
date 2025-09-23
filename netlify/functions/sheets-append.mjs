// netlify/functions/sheets-append.mjs
import { getSheets } from "./_sheetsClient.mjs";

const SHEET_ID = process.env.SHEET_ID;
const SHEET_TAB = process.env.SHEET_TAB || "Sheet1";

const jsonRes = (code, body) => ({
  statusCode: code,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return jsonRes(405, { error: "Method not allowed" });
    }
    if (!SHEET_ID) return jsonRes(500, { error: "Missing env: SHEET_ID" });

    const { payload } = JSON.parse(event.body || "{}");
    if (!payload) return jsonRes(400, { error: "Missing payload" });

    const sheets = await getSheets();

    // Contoh mapping → samakan dengan format yang kamu mau
    const now = new Date().toISOString();
    const ringkasan = (payload.items || [])
      .map((x, i) => `${i + 1}. ${x.nama || ""} ${x.jumlah ? `(${x.jumlah})` : ""}`)
      .join(" | ");

    const values = [[
      payload.header?.nomorSP || "",
      payload.poType || "",
      payload.pbf?.nama || "",
      now,
      ringkasan,
      JSON.stringify(payload), // simpan JSON lengkap untuk "Pulihkan"
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });

    return jsonRes(200, { ok: true });
  } catch (e) {
    return jsonRes(500, { error: String(e?.message || e) });
  }
};
