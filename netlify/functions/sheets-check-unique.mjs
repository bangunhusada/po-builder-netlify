// netlify/functions/sheets-check-unique.mjs
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
    const num = new URLSearchParams(event.queryStringParameters || {}).get("num") || "";
    if (!num) return jsonRes(400, { error: "Missing ?num=" });
    if (!SHEET_ID) return jsonRes(500, { error: "Missing env: SHEET_ID" });

    const sheets = await getSheets();
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A:A`,
    });

    const vals = (data.values || []).flat();
    const duplicate = vals.includes(num);

    return jsonRes(200, { duplicate });
  } catch (e) {
    return jsonRes(500, { error: String(e?.message || e) });
  }
};
