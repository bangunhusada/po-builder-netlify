// netlify/functions/sheets-history.mjs
import { getSheets } from "./_sheetsClient.mjs";

const SHEET_ID = process.env.SHEET_ID;
const SHEET_TAB = process.env.SHEET_TAB || "Sheet1";

const jsonRes = (code, body) => ({
  statusCode: code,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body),
});

export const handler = async () => {
  try {
    if (!SHEET_ID) return jsonRes(500, { error: "Missing env: SHEET_ID" });

    const sheets = await getSheets();
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A:F`,
    });

    const rows = (data.values || []).slice(1).map((r, idx) => ({
      idx,
      nomorSP: r[0] || "",
      jenis: r[1] || "",
      pbf: r[2] || "",
      tanggal: r[3] || "",
      ringkasan: r[4] || "",
      json: r[5] || "",
    }));

    return jsonRes(200, { rows });
  } catch (e) {
    return jsonRes(500, { error: String(e?.message || e) });
  }
};
