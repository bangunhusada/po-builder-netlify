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
export const handler = async (_event) => {
  const miss = badEnv();
  if (miss.length) {
    return jsonRes(500, { error: "Missing env: " + miss.join(", ") });
  }
  try {
    const range = `${SHEET_TAB}!A:Z`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}/values/${encodeURIComponent(range)}?key=${encodeURIComponent(API_KEY)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data?.error) {
      return jsonRes(res.status || 500, { error: data?.error?.message || "Sheets history failed", raw: data });
    }
    const values = data?.values || [];
    const rows = values
      .map((r, idx) => ({
        idx,
        tanggal: r?.[0] || "",
        nomorSP: r?.[1] || "",
        namaKlinik: r?.[2] || "",
        pemesan: r?.[3] || "",
        jenis: r?.[4] || "",
        ringkasan: r?.[5] || "",
        json: r?.[6] || ""
      }))
      .filter(r => r.tanggal || r.nomorSP || r.json)
      .slice(1);
    return jsonRes(200, { rows });
  } catch (e) {
    return jsonRes(500, { error: String(e?.message || e) });
  }
};