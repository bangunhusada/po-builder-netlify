const SHEET_ID = process.env.SHEET_ID;
const API_KEY = process.env.API_KEY;
const SHEET_TAB = process.env.SHEET_TAB || "Sheet1";

function badEnv() {
  const miss = [];
  if (!SHEET_ID) miss.push("SHEET_ID");
  if (!API_KEY) miss.push("API_KEY");
  return miss;
}

function jsonRes(statusCode, bodyObj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(bodyObj)
  };
}
export const handler = async (event) => {
  const miss = badEnv();
  if (miss.length) {
    return jsonRes(500, { error: "Missing env: " + miss.join(", ") });
  }
  try {
    const params = new URLSearchParams(event.rawQuery || event.queryStringParameters || {});
    const num = params.get ? params.get("num") : (event.queryStringParameters?.num || "");

    const range = `${SHEET_TAB}!B:B`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}/values/${encodeURIComponent(range)}?key=${encodeURIComponent(API_KEY)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data?.error) {
      return jsonRes(res.status || 500, { error: data?.error?.message || "Sheets check failed", raw: data });
    }
    const values = (data?.values || []).flat();
    const duplicate = !!(num && values.includes(num));
    return jsonRes(200, { duplicate });
  } catch (e) {
    return jsonRes(500, { error: String(e?.message || e) });
  }
};